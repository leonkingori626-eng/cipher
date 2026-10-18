import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  loadDatabase,
  saveDatabase,
  DBschema,
  User,
  Workspace,
  Membership,
  WorkspaceRole,
  hashPassword,
  verifyPassword,
  generateSessionToken,
  DEFAULT_WORKSPACE_ID,
  DEFAULT_OWNER_ID,
  createDatabaseBackup,
  listDatabaseBackups,
  restoreDatabaseBackup
} from './server/db';

dotenv.config();

// Startup Environment Validation (Never log secrets or API keys)
function validateEnvironment(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (process.env.GEMINI_API_KEY) {
    console.info(`[STARTUP] Environment: ${nodeEnv}. Gemini AI integration configured securely via server environment.`);
  } else {
    console.warn(`[STARTUP] Environment: ${nodeEnv}. Notice: GEMINI_API_KEY is not configured. AI generation will run in resilient fallback mode.`);
  }
}
validateEnvironment();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Size-limited Body Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// CORS Origin Middleware
const configuredOrigins = (process.env.ALLOWED_ORIGINS || process.env.APP_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) {
    return next();
  }
  if (process.env.NODE_ENV !== 'production' || configuredOrigins.length === 0 || configuredOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-workspace-id, x-session-token, x-requested-with');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Lightweight Cookie Parser Middleware
app.use((req, _res, next) => {
  const cookieHeader = req.headers.cookie;
  const cookies: Record<string, string> = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(c => {
      const parts = c.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        try {
          cookies[key] = decodeURIComponent(val);
        } catch (_) {
          cookies[key] = val;
        }
      }
    });
  }
  (req as any).cookies = cookies;
  next();
});

// Extend express Request to hold auth and workspace context
declare global {
  namespace Express {
    interface Request {
      user?: User;
      workspace?: Workspace;
      membership?: Membership;
      role?: WorkspaceRole;
      sessionToken?: string;
      tokenSource?: 'header' | 'cookie';
      cookies?: Record<string, string>;
    }
  }
}

// Load persistent database state on startup
let db: DBschema;
try {
  db = loadDatabase();
} catch (initErr: any) {
  console.error('[FATAL] CIPHER Database initialization failed:', initErr.message);
  process.exit(1);
}

function persist(): void {
  saveDatabase(db);
}

function logAudit(
  workspaceId: string,
  actor: string,
  action: string,
  resource: string,
  outcome: 'Success' | 'Blocked' | 'Warning',
  details: string
) {
  db.auditEvents.unshift({
    id: `aud-${Date.now()}`,
    workspaceId,
    actor,
    action,
    resource,
    timestamp: new Date().toISOString(),
    outcome,
    details
  });
  persist();
}

// System Health and Readiness Endpoints
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/ready', (_req, res) => {
  try {
    const isReady = !!db && Array.isArray(db.workspaces) && db.workspaces.length > 0;
    if (isReady) {
      res.json({
        status: 'ready',
        database: 'connected',
        storageArchitecture: 'single-instance file-backed json',
        rateLimiterArchitecture: 'in-memory sliding window (single-instance)',
        workspacesCount: db.workspaces.length,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({ status: 'not_ready', error: 'Database not initialized' });
    }
  } catch (err: any) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

// In-memory rate limiting map for login attempts: IP/email -> { count, lockUntil }
// NOTE: In-memory maps require single application instance. Multi-instance scaling requires Redis.
const loginRateLimits = new Map<string, { count: number; lockUntil: number }>();
const windowRateLimits = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(key: string): boolean {
  const record = loginRateLimits.get(key);
  if (!record) return true;
  if (record.lockUntil > Date.now()) return false;
  if (record.lockUntil <= Date.now()) {
    loginRateLimits.delete(key);
  }
  return true;
}

function recordLoginFailure(key: string): void {
  const record = loginRateLimits.get(key) || { count: 0, lockUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
  }
  loginRateLimits.set(key, record);
}

function clearLoginFailures(key: string): void {
  loginRateLimits.delete(key);
}

// Sliding window rate limiter for registration, public chat, and submissions
function checkWindowRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = windowRateLimits.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    windowRateLimits.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}

// Extract token from request: Bearer header, x-session-token, or secure HttpOnly cookie
function extractToken(req: express.Request): { token: string | null; source: 'header' | 'cookie' } {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return { token: authHeader.substring(7).trim(), source: 'header' };
  }
  const sessionTokenHeader = req.headers['x-session-token'];
  if (typeof sessionTokenHeader === 'string' && sessionTokenHeader.trim()) {
    return { token: sessionTokenHeader.trim(), source: 'header' };
  }
  const cookieToken = req.cookies?.cipher_session_token;
  if (typeof cookieToken === 'string' && cookieToken.trim()) {
    return { token: cookieToken.trim(), source: 'cookie' };
  }
  return { token: null, source: 'header' };
}

// Helper to set secure, HttpOnly, SameSite session cookie
function setAuthCookie(res: express.Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('cipher_session_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/'
  });
}

// Authentication middleware (resolves user & active workspace)
function authMiddleware(options: { required: boolean }) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { token, source } = extractToken(req);
    req.tokenSource = source;

    // CSRF defense for cookie-authenticated state-changing requests
    if (source === 'cookie' && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const customHeader = req.headers['x-workspace-id'] || req.headers['x-requested-with'];
      const origin = req.headers.origin;
      const host = req.headers.host;
      const isOriginSafe = origin && host ? origin.includes(host) : true;
      if (!customHeader && !isOriginSafe) {
        return res.status(403).json({ error: 'Forbidden', message: 'CSRF verification failed' });
      }
    }

    if (!token) {
      if (options.required) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      }
      // Public / fallback: use default workspace
      const defaultWs = db.workspaces.find(w => w.id === DEFAULT_WORKSPACE_ID) || db.workspaces[0];
      req.workspace = defaultWs;
      return next();
    }

    const session = db.sessions.find(s => s.token === token);
    if (!session || new Date(session.expiresAt) <= new Date()) {
      if (options.required) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Session expired or invalid' });
      }
      const defaultWs = db.workspaces.find(w => w.id === DEFAULT_WORKSPACE_ID) || db.workspaces[0];
      req.workspace = defaultWs;
      return next();
    }

    const user = db.users.find(u => u.id === session.userId);
    if (!user) {
      if (options.required) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
      }
      return next();
    }

    req.user = user;
    req.sessionToken = token;

    // Resolve workspace: header x-workspace-id or first workspace user belongs to
    const requestedWsId = req.headers['x-workspace-id'] as string;
    const userMemberships = db.memberships.filter(m => m.userId === user.id);

    let activeMembership: Membership | undefined;
    let targetWs: Workspace | undefined;

    if (requestedWsId) {
      activeMembership = userMemberships.find(m => m.workspaceId === requestedWsId);
      targetWs = db.workspaces.find(w => w.id === requestedWsId);
      if (!activeMembership || !targetWs) {
        if (options.required) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Access to the requested workspace is denied'
          });
        }
      }
    } else {
      // Default to first membership or default workspace
      activeMembership = userMemberships[0];
      if (activeMembership) {
        targetWs = db.workspaces.find(w => w.id === activeMembership!.workspaceId);
      }
      if (!targetWs) {
        targetWs = db.workspaces.find(w => w.id === DEFAULT_WORKSPACE_ID) || db.workspaces[0];
      }
    }

    req.workspace = targetWs;
    req.membership = activeMembership;
    req.role = activeMembership?.role || 'Operator';
    next();
  };
}

const requireAuth = authMiddleware({ required: true });
const optionalAuth = authMiddleware({ required: false });

function requireRole(allowedRoles: WorkspaceRole[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.role || !allowedRoles.includes(req.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
}

// -----------------------------------------------------------------------------
// AUTHENTICATION ROUTES
// -----------------------------------------------------------------------------

// User Registration
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, businessName, businessType } = req.body;

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Validation Error', message: 'A valid email address is required.' });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Validation Error', message: 'Password must be at least 8 characters long.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existingUser = db.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existingUser) {
    return res.status(409).json({ error: 'Conflict', message: 'An account with this email address already exists.' });
  }

  const userId = `usr-${Date.now()}`;
  const userName = (name || cleanEmail.split('@')[0]).trim();
  const passwordHash = hashPassword(password);

  const newUser: User = {
    id: userId,
    email: cleanEmail,
    passwordHash,
    name: userName,
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);

  // Create initial workspace for the user
  const wsName = (businessName || `${userName}'s Business`).trim();
  const rawSlug = wsName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const wsSlug = rawSlug ? `${rawSlug}-${Date.now().toString().slice(-4)}` : `business-${Date.now().toString().slice(-4)}`;
  const wsId = `ws-${Date.now()}`;

  const defaultProfile = {
    name: wsName,
    type: businessType || 'General Business',
    description: `Welcome to ${wsName}. We are dedicated to providing excellent products and services.`,
    contactEmail: cleanEmail,
    contactPhone: '(555) 010-0000',
    businessHours: 'Mon - Fri: 9:00 AM - 5:00 PM',
    timeZone: 'EST',
    supportTone: 'Warm, professional, and efficient',
    escalationInstructions: 'Notify team when inquiry requires custom handling',
    emergencyStopActive: false,
    slug: wsSlug,
    tagline: 'Quality and service you can depend on.',
    published: true,
    template: 'Modern Clean' as const,
    workspaceId: wsId
  };

  const newWorkspace: Workspace = {
    id: wsId,
    name: wsName,
    slug: wsSlug,
    ownerId: userId,
    profile: defaultProfile,
    createdAt: new Date().toISOString()
  };
  db.workspaces.push(newWorkspace);

  const newMembership: Membership = {
    id: `mem-${Date.now()}`,
    workspaceId: wsId,
    userId: userId,
    role: 'Owner',
    joinedAt: new Date().toISOString()
  };
  db.memberships.push(newMembership);

  // Initialize workspace assistant config
  const defaultAssistant = {
    name: `${wsName} Guide`,
    workspaceName: wsName,
    tone: 'Warm and helpful',
    model: 'gemini-2.5-flash',
    temperature: 0.3,
    maxTokens: 500,
    escalationThreshold: 'Medium',
    enabled: true,
    version: '1.0.0',
    lastTested: 'Just configured',
    workspaceId: wsId
  };
  // Store or maintain assistantConfig per workspace
  db.assistantConfig = defaultAssistant;

  // Create session
  const token = generateSessionToken();
  const session = {
    token,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
  db.sessions.push(session);

  persist();
  logAudit(wsId, userName, 'User Registered', cleanEmail, 'Success', `Created user account and initial workspace ${wsName}.`);

  setAuthCookie(res, token);
  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({
    user: safeUser,
    token,
    workspaces: [newWorkspace],
    currentWorkspace: newWorkspace,
    role: 'Owner'
  });
});

// User Sign-in
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const cleanEmail = (email || '').trim().toLowerCase();
  const rateLimitKey = `${ip}:${cleanEmail}`;

  if (!checkRateLimit(rateLimitKey)) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many failed login attempts. Please wait 15 minutes before trying again.'
    });
  }

  if (!cleanEmail || !password) {
    return res.status(400).json({ error: 'Validation Error', message: 'Email and password are required.' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    recordLoginFailure(rateLimitKey);
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password.' });
  }

  clearLoginFailures(rateLimitKey);

  // Create new session token
  const token = generateSessionToken();
  db.sessions.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  const userMemberships = db.memberships.filter(m => m.userId === user.id);
  const userWsIds = userMemberships.map(m => m.workspaceId);
  const userWorkspaces = db.workspaces.filter(w => userWsIds.includes(w.id));
  const currentWs = userWorkspaces[0] || db.workspaces[0];
  const currentMembership = userMemberships.find(m => m.workspaceId === currentWs?.id);
  const role = currentMembership?.role || 'Operator';

  persist();
  logAudit(currentWs?.id || DEFAULT_WORKSPACE_ID, user.name, 'Sign In', cleanEmail, 'Success', `User logged in successfully.`);

  setAuthCookie(res, token);
  const { passwordHash: _, ...safeUser } = user;
  res.json({
    user: safeUser,
    token,
    workspaces: userWorkspaces,
    currentWorkspace: currentWs,
    role
  });
});

// User Sign-out
app.post('/api/auth/logout', (req, res) => {
  const { token } = extractToken(req);
  const bodyToken = req.body?.token;
  const targetToken = token || bodyToken;
  if (targetToken) {
    db.sessions = db.sessions.filter(s => s.token !== targetToken);
    persist();
  }
  res.clearCookie('cipher_session_token', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully' });
});

// Current User & Active Session Info
app.get('/api/auth/me', requireAuth, (req, res) => {
  const userMemberships = db.memberships.filter(m => m.userId === req.user!.id);
  const userWsIds = userMemberships.map(m => m.workspaceId);
  const userWorkspaces = db.workspaces.filter(w => userWsIds.includes(w.id));

  const { passwordHash: _, ...safeUser } = req.user!;
  res.json({
    user: safeUser,
    workspaces: userWorkspaces,
    currentWorkspace: req.workspace,
    role: req.role
  });
});

// Password Recovery Request
app.post('/api/auth/forgot-password', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkWindowRateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000)) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many password recovery requests. Please try again later.'
    });
  }

  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Validation Error', message: 'Email is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.users.find(u => u.email.toLowerCase() === cleanEmail);

  if (user) {
    const resetToken = crypto.randomBytes(24).toString('hex');
    const resetRecord = {
      token: resetToken,
      email: cleanEmail,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      used: false
    };
    db.passwordResetTokens.push(resetRecord);
    persist();
    logAudit(DEFAULT_WORKSPACE_ID, 'System', 'Password Reset Requested', cleanEmail, 'Success', `Password reset token generated.`);

    const isProd = process.env.NODE_ENV === 'production';
    return res.json({
      success: true,
      deliveryStatus: isProd ? 'unconfigured' : 'simulated',
      message: isProd
        ? 'Password reset instructions have been recorded. Note: Outbound email service is unconfigured.'
        : 'Password reset instructions generated (Simulated Mode: dev recovery token included).',
      // In production, NEVER expose resetToken in API responses
      resetToken: isProd ? undefined : resetToken
    });
  }

  // Consistent generic response to avoid account enumeration
  res.json({
    success: true,
    deliveryStatus: 'unconfigured',
    message: 'If an account exists with that email, reset instructions have been created.'
  });
});

// Reset Password with Token
app.post('/api/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Validation Error', message: 'Token and new password are required.' });
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'Validation Error', message: 'New password must be at least 8 characters long.' });
  }

  const tokenRecord = db.passwordResetTokens.find(t => t.token === token && !t.used);
  if (!tokenRecord || new Date(tokenRecord.expiresAt) <= new Date()) {
    return res.status(400).json({ error: 'Invalid Token', message: 'Reset token is invalid or has expired.' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === tokenRecord.email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User Not Found', message: 'Associated user account could not be found.' });
  }

  user.passwordHash = hashPassword(newPassword);
  tokenRecord.used = true;
  // Invalidate all active sessions for security
  db.sessions = db.sessions.filter(s => s.userId !== user.id);
  persist();

  logAudit(DEFAULT_WORKSPACE_ID, user.name, 'Password Reset Completed', user.email, 'Success', 'Password was successfully reset.');
  res.json({ success: true, message: 'Password has been successfully updated. Please sign in with your new password.' });
});

// -----------------------------------------------------------------------------
// WORKSPACE MANAGEMENT ROUTES
// -----------------------------------------------------------------------------

// List all workspaces for logged-in user
app.get('/api/workspaces', requireAuth, (req, res) => {
  const userMemberships = db.memberships.filter(m => m.userId === req.user!.id);
  const userWsIds = userMemberships.map(m => m.workspaceId);
  const workspaces = db.workspaces
    .filter(w => userWsIds.includes(w.id))
    .map(w => {
      const membership = userMemberships.find(m => m.workspaceId === w.id);
      return {
        ...w,
        role: membership?.role || 'Operator'
      };
    });

  res.json(workspaces);
});

// Create a new Workspace
app.post('/api/workspaces', requireAuth, (req, res) => {
  const { name, businessType, description } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Validation Error', message: 'Workspace name is required.' });
  }

  const wsName = name.trim();
  const rawSlug = wsName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const wsSlug = rawSlug ? `${rawSlug}-${Date.now().toString().slice(-4)}` : `business-${Date.now().toString().slice(-4)}`;
  const wsId = `ws-${Date.now()}`;

  const profile = {
    name: wsName,
    type: businessType || 'Small Business',
    description: description || `Welcome to ${wsName}.`,
    contactEmail: req.user!.email,
    contactPhone: '(555) 010-0000',
    businessHours: 'Mon - Fri: 9:00 AM - 5:00 PM',
    timeZone: 'EST',
    supportTone: 'Warm and professional',
    escalationInstructions: 'Contact support team',
    emergencyStopActive: false,
    slug: wsSlug,
    tagline: 'Delivering excellence.',
    published: true,
    template: 'Modern Clean' as const,
    workspaceId: wsId
  };

  const newWorkspace: Workspace = {
    id: wsId,
    name: wsName,
    slug: wsSlug,
    ownerId: req.user!.id,
    profile,
    createdAt: new Date().toISOString()
  };
  db.workspaces.push(newWorkspace);

  const membership: Membership = {
    id: `mem-${Date.now()}`,
    workspaceId: wsId,
    userId: req.user!.id,
    role: 'Owner',
    joinedAt: new Date().toISOString()
  };
  db.memberships.push(membership);

  persist();
  logAudit(wsId, req.user!.name, 'Create Workspace', wsName, 'Success', `Created new workspace ${wsName}.`);

  res.status(201).json({
    workspace: newWorkspace,
    role: 'Owner'
  });
});

// List members of workspace
app.get('/api/workspaces/:id/members', requireAuth, (req, res) => {
  const wsId = req.params.id;
  const callerMembership = db.memberships.find(m => m.workspaceId === wsId && m.userId === req.user!.id);
  if (!callerMembership) {
    return res.status(403).json({ error: 'Forbidden', message: 'Access denied to workspace members.' });
  }

  const members = db.memberships
    .filter(m => m.workspaceId === wsId)
    .map(m => {
      const memberUser = db.users.find(u => u.id === m.userId);
      return {
        id: m.id,
        userId: m.userId,
        name: memberUser?.name || 'Unknown User',
        email: memberUser?.email || '',
        role: m.role,
        joinedAt: m.joinedAt
      };
    });

  res.json(members);
});

// Invite / add member to workspace
app.post('/api/workspaces/:id/members', requireAuth, requireRole(['Owner']), (req, res) => {
  const wsId = req.params.id;
  const { email, role, name } = req.body;

  if (!email || !role) {
    return res.status(400).json({ error: 'Validation Error', message: 'Email and role are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  let user = db.users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    // Create new invited user account
    user = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      passwordHash: hashPassword('DemoPassword123!'),
      name: name || cleanEmail.split('@')[0],
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
  }

  const existingMem = db.memberships.find(m => m.workspaceId === wsId && m.userId === user!.id);
  if (existingMem) {
    existingMem.role = role;
    persist();
    return res.json({ message: 'Member role updated', membership: existingMem });
  }

  const newMem: Membership = {
    id: `mem-${Date.now()}`,
    workspaceId: wsId,
    userId: user.id,
    role,
    joinedAt: new Date().toISOString()
  };
  db.memberships.push(newMem);
  persist();

  logAudit(wsId, req.user!.name, 'Add Member', cleanEmail, 'Success', `Added ${cleanEmail} with role ${role}.`);
  res.status(201).json({ message: 'Member added successfully', membership: newMem });
});

// -----------------------------------------------------------------------------
// PUBLIC CUSTOMER FACING ROUTES (BY BUSINESS SLUG)
// -----------------------------------------------------------------------------

// Public Storefront Data by Slug
app.get('/api/public/business/:slug', (req, res) => {
  const ws = db.workspaces.find(w => w.slug === req.params.slug);
  if (!ws) {
    return res.status(404).json({ error: 'Business not found' });
  }

  // Deactivated / Unpublished site check
  if (ws.profile && ws.profile.published === false) {
    return res.status(404).json({ error: 'Business website is currently unpublished or inactive.' });
  }

  // Sanitized public profile: strictly public fields, no private notes or internal escalation rules
  const safeProfile = {
    name: ws.profile.name,
    type: ws.profile.type,
    description: ws.profile.description,
    tagline: ws.profile.tagline || '',
    contactEmail: ws.profile.contactEmail,
    contactPhone: ws.profile.contactPhone,
    businessHours: ws.profile.businessHours,
    timeZone: ws.profile.timeZone,
    supportTone: ws.profile.supportTone,
    location: ws.profile.location || 'Local & Online',
    slug: ws.slug,
    template: ws.profile.template || 'Modern Clean',
    published: true,
    faqs: ws.profile.faqs || []
  };

  // Catalogue: active/available items for this workspace only
  const safeCatalogue = db.catalogueItems
    .filter(c => c.workspaceId === ws.id && c.availability !== 'Archived')
    .map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      description: c.description,
      price: c.price,
      pricingMethod: c.pricingMethod || 'Fixed',
      variants: c.variants || '',
      availability: c.availability || 'In Stock',
      discountPrice: c.discountPrice,
      discountConditions: c.discountConditions
    }));

  // Reviews: published reviews only for this workspace
  const safeReviews = db.reviews
    .filter(r => r.workspaceId === ws.id && r.status === 'Published')
    .map(r => ({
      id: r.id,
      customerName: r.customerName,
      rating: r.rating,
      comment: r.comment,
      businessResponse: r.businessResponse,
      date: r.date
    }));

  res.json({
    profile: safeProfile,
    catalogue: safeCatalogue,
    reviews: safeReviews
  });
});

// Public Chat for a Specific Business
app.post('/api/public/:slug/chat', async (req, res) => {
  const { message, conversationHistory } = req.body;
  const ws = db.workspaces.find(w => w.slug === req.params.slug);

  if (!ws) {
    return res.status(404).json({ error: 'Business not found' });
  }

  if (ws.profile.emergencyStopActive) {
    return res.json({
      reply: 'Our automated support assistant is currently paused by an administrator. A human specialist will review your message shortly.',
      isAiGenerated: false,
      needsHandoff: true
    });
  }

  const catalogue = db.catalogueItems.filter(c => c.workspaceId === ws.id);
  const knowledge = db.knowledgeEntries.filter(k => k.workspaceId === ws.id && k.status === 'Approved');
  const catalogueContext = catalogue.map(c => `- ${c.name} (${c.category}): $${c.price} [${c.availability}] - ${c.description}`).join('\n');
  const knowledgeContext = knowledge.map(k => `[${k.title}]: ${k.content}`).join('\n');

  const systemInstruction = `You are the helpful AI assistant for ${ws.profile.name}.
Business Description: ${ws.profile.description}
Hours: ${ws.profile.businessHours}

APPROVED CATALOGUE:
${catalogueContext || 'No items listed yet.'}

APPROVED POLICIES & KNOWLEDGE:
${knowledgeContext || 'Standard business service.'}

Answer customer questions using only this approved information. Be warm and professional.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        reply: `Thank you for reaching out to ${ws.profile.name}! How can we assist you with our products and services today?`,
        isAiGenerated: true
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: db.assistantConfig?.model || 'gemini-2.5-flash',
      contents: [
        ...(conversationHistory || []).map((m: any) => ({
          role: m.sender === 'customer' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: { systemInstruction, temperature: 0.3, maxOutputTokens: 500 }
    });

    const replyText = response.text ? response.text.trim() : "I'm sorry, I couldn't process that response.";
    res.json({
      reply: replyText,
      isAiGenerated: true,
      needsHandoff: message.toLowerCase().includes('cancel') || message.toLowerCase().includes('address')
    });
  } catch (err: any) {
    console.error('AI Error:', err);
    res.json({
      reply: `Thank you for reaching out to ${ws.profile.name}. Our team has been notified to assist you.`,
      isAiGenerated: true,
      needsHandoff: true
    });
  }
});

// Public Customer Enquiry Submission for a Business
app.post('/api/public/:slug/enquiries', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkWindowRateLimit(`enq:${ip}`, 30, 10 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too Many Requests', message: 'Rate limit exceeded. Please try again later.' });
  }

  const ws = db.workspaces.find(w => w.slug === req.params.slug);
  if (!ws) return res.status(404).json({ error: 'Business not found' });

  const { customerName, message, email, phone, intent } = req.body;
  if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
    return res.status(400).json({ error: 'Validation Error', message: 'Customer name is required.' });
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Validation Error', message: 'Message content is required.' });
  }
  if (email && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) {
    return res.status(400).json({ error: 'Validation Error', message: 'Invalid email address format.' });
  }

  const newEnq = {
    id: `enq-${Date.now()}`,
    workspaceId: ws.id,
    customerName: customerName.trim(),
    email: email ? email.trim() : undefined,
    phone: phone ? String(phone).trim() : undefined,
    intent: intent || 'General Enquiry',
    message: message.trim(),
    dateReceived: new Date().toISOString().split('T')[0],
    status: 'New' as const,
    assignedOwner: ws.profile.name
  };
  db.enquiries.unshift(newEnq);
  persist();
  res.status(201).json(newEnq);
});

// Public Customer Review Submission for a Business
app.post('/api/public/:slug/reviews', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkWindowRateLimit(`rev:${ip}`, 30, 10 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too Many Requests', message: 'Rate limit exceeded. Please try again later.' });
  }

  const ws = db.workspaces.find(w => w.slug === req.params.slug);
  if (!ws) return res.status(404).json({ error: 'Business not found' });

  const { customerName, rating, comment } = req.body;
  if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
    return res.status(400).json({ error: 'Validation Error', message: 'Customer name is required.' });
  }
  const numRating = Number(rating);
  if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'Validation Error', message: 'Rating must be an integer between 1 and 5.' });
  }
  if (!comment || typeof comment !== 'string' || !comment.trim()) {
    return res.status(400).json({ error: 'Validation Error', message: 'Review comment is required.' });
  }

  const rev = {
    id: `rev-${Date.now()}`,
    workspaceId: ws.id,
    customerName: customerName.trim(),
    rating: numRating,
    comment: comment.trim(),
    date: new Date().toISOString().split('T')[0],
    status: 'Published' as const
  };
  db.reviews.unshift(rev);
  persist();
  res.status(201).json(rev);
});

// -----------------------------------------------------------------------------
// PROTECTED MULTI-TENANT BUSINESS OPERATIONS
// -----------------------------------------------------------------------------

// Workspace Profile
app.get('/api/workspace', optionalAuth, (req, res) => {
  const ws = req.workspace || db.workspaces[0];
  res.json(ws.profile);
});

app.put('/api/workspace', optionalAuth, (req, res) => {
  const ws = req.workspace || db.workspaces[0];
  ws.profile = { ...ws.profile, ...req.body, workspaceId: ws.id };
  ws.name = ws.profile.name || ws.name;
  if (ws.profile.slug) ws.slug = ws.profile.slug;

  if (ws.id === DEFAULT_WORKSPACE_ID) {
    db.workspaceProfile = ws.profile;
  }
  persist();
  logAudit(ws.id, req.user?.name || 'Operator', 'Update Business Profile', ws.profile.name, 'Success', 'Updated workspace profile settings.');
  res.json(ws.profile);
});

// -----------------------------------------------------------------------------
// WEBSITE LIFECYCLE: DRAFT GENERATION, APPROVAL, & PUBLICATION
// -----------------------------------------------------------------------------

// Get Current Website Draft
app.get('/api/website/draft', optionalAuth, (req, res) => {
  const ws = req.workspace || db.workspaces[0];
  const draft = ws.profile.websiteDraft || {
    status: 'Draft',
    heroHeadline: ws.profile.name,
    tagline: ws.profile.tagline || '',
    aboutText: ws.profile.description,
    faqs: ws.profile.faqs || [
      { question: `What are your business hours?`, answer: `We are open ${ws.profile.businessHours}.` },
      { question: `How can I reach customer support?`, answer: `You can reach us at ${ws.profile.contactEmail} or by calling ${ws.profile.contactPhone}.` }
    ]
  };
  res.json(draft);
});

// Generate AI Website Draft Grounded in Workspace Facts
app.post('/api/website/draft/generate', optionalAuth, requireRole(['Owner', 'Operator']), async (req, res) => {
  const ws = req.workspace || db.workspaces[0];
  const catalogue = db.catalogueItems.filter(c => (c.workspaceId || DEFAULT_WORKSPACE_ID) === ws.id && c.availability !== 'Archived');
  const knowledge = db.knowledgeEntries.filter(k => (k.workspaceId || DEFAULT_WORKSPACE_ID) === ws.id && k.status === 'Approved');

  const catalogueFactList = catalogue.map(c => `- ${c.name} (${c.category}): $${c.price}. Availability: ${c.availability}. ${c.description} ${c.discountConditions ? `[Discount: ${c.discountConditions}]` : ''}`).join('\n');
  const knowledgeFactList = knowledge.map(k => `- [${k.title}]: ${k.content}`).join('\n');

  let generatedDraft = {
    status: 'Draft' as const,
    heroHeadline: `${ws.profile.name} — Handcrafted Quality`,
    tagline: ws.profile.tagline || `Authentic ${ws.profile.type.toLowerCase()} crafted with pride.`,
    aboutText: `Welcome to ${ws.profile.name}. We specialize in ${ws.profile.type.toLowerCase()}, offering dedicated service and premium quality items. ${catalogue.length > 0 ? `Our featured items include ${catalogue.slice(0, 3).map(c => `${c.name} ($${c.price})`).join(', ')}.` : ''}`,
    faqs: [
      { question: `What are your standard business hours?`, answer: `We are open ${ws.profile.businessHours}.` },
      { question: `How can I place an order or contact support?`, answer: `You can contact our team directly at ${ws.profile.contactEmail} or ${ws.profile.contactPhone}.` },
      ...(catalogue.length > 0 ? [{ question: `What items do you offer?`, answer: `We offer a selection of ${ws.profile.type.toLowerCase()} including ${catalogue.map(c => c.name).slice(0, 3).join(', ')}.` }] : [])
    ],
    featuredItems: catalogue.slice(0, 3).map(c => c.name),
    generatedAt: new Date().toISOString()
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are CIPHER AI, generating a grounded website draft for:
Business Name: ${ws.profile.name}
Category: ${ws.profile.type}
Description: ${ws.profile.description}
Hours: ${ws.profile.businessHours}

APPROVED CATALOGUE FACTS:
${catalogueFactList || 'No catalogue items registered yet.'}

APPROVED POLICIES:
${knowledgeFactList || 'Standard business service.'}

STRICT GROUNDING RULES:
1. ONLY reference verified catalogue items, prices, and facts provided above.
2. DO NOT invent prices, customer testimonials, credentials, awards, or false guarantees.
3. Return ONLY a valid JSON object with:
   - "heroHeadline": string (punchy title under 8 words)
   - "tagline": string (1-sentence brand promise)
   - "aboutText": string (2-3 paragraphs grounded in the facts)
   - "faqs": array of 3 objects with "question" and "answer"`;

      const response = await ai.models.generateContent({
        model: db.assistantConfig?.model || 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (parsed.heroHeadline && parsed.tagline && parsed.aboutText) {
          generatedDraft = {
            ...generatedDraft,
            heroHeadline: parsed.heroHeadline,
            tagline: parsed.tagline,
            aboutText: parsed.aboutText,
            faqs: Array.isArray(parsed.faqs) && parsed.faqs.length > 0 ? parsed.faqs : generatedDraft.faqs
          };
        }
      }
    }
  } catch (err) {
    console.warn('AI Website Draft generation error (using safe grounded fallback):', err);
  }

  ws.profile.websiteDraft = generatedDraft;
  if (ws.id === DEFAULT_WORKSPACE_ID) {
    db.workspaceProfile = ws.profile;
  }
  persist();
  logAudit(ws.id, req.user?.name || 'Operator', 'Generate Website Draft', ws.profile.name, 'Success', 'Generated new grounded AI website draft.');
  res.json(generatedDraft);
});

// Edit / Update Website Draft
app.put('/api/website/draft', optionalAuth, requireRole(['Owner', 'Operator']), (req, res) => {
  const ws = req.workspace || db.workspaces[0];
  const existing = ws.profile.websiteDraft || { status: 'Draft' };
  ws.profile.websiteDraft = {
    ...existing,
    ...req.body,
    status: req.body.status || existing.status || 'Draft'
  };
  if (ws.id === DEFAULT_WORKSPACE_ID) {
    db.workspaceProfile = ws.profile;
  }
  persist();
  logAudit(ws.id, req.user?.name || 'Operator', 'Update Website Draft', ws.profile.name, 'Success', 'Edited website draft copy.');
  res.json(ws.profile.websiteDraft);
});

// Approve Website Draft
app.post('/api/website/draft/approve', optionalAuth, requireRole(['Owner', 'Operator']), (req, res) => {
  const ws = req.workspace || db.workspaces[0];
  if (!ws.profile.websiteDraft) {
    ws.profile.websiteDraft = {
      status: 'Approved',
      heroHeadline: ws.profile.name,
      tagline: ws.profile.tagline || '',
      aboutText: ws.profile.description,
      faqs: ws.profile.faqs || []
    };
  }
  ws.profile.websiteDraft.status = 'Approved';
  ws.profile.websiteDraft.approvedAt = new Date().toISOString();
  ws.profile.websiteDraft.approvedBy = req.user?.name || 'Authorized Owner';

  if (ws.id === DEFAULT_WORKSPACE_ID) {
    db.workspaceProfile = ws.profile;
  }
  persist();
  logAudit(ws.id, req.user?.name || 'Owner', 'Approve Website Draft', ws.profile.name, 'Success', 'Approved website draft for publication.');
  res.json({ success: true, draft: ws.profile.websiteDraft });
});

// Publish Website
app.post('/api/website/publish', optionalAuth, requireRole(['Owner']), (req, res) => {
  const ws = req.workspace || db.workspaces[0];
  const draft = ws.profile.websiteDraft;

  ws.profile.published = true;
  if (draft) {
    draft.status = 'Published';
    if (draft.tagline) ws.profile.tagline = draft.tagline;
    if (draft.aboutText) ws.profile.description = draft.aboutText;
    if (draft.faqs) ws.profile.faqs = draft.faqs;
  }

  if (ws.id === DEFAULT_WORKSPACE_ID) {
    db.workspaceProfile = ws.profile;
  }
  persist();
  logAudit(ws.id, req.user?.name || 'Owner', 'Publish Website', ws.profile.name, 'Success', `Website published at /site/${ws.slug}`);
  res.json({
    success: true,
    published: true,
    slug: ws.slug,
    profile: ws.profile
  });
});

// Unpublish / Deactivate Website
app.post('/api/website/unpublish', optionalAuth, requireRole(['Owner']), (req, res) => {
  const ws = req.workspace || db.workspaces[0];
  ws.profile.published = false;
  if (ws.profile.websiteDraft) {
    ws.profile.websiteDraft.status = 'Draft';
  }

  if (ws.id === DEFAULT_WORKSPACE_ID) {
    db.workspaceProfile = ws.profile;
  }
  persist();
  logAudit(ws.id, req.user?.name || 'Owner', 'Unpublish Website', ws.profile.name, 'Success', `Website unpublished; public storefront deactivated.`);
  res.json({
    success: true,
    published: false,
    message: 'Business website has been unpublished. Public storefront is no longer serving visitors while private workspace data remains intact.'
  });
});

// Catalogue
app.get('/api/catalogue', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const items = db.catalogueItems.filter(i => (i.workspaceId || DEFAULT_WORKSPACE_ID) === wsId);
  res.json(items);
});

app.post('/api/catalogue', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const item = { id: `cat-${Date.now()}`, workspaceId: wsId, ...req.body };
  db.catalogueItems.push(item);
  persist();
  logAudit(wsId, req.user?.name || 'Operator', 'Add Catalogue Item', item.name, 'Success', 'Added item to catalogue.');
  res.json(item);
});

app.put('/api/catalogue/:id', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const index = db.catalogueItems.findIndex(i => i.id === req.params.id && (i.workspaceId || DEFAULT_WORKSPACE_ID) === wsId);
  if (index === -1) return res.status(404).json({ error: 'Catalogue item not found' });
  db.catalogueItems[index] = { ...db.catalogueItems[index], ...req.body };
  persist();
  logAudit(wsId, req.user?.name || 'Operator', 'Update Catalogue Item', db.catalogueItems[index].name, 'Success', 'Updated item details.');
  res.json(db.catalogueItems[index]);
});

app.delete('/api/catalogue/:id', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const initialLen = db.catalogueItems.length;
  db.catalogueItems = db.catalogueItems.filter(i => !(i.id === req.params.id && (i.workspaceId || DEFAULT_WORKSPACE_ID) === wsId));
  persist();
  res.json({ success: db.catalogueItems.length < initialLen });
});

// Reviews
app.get('/api/reviews', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const reviews = db.reviews.filter(r => (r.workspaceId || DEFAULT_WORKSPACE_ID) === wsId);
  res.json(reviews);
});

app.post('/api/reviews', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const rev = {
    id: `rev-${Date.now()}`,
    workspaceId: wsId,
    ...req.body,
    date: new Date().toISOString().split('T')[0]
  };
  db.reviews.unshift(rev);
  persist();
  res.json(rev);
});

app.put('/api/reviews/:id', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const index = db.reviews.findIndex(r => r.id === req.params.id && (r.workspaceId || DEFAULT_WORKSPACE_ID) === wsId);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  db.reviews[index] = { ...db.reviews[index], ...req.body };
  persist();
  res.json(db.reviews[index]);
});

// Knowledge Base
app.get('/api/knowledge', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const entries = db.knowledgeEntries.filter(k => (k.workspaceId || DEFAULT_WORKSPACE_ID) === wsId);
  res.json(entries);
});

app.post('/api/knowledge', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const newEntry = {
    id: `kb-${Date.now()}`,
    workspaceId: wsId,
    ...req.body,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  db.knowledgeEntries.push(newEntry);
  persist();
  res.json(newEntry);
});

app.put('/api/knowledge/:id', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const index = db.knowledgeEntries.findIndex(k => k.id === req.params.id && (k.workspaceId || DEFAULT_WORKSPACE_ID) === wsId);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  db.knowledgeEntries[index] = { ...db.knowledgeEntries[index], ...req.body, updatedAt: new Date().toISOString() };
  persist();
  res.json(db.knowledgeEntries[index]);
});

app.delete('/api/knowledge/:id', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  db.knowledgeEntries = db.knowledgeEntries.filter(k => !(k.id === req.params.id && (k.workspaceId || DEFAULT_WORKSPACE_ID) === wsId));
  persist();
  res.json({ success: true });
});

// Conversations
app.get('/api/conversations', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const convs = db.conversations.filter(c => (c.workspaceId || DEFAULT_WORKSPACE_ID) === wsId);
  res.json(convs);
});

app.post('/api/conversations', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const newConv = {
    id: `conv-${Date.now()}`,
    workspaceId: wsId,
    customerName: req.body.customerName || 'Anonymous Visitor',
    customerEmail: req.body.customerEmail,
    status: 'New' as const,
    channel: req.body.channel || 'Web Chat',
    lastActive: 'Just now',
    assignedOperator: 'Unassigned',
    messages: req.body.messages || [],
    createdAt: new Date().toISOString()
  };
  db.conversations.unshift(newConv);
  persist();
  res.json(newConv);
});

app.put('/api/conversations/:id', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const index = db.conversations.findIndex(c => c.id === req.params.id && (c.workspaceId || DEFAULT_WORKSPACE_ID) === wsId);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  db.conversations[index] = { ...db.conversations[index], ...req.body };
  persist();
  res.json(db.conversations[index]);
});

app.post('/api/conversations/:id/messages', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const conv = db.conversations.find(c => c.id === req.params.id && (c.workspaceId || DEFAULT_WORKSPACE_ID) === wsId);
  if (!conv) return res.status(404).json({ error: 'Not found' });
  const newMessage = {
    id: `m-${Date.now()}`,
    sender: req.body.sender,
    senderName: req.body.senderName,
    text: req.body.text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isAiGenerated: req.body.isAiGenerated,
    needsHandoff: req.body.needsHandoff
  };
  conv.messages.push(newMessage);
  conv.lastActive = 'Just now';
  if (req.body.needsHandoff) conv.status = 'Needs human';
  persist();
  res.json(newMessage);
});

// Enquiries
app.get('/api/enquiries', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const enquiries = db.enquiries.filter(e => (e.workspaceId || DEFAULT_WORKSPACE_ID) === wsId);
  res.json(enquiries);
});

app.post('/api/enquiries', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const newEnq = {
    id: `enq-${Date.now()}`,
    workspaceId: wsId,
    ...req.body,
    dateReceived: new Date().toISOString().split('T')[0],
    status: 'New' as const,
    assignedOwner: req.user?.name || 'Sarah Jenkins'
  };
  db.enquiries.unshift(newEnq);
  persist();
  res.json(newEnq);
});

app.put('/api/enquiries/:id', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const index = db.enquiries.findIndex(e => e.id === req.params.id && (e.workspaceId || DEFAULT_WORKSPACE_ID) === wsId);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  db.enquiries[index] = { ...db.enquiries[index], ...req.body };
  persist();
  res.json(db.enquiries[index]);
});

// CRM Contacts
app.get('/api/crm', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  res.json(db.crmContacts.filter(c => (c.workspaceId || DEFAULT_WORKSPACE_ID) === wsId));
});

app.post('/api/crm', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const contact = { id: `crm-${Date.now()}`, workspaceId: wsId, ...req.body, lastInteraction: 'Just now' };
  db.crmContacts.unshift(contact);
  persist();
  res.json(contact);
});

app.put('/api/crm/:id', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const index = db.crmContacts.findIndex(c => c.id === req.params.id && (c.workspaceId || DEFAULT_WORKSPACE_ID) === wsId);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  db.crmContacts[index] = { ...db.crmContacts[index], ...req.body };
  persist();
  res.json(db.crmContacts[index]);
});

// Proposals
app.get('/api/proposals', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  res.json(db.proposals.filter(p => (p.workspaceId || DEFAULT_WORKSPACE_ID) === wsId));
});

app.post('/api/proposals', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const prop = { id: `prop-${Date.now()}`, workspaceId: wsId, ...req.body, createdAt: new Date().toISOString().split('T')[0] };
  db.proposals.unshift(prop);
  persist();
  res.json(prop);
});

app.put('/api/proposals/:id', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const index = db.proposals.findIndex(p => p.id === req.params.id && (p.workspaceId || DEFAULT_WORKSPACE_ID) === wsId);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  db.proposals[index] = { ...db.proposals[index], ...req.body };
  persist();
  res.json(db.proposals[index]);
});

// Projects & Tasks
app.get('/api/projects', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  res.json(db.projects.filter(p => (p.workspaceId || DEFAULT_WORKSPACE_ID) === wsId));
});

app.get('/api/tasks', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  res.json(db.tasks.filter(t => (t.workspaceId || DEFAULT_WORKSPACE_ID) === wsId));
});

app.post('/api/tasks', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const task = { id: `task-${Date.now()}`, workspaceId: wsId, ...req.body };
  db.tasks.unshift(task);
  persist();
  res.json(task);
});

app.put('/api/tasks/:id', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const index = db.tasks.findIndex(t => t.id === req.params.id && (t.workspaceId || DEFAULT_WORKSPACE_ID) === wsId);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  db.tasks[index] = { ...db.tasks[index], ...req.body };
  persist();
  res.json(db.tasks[index]);
});

// Workflow Executions
app.get('/api/workflows/executions', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  res.json(db.workflowExecutions.filter(w => (w.workspaceId || DEFAULT_WORKSPACE_ID) === wsId));
});

app.post('/api/workflows/executions', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const exec = { id: `wf-exec-${Date.now()}`, workspaceId: wsId, ...req.body, executedAt: new Date().toLocaleString() };
  db.workflowExecutions.unshift(exec);
  persist();
  res.json(exec);
});

// Assistant Config & Approvals
app.get('/api/assistant', optionalAuth, (req, res) => {
  const ws = req.workspace || db.workspaces[0];
  const cfg = {
    ...db.assistantConfig,
    workspaceName: ws.profile?.name || db.assistantConfig.workspaceName,
    workspaceId: ws.id
  };
  res.json(cfg);
});

app.put('/api/assistant', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  db.assistantConfig = { ...db.assistantConfig, ...req.body, workspaceId: wsId };
  persist();
  res.json(db.assistantConfig);
});

app.get('/api/approvals', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  res.json(db.approvals.filter(a => (a.workspaceId || DEFAULT_WORKSPACE_ID) === wsId));
});

app.post('/api/approvals/:id/resolve', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const { decision, operatorName } = req.body;
  const appItem = db.approvals.find(a => a.id === req.params.id && (a.workspaceId || DEFAULT_WORKSPACE_ID) === wsId);
  if (!appItem) return res.status(404).json({ error: 'Not found' });
  appItem.status = decision;
  appItem.resolvedAt = new Date().toISOString();
  appItem.resolvedBy = operatorName || req.user?.name || 'Operator';
  persist();
  logAudit(wsId, operatorName || req.user?.name || 'Operator', `${decision} Approval`, appItem.action, 'Success', `Approval resolved as ${decision}.`);
  res.json(appItem);
});

// Integrations & Audit
app.get('/api/integrations', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  res.json(db.integrations.filter(i => (i.workspaceId || DEFAULT_WORKSPACE_ID) === wsId));
});

app.put('/api/integrations/:id', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  const index = db.integrations.findIndex(i => i.id === req.params.id && (i.workspaceId || DEFAULT_WORKSPACE_ID) === wsId);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  db.integrations[index] = { ...db.integrations[index], ...req.body, lastChecked: 'Just now' };
  persist();
  res.json(db.integrations[index]);
});

app.get('/api/audit', optionalAuth, (req, res) => {
  const wsId = req.workspace?.id || DEFAULT_WORKSPACE_ID;
  res.json(db.auditEvents.filter(a => (a.workspaceId || DEFAULT_WORKSPACE_ID) === wsId));
});

// AI Smart Profile Suggestions for Onboarding
app.post('/api/ai/suggest-profiles', async (req, res) => {
  const { name, type } = req.body;
  const bizName = (name || 'Our Business').trim();
  const bizType = (type || 'Small Business').trim();

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are CIPHER AI, an expert business consultant.
Generate 3 distinct, smart, context-aware business profile suggestions for a business named "${bizName}" in the category "${bizType}".
Each suggestion represents a realistic, appealing operational archetype (e.g. Artisanal/High-Touch, Modern/Sleek, Community/Trusted Expert).
Return ONLY a valid JSON array of 3 objects with these exact keys:
- "id": string (e.g. "sug-1")
- "archetype": string (short title like "Artisanal & Sustainable", "Modern & Minimalist", "Heritage & Community")
- "badge": string (2-3 words, e.g. "Most Popular", "Executive Focus", "High-Touch")
- "tagline": string (inspirational 1-sentence motto)
- "description": string (2-3 sentence engaging business biography describing what the business does, its values, and customer commitment)
- "supportTone": string (e.g. "Warm, personal, and attentive")
- "template": string ("Maple Botanical", "Modern Clean", or "Warm Artisan")
- "recommendedHours": string (realistic business hours)
- "highlights": array of 3 short strings (e.g. ["Handcrafted Quality", "Eco-friendly Packaging", "Personal Attention"])`;

      const response = await ai.models.generateContent({
        model: db.assistantConfig?.model || 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (Array.isArray(parsed) && parsed.length >= 3) {
          return res.json({ suggestions: parsed.slice(0, 3) });
        }
      }
    }
  } catch (err) {
    console.warn('AI suggestions error, fallback will be used:', err);
  }

  res.json({ suggestions: [] });
});

// AI Chat & CIPHER Guide Endpoint (Workspace-scoped)
app.post('/api/ai/chat', optionalAuth, async (req, res) => {
  const ws = req.workspace || db.workspaces[0];
  const { message, conversationHistory } = req.body;

  if (ws.profile.emergencyStopActive) {
    return res.json({
      reply: 'Our automated support assistant is currently paused by an administrator. A human specialist will review your message shortly.',
      isAiGenerated: false,
      needsHandoff: true
    });
  }

  const catalogue = db.catalogueItems.filter(c => (c.workspaceId || DEFAULT_WORKSPACE_ID) === ws.id);
  const knowledge = db.knowledgeEntries.filter(k => (k.workspaceId || DEFAULT_WORKSPACE_ID) === ws.id);
  const catalogueContext = catalogue.map(c => `- ${c.name} (${c.category}): $${c.price} [${c.availability}] - ${c.description}`).join('\n');
  const knowledgeContext = knowledge.map(k => `[${k.title}]: ${k.content}`).join('\n');

  const systemInstruction = `You are ${db.assistantConfig?.name || 'CIPHER Assistant'}, the helpful AI assistant for ${ws.profile.name}.
Business Description: ${ws.profile.description}
Hours: ${ws.profile.businessHours}

APPROVED CATALOGUE:
${catalogueContext || 'No items listed yet.'}

APPROVED POLICIES:
${knowledgeContext || 'Standard business service.'}

Answer customer questions using only this approved information. Be warm and professional.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        reply: `Thank you for reaching out to ${ws.profile.name}! How can we assist you with our catalogue or services today?`,
        isAiGenerated: true
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: db.assistantConfig?.model || 'gemini-2.5-flash',
      contents: [
        ...(conversationHistory || []).map((m: any) => ({
          role: m.sender === 'customer' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: { systemInstruction, temperature: 0.3, maxOutputTokens: 500 }
    });

    const replyText = response.text ? response.text.trim() : "I'm sorry, I couldn't process that response.";
    res.json({
      reply: replyText,
      isAiGenerated: true,
      needsHandoff: message.toLowerCase().includes('cancel') || message.toLowerCase().includes('address')
    });
  } catch (err: any) {
    console.error('AI Error:', err);
    res.json({ reply: 'Thank you for your message. Our team has been notified to assist you.', isAiGenerated: true, needsHandoff: true });
  }
});

// Vite middleware / static serve
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[CIPHER Route/Persistence Error]:', err.message || err);
  res.status(500).json({
    error: 'Persistence or Internal Error',
    message: err.message || 'An unexpected error occurred while processing the request'
  });
});

const PORT = Number(process.env.PORT) || 3000;
const server = app.listen(PORT, '0.0.0.0', () => console.log(`CIPHER Multi-Tenant Ecosystem running on port ${PORT} with durable persistence`));

// Graceful Shutdown Handler
function handleGracefulShutdown(signal: string) {
  console.info(`[SHUTDOWN] Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    console.info('[SHUTDOWN] HTTP server closed successfully.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[SHUTDOWN] Force closing remaining connections after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

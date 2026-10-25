import fs from 'fs';
import path from 'path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'url';
import {
  initialBusinessProfile,
  initialCatalogueItems,
  initialReviews,
  initialKnowledgeEntries,
  initialConversations,
  initialEnquiries,
  initialCrmContacts,
  initialProposals,
  initialProjects,
  initialTasks,
  initialWorkflowExecutions,
  initialAssistantConfig,
  initialApprovals,
  initialIntegrations,
  initialAuditEvents
} from '../src/mockData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolved absolute database path (customizable via CIPHER_DB_PATH)
export function getDatabasePath(customPath?: string): string {
  if (customPath) return path.resolve(customPath);
  if (process.env.CIPHER_DB_PATH) {
    const resolved = path.resolve(process.env.CIPHER_DB_PATH);
    // Prevent accidental collision where a SQLite database path is passed to the JSON database
    if (resolved.endsWith('.sqlite') || resolved.endsWith('.db')) {
      return `${resolved}.json`;
    }
    if (process.env.CIPHER_SQLITE_PATH && resolved === path.resolve(process.env.CIPHER_SQLITE_PATH)) {
      return `${resolved}.json`;
    }
    return resolved;
  }
  return path.join(__dirname, 'cipher_db.json');
}

export type WorkspaceRole = 'Owner' | 'Operator' | 'Client';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  profile: any;
  createdAt: string;
}

export interface Membership {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface PasswordResetToken {
  token: string;
  email: string;
  expiresAt: string;
  used: boolean;
}

export interface DBschema {
  users: User[];
  sessions: Session[];
  workspaces: Workspace[];
  memberships: Membership[];
  passwordResetTokens: PasswordResetToken[];
  workspaceProfile: any; // backward compatibility
  catalogueItems: any[];
  reviews: any[];
  knowledgeEntries: any[];
  conversations: any[];
  enquiries: any[];
  crmContacts: any[];
  proposals: any[];
  projects: any[];
  tasks: any[];
  workflowExecutions: any[];
  assistantConfig: any;
  approvals: any[];
  integrations: any[];
  auditEvents: any[];
}

// Password hashing utility using standard Node.js crypto.scryptSync
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, storedHash] = combinedHash.split(':');
    if (!salt || !storedHash) return false;
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export const DEFAULT_WORKSPACE_ID = 'ws-maple-and-moss';
export const DEFAULT_OWNER_ID = 'user-sarah';
export const DEFAULT_OPERATOR_ID = 'user-david';
export const DEFAULT_CLIENT_ID = 'user-marcus';

function createDefaultSeedDb(): DBschema {
  const defaultPasswordHash = hashPassword('DemoPassword123!');

  const users: User[] = [
    {
      id: DEFAULT_OWNER_ID,
      email: 'sarah.jenkins@mapleandmossgoods.com',
      passwordHash: defaultPasswordHash,
      name: 'Sarah Jenkins',
      createdAt: '2026-10-01T09:00:00.000Z'
    },
    {
      id: DEFAULT_OPERATOR_ID,
      email: 'david.kim@mapleandmossgoods.com',
      passwordHash: defaultPasswordHash,
      name: 'David Kim',
      createdAt: '2026-10-01T09:00:00.000Z'
    },
    {
      id: DEFAULT_CLIENT_ID,
      email: 'marcus.vance@designstudio.co',
      passwordHash: defaultPasswordHash,
      name: 'Marcus Vance',
      createdAt: '2026-10-01T09:00:00.000Z'
    }
  ];

  const defaultProfile = { ...initialBusinessProfile, slug: 'maple-and-moss' };

  const workspaces: Workspace[] = [
    {
      id: DEFAULT_WORKSPACE_ID,
      name: defaultProfile.name,
      slug: defaultProfile.slug,
      ownerId: DEFAULT_OWNER_ID,
      profile: defaultProfile,
      createdAt: '2026-10-01T09:00:00.000Z'
    }
  ];

  const memberships: Membership[] = [
    {
      id: 'mem-1',
      workspaceId: DEFAULT_WORKSPACE_ID,
      userId: DEFAULT_OWNER_ID,
      role: 'Owner',
      joinedAt: '2026-10-01T09:00:00.000Z'
    },
    {
      id: 'mem-2',
      workspaceId: DEFAULT_WORKSPACE_ID,
      userId: DEFAULT_OPERATOR_ID,
      role: 'Operator',
      joinedAt: '2026-10-01T09:00:00.000Z'
    },
    {
      id: 'mem-3',
      workspaceId: DEFAULT_WORKSPACE_ID,
      userId: DEFAULT_CLIENT_ID,
      role: 'Client',
      joinedAt: '2026-10-01T09:00:00.000Z'
    }
  ];

  // Seed initial demo session for Sarah Jenkins
  const demoToken = 'demo-sarah-session-token-2026';
  const sessions: Session[] = [
    {
      token: demoToken,
      userId: DEFAULT_OWNER_ID,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const tag = (items: any[]) => items.map(item => ({ ...item, workspaceId: DEFAULT_WORKSPACE_ID }));

  return {
    users,
    sessions,
    workspaces,
    memberships,
    passwordResetTokens: [],
    workspaceProfile: defaultProfile,
    catalogueItems: tag(initialCatalogueItems),
    reviews: tag(initialReviews),
    knowledgeEntries: tag(initialKnowledgeEntries),
    conversations: tag(initialConversations),
    enquiries: tag(initialEnquiries),
    crmContacts: tag(initialCrmContacts),
    proposals: tag(initialProposals),
    projects: tag(initialProjects),
    tasks: tag(initialTasks),
    workflowExecutions: tag(initialWorkflowExecutions),
    assistantConfig: { ...initialAssistantConfig, workspaceId: DEFAULT_WORKSPACE_ID },
    approvals: tag(initialApprovals),
    integrations: tag(initialIntegrations),
    auditEvents: tag(initialAuditEvents)
  };
}

/**
 * Loads the database safely from disk.
 * Applies migrations if loading older database schema formats.
 */
export function loadDatabase(customFilePath?: string): DBschema {
  const filePath = getDatabasePath(customFilePath);

  // 1. Fresh installation: file does not exist
  if (!fs.existsSync(filePath)) {
    const initialDb = createDefaultSeedDb();
    saveDatabase(initialDb, filePath);
    return initialDb;
  }

  // 2. Existing file: read and parse
  let rawData: string;
  try {
    rawData = fs.readFileSync(filePath, 'utf-8');
  } catch (readErr: any) {
    throw new Error(`CRITICAL: Database file at ${filePath} exists but could not be read: ${readErr.message}`);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawData);
  } catch (jsonErr: any) {
    // Malformed file recovery: preserve backup
    const backupPath = `${filePath}.corrupted.${Date.now()}.bak`;
    try {
      fs.copyFileSync(filePath, backupPath);
      console.error(`[CIPHER DB ERROR] Corrupted database quarantined to ${backupPath}. Diagnostic: ${jsonErr.message}`);
    } catch (copyErr) {
      console.error(`[CIPHER DB ERROR] Failed to create backup of corrupted database: ${copyErr}`);
    }
    throw new Error(`CRITICAL: Database file at ${filePath} is malformed or unreadable. A recovery backup was created at ${backupPath}. Diagnostic: ${jsonErr.message}`);
  }

  const defaultSeed = createDefaultSeedDb();

  // 3. Migration: ensure multi-tenant collections exist and tag legacy records with DEFAULT_WORKSPACE_ID
  const users = Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : defaultSeed.users;
  const sessions = Array.isArray(parsed.sessions) ? parsed.sessions : defaultSeed.sessions;

  let workspaces: Workspace[] = Array.isArray(parsed.workspaces) && parsed.workspaces.length > 0 ? parsed.workspaces : defaultSeed.workspaces;
  // If workspace profile was updated previously, sync it into default workspace
  if (parsed.workspaceProfile && workspaces.length > 0) {
    const defWs = workspaces.find(w => w.id === DEFAULT_WORKSPACE_ID);
    if (defWs) {
      defWs.profile = { ...defWs.profile, ...parsed.workspaceProfile };
      defWs.name = defWs.profile.name || defWs.name;
      defWs.slug = defWs.profile.slug || defWs.slug;
    }
  }

  const memberships = Array.isArray(parsed.memberships) && parsed.memberships.length > 0 ? parsed.memberships : defaultSeed.memberships;

  const ensureWorkspaceTag = (items: any[]) => {
    if (!Array.isArray(items)) return [];
    return items.map(item => item.workspaceId ? item : { ...item, workspaceId: DEFAULT_WORKSPACE_ID });
  };

  const migratedDb: DBschema = {
    users,
    sessions,
    workspaces,
    memberships,
    passwordResetTokens: Array.isArray(parsed.passwordResetTokens) ? parsed.passwordResetTokens : [],
    workspaceProfile: parsed.workspaceProfile || defaultSeed.workspaceProfile,
    catalogueItems: ensureWorkspaceTag(parsed.catalogueItems || defaultSeed.catalogueItems),
    reviews: ensureWorkspaceTag(parsed.reviews || defaultSeed.reviews),
    knowledgeEntries: ensureWorkspaceTag(parsed.knowledgeEntries || defaultSeed.knowledgeEntries),
    conversations: ensureWorkspaceTag(parsed.conversations || defaultSeed.conversations),
    enquiries: ensureWorkspaceTag(parsed.enquiries || defaultSeed.enquiries),
    crmContacts: ensureWorkspaceTag(parsed.crmContacts || defaultSeed.crmContacts),
    proposals: ensureWorkspaceTag(parsed.proposals || defaultSeed.proposals),
    projects: ensureWorkspaceTag(parsed.projects || defaultSeed.projects),
    tasks: ensureWorkspaceTag(parsed.tasks || defaultSeed.tasks),
    workflowExecutions: ensureWorkspaceTag(parsed.workflowExecutions || defaultSeed.workflowExecutions),
    assistantConfig: parsed.assistantConfig ? { ...parsed.assistantConfig, workspaceId: parsed.assistantConfig.workspaceId || DEFAULT_WORKSPACE_ID } : defaultSeed.assistantConfig,
    approvals: ensureWorkspaceTag(parsed.approvals || defaultSeed.approvals),
    integrations: ensureWorkspaceTag(parsed.integrations || defaultSeed.integrations),
    auditEvents: ensureWorkspaceTag(parsed.auditEvents || defaultSeed.auditEvents)
  };

  return migratedDb;
}

// In-process lock to serialize concurrent write operations
let writeLock = Promise.resolve();

/**
 * Saves database state atomically to disk using unique temporary file + rename.
 */
export function saveDatabase(db: DBschema, customFilePath?: string): void {
  const filePath = getDatabasePath(customFilePath);
  const dir = path.dirname(filePath);
  let tempFile: string | null = null;

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    tempFile = `${filePath}.${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`;
    const serialized = JSON.stringify(db, null, 2);
    fs.writeFileSync(tempFile, serialized, 'utf-8');
    fs.renameSync(tempFile, filePath);
  } catch (err: any) {
    if (tempFile) {
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (_) {}
    }
    throw new Error(`Failed to persist database to ${filePath}: ${err.message}`);
  }
}

/**
 * Async serialized save for concurrent operations.
 */
export async function saveDatabaseSerialized(db: DBschema, customFilePath?: string): Promise<void> {
  const currentLock = writeLock;
  let nextResolve: () => void;
  writeLock = new Promise<void>((resolve) => {
    nextResolve = resolve;
  });

  try {
    await currentLock;
    saveDatabase(db, customFilePath);
  } finally {
    nextResolve!();
  }
}

/**
 * Resolves the operational backups directory.
 */
export function getBackupDirectory(customBackupDir?: string): string {
  if (customBackupDir) return path.resolve(customBackupDir);
  if (process.env.CIPHER_BACKUP_PATH) return path.resolve(process.env.CIPHER_BACKUP_PATH);
  return path.join(path.dirname(getDatabasePath()), 'backups');
}

export interface BackupMetadata {
  filename: string;
  backupPath: string;
  timestamp: string;
  sizeBytes: number;
  workspacesCount: number;
}

/**
 * Creates an atomic, timestamped backup of the current database file.
 */
export function createDatabaseBackup(customFilePath?: string, customBackupDir?: string): BackupMetadata {
  const liveDbPath = getDatabasePath(customFilePath);
  if (!fs.existsSync(liveDbPath)) {
    throw new Error(`Cannot backup non-existent database file at ${liveDbPath}`);
  }

  const rawContent = fs.readFileSync(liveDbPath, 'utf-8');
  let parsed: DBschema;
  try {
    parsed = JSON.parse(rawContent);
  } catch (err: any) {
    throw new Error(`Cannot create backup of invalid database: ${err.message}`);
  }

  const backupDir = getBackupDirectory(customBackupDir);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestampIso = new Date().toISOString();
  const safeTimestamp = timestampIso.replace(/[:.]/g, '-');
  const filename = `cipher-backup-${safeTimestamp}.json`;
  const backupPath = path.join(backupDir, filename);

  // Write atomically
  const tempPath = `${backupPath}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, rawContent, 'utf-8');
  fs.renameSync(tempPath, backupPath);

  const stats = fs.statSync(backupPath);
  return {
    filename,
    backupPath,
    timestamp: timestampIso,
    sizeBytes: stats.size,
    workspacesCount: Array.isArray(parsed.workspaces) ? parsed.workspaces.length : 0
  };
}

/**
 * Lists all existing database backups in chronological order (newest first).
 */
export function listDatabaseBackups(customBackupDir?: string): BackupMetadata[] {
  const backupDir = getBackupDirectory(customBackupDir);
  if (!fs.existsSync(backupDir)) {
    return [];
  }

  const files = fs.readdirSync(backupDir).filter(f => f.startsWith('cipher-backup-') && f.endsWith('.json'));
  const backups: BackupMetadata[] = [];

  for (const file of files) {
    const fullPath = path.join(backupDir, file);
    try {
      const stats = fs.statSync(fullPath);
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const parsed = JSON.parse(raw);
      backups.push({
        filename: file,
        backupPath: fullPath,
        timestamp: stats.mtime.toISOString(),
        sizeBytes: stats.size,
        workspacesCount: Array.isArray(parsed.workspaces) ? parsed.workspaces.length : 0
      });
    } catch (_) {}
  }

  return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Safely restores a backup into the live database.
 * Protects newer live data from silent overwrites unless options.force is set to true.
 * Automatically quarantines a pre-restore safety snapshot of the live database.
 */
export function restoreDatabaseBackup(
  backupFilePath: string,
  options?: { force?: boolean; customFilePath?: string }
): {
  success: boolean;
  restoredFrom: string;
  safetyQuarantinePath: string;
  workspacesCount: number;
} {
  const resolvedBackupPath = path.resolve(backupFilePath);
  if (!fs.existsSync(resolvedBackupPath)) {
    throw new Error(`Backup file does not exist at ${resolvedBackupPath}`);
  }

  const rawBackup = fs.readFileSync(resolvedBackupPath, 'utf-8');
  let parsedBackup: DBschema;
  try {
    parsedBackup = JSON.parse(rawBackup);
  } catch (err: any) {
    throw new Error(`Corrupt backup file: ${err.message}`);
  }

  if (!Array.isArray(parsedBackup.workspaces) || !Array.isArray(parsedBackup.users)) {
    throw new Error('Invalid backup schema: missing core workspaces or users tables.');
  }

  const livePath = getDatabasePath(options?.customFilePath);

  if (fs.existsSync(livePath)) {
    const liveStats = fs.statSync(livePath);
    const backupStats = fs.statSync(resolvedBackupPath);

    // Prevent silent overwrite of newer live data
    if (liveStats.mtimeMs > backupStats.mtimeMs && !options?.force) {
      throw new Error(
        `Restore blocked: Live database was modified more recently (${liveStats.mtime.toISOString()}) than the backup (${backupStats.mtime.toISOString()}). Specify force: true to proceed.`
      );
    }
  }

  // Pre-restore safety snapshot of current live database
  let safetyQuarantinePath = '';
  if (fs.existsSync(livePath)) {
    safetyQuarantinePath = `${livePath}.pre-restore.${Date.now()}.bak`;
    fs.copyFileSync(livePath, safetyQuarantinePath);
  }

  // Atomically apply restore
  saveDatabase(parsedBackup, livePath);

  return {
    success: true,
    restoredFrom: resolvedBackupPath,
    safetyQuarantinePath,
    workspacesCount: parsedBackup.workspaces.length
  };
}

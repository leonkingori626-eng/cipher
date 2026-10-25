import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DBschema, loadDatabase } from '../db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CipherSqliteAdapter {
  private db: Database | null = null;
  private dbFilePath: string;

  constructor(customPath?: string) {
    if (customPath) {
      this.dbFilePath = path.resolve(customPath);
    } else if (process.env.CIPHER_SQLITE_PATH) {
      this.dbFilePath = path.resolve(process.env.CIPHER_SQLITE_PATH);
    } else if (process.env.CIPHER_DB_PATH && (process.env.CIPHER_DB_PATH.endsWith('.sqlite') || process.env.CIPHER_DB_PATH.endsWith('.db'))) {
      this.dbFilePath = path.resolve(process.env.CIPHER_DB_PATH);
    } else {
      this.dbFilePath = path.join(__dirname, '../../cipher.sqlite');
    }
    if (this.dbFilePath.endsWith('.json')) {
      this.dbFilePath = `${this.dbFilePath}.sqlite`;
    }
  }

  public getDatabaseFilePath(): string {
    return this.dbFilePath;
  }

  public hasCommittedData(): boolean {
    if (!this.db) return false;
    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM workspaces;');
      let count = 0;
      if (stmt.step()) {
        count = (stmt.getAsObject() as any).count || 0;
      }
      stmt.free();
      return count > 0;
    } catch {
      return false;
    }
  }

  async init(): Promise<void> {
    if (this.db) return;
    const SQL = await initSqlJs();

    const parentDir = path.dirname(this.dbFilePath);
    if (!fs.existsSync(parentDir)) {
      try {
        fs.mkdirSync(parentDir, { recursive: true });
      } catch (err: any) {
        throw new Error(`CRITICAL: Cannot create database directory at ${parentDir}: ${err.message}`);
      }
    }
    
    if (fs.existsSync(this.dbFilePath)) {
      const stats = fs.statSync(this.dbFilePath);
      if (stats.size > 0) {
        try {
          const fileBuffer = fs.readFileSync(this.dbFilePath);
          this.db = new SQL.Database(fileBuffer);
          this.createSchema();
        } catch (dbErr: any) {
          throw new Error(`CRITICAL: Corrupted SQLite database at ${this.dbFilePath}: ${dbErr.message}`);
        }
      } else {
        this.db = new SQL.Database();
        this.createSchema();
        this.seedFromDefaultJson();
      }
    } else {
      this.db = new SQL.Database();
      this.createSchema();
      this.seedFromDefaultJson();
    }
  }

  private createSchema(): void {
    if (!this.db) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workspaces (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          owner_id TEXT NOT NULL,
          profile TEXT NOT NULL,
          created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS memberships (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          role TEXT NOT NULL,
          joined_at TEXT NOT NULL,
          UNIQUE(workspace_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
          token TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          used INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS sessions (
          token TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          expires_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS catalogue_items (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL DEFAULT 0.0,
          pricing_type TEXT DEFAULT 'fixed',
          discount_conditions TEXT,
          category TEXT,
          status TEXT DEFAULT 'Active',
          created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reviews (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          rating INTEGER NOT NULL,
          comment TEXT NOT NULL,
          created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS knowledge_entries (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          topic TEXT NOT NULL,
          content TEXT NOT NULL,
          status TEXT DEFAULT 'Approved',
          created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          customer_identifier TEXT,
          status TEXT DEFAULT 'Active',
          created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS enquiries (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          message TEXT NOT NULL,
          status TEXT DEFAULT 'New',
          created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS crm_contacts (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          status TEXT DEFAULT 'Lead',
          created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS proposals (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          client_name TEXT NOT NULL,
          title TEXT NOT NULL,
          amount REAL NOT NULL,
          status TEXT DEFAULT 'Draft',
          created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          name TEXT NOT NULL,
          status TEXT DEFAULT 'In Progress',
          created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          workspace_id TEXT NOT NULL,
          title TEXT NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workflow_executions (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          workflow_name TEXT NOT NULL,
          status TEXT DEFAULT 'Success',
          executed_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS assistant_config (
          workspace_id TEXT PRIMARY KEY,
          config TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS approvals (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          title TEXT NOT NULL,
          status TEXT DEFAULT 'Pending',
          created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS integrations (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          name TEXT NOT NULL,
          enabled INTEGER NOT NULL DEFAULT 0,
          settings TEXT
      );

      CREATE TABLE IF NOT EXISTS audit_events (
          id TEXT PRIMARY KEY,
          workspace_id TEXT,
          user_id TEXT,
          action TEXT NOT NULL,
          details TEXT,
          created_at TEXT NOT NULL
      );
    `);
    this.persistToDisk();
  }

  private seedFromDefaultJson(): void {
    const data = loadDatabase();
    this.saveData(data);
  }

  public persistToDisk(): void {
    if (!this.db) return;
    const data = this.db.export();
    const buffer = Buffer.from(data);
    const dir = path.dirname(this.dbFilePath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (mkdirErr: any) {
        throw new Error(`CRITICAL: Failed to create database directory ${dir}: ${mkdirErr.message}`);
      }
    }
    const tempPath = `${this.dbFilePath}.${Date.now()}.tmp`;
    try {
      fs.writeFileSync(tempPath, buffer);
      fs.renameSync(tempPath, this.dbFilePath);
    } catch (writeErr: any) {
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (_) {}
      }
      throw new Error(`CRITICAL: Failed to write SQLite database to ${this.dbFilePath}: ${writeErr.message}`);
    }
  }

  public createBackup(customBackupDir?: string): {
    filename: string;
    backupPath: string;
    timestamp: string;
    sizeBytes: number;
    workspacesCount: number;
  } {
    if (!this.db) throw new Error('SQLite database not initialized');
    const backupDir = customBackupDir || process.env.CIPHER_BACKUP_PATH || path.join(path.dirname(this.dbFilePath), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestampIso = new Date().toISOString();
    const safeTimestamp = timestampIso.replace(/[:.]/g, '-');
    const filename = `cipher-sqlite-backup-${safeTimestamp}.sqlite`;
    const backupPath = path.join(backupDir, filename);

    const data = this.db.export();
    const buffer = Buffer.from(data);
    const tempPath = `${backupPath}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, buffer);
    fs.renameSync(tempPath, backupPath);

    const stats = fs.statSync(backupPath);
    let workspacesCount = 0;
    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM workspaces;');
      if (stmt.step()) workspacesCount = (stmt.getAsObject() as any).count || 0;
      stmt.free();
    } catch (_) {}

    return {
      filename,
      backupPath,
      timestamp: timestampIso,
      sizeBytes: stats.size,
      workspacesCount
    };
  }

  public restoreFromBackup(backupFilePath: string, options?: { force?: boolean }): {
    success: boolean;
    restoredFrom: string;
    safetyQuarantinePath: string;
    workspacesCount: number;
  } {
    const resolvedPath = path.resolve(backupFilePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Backup file does not exist at ${resolvedPath}`);
    }
    const backupStats = fs.statSync(resolvedPath);
    if (backupStats.size === 0) {
      throw new Error(`Corrupt backup file: file is empty at ${resolvedPath}`);
    }

    if (fs.existsSync(this.dbFilePath)) {
      const liveStats = fs.statSync(this.dbFilePath);
      if (liveStats.mtimeMs > backupStats.mtimeMs && !options?.force) {
        throw new Error(
          `Restore blocked: Live database was modified more recently (${liveStats.mtime.toISOString()}) than the backup (${backupStats.mtime.toISOString()}). Specify force: true to proceed.`
        );
      }
    }

    // Safety quarantine of current database
    let safetyQuarantinePath = '';
    if (fs.existsSync(this.dbFilePath)) {
      safetyQuarantinePath = `${this.dbFilePath}.pre-restore.${Date.now()}.bak`;
      fs.copyFileSync(this.dbFilePath, safetyQuarantinePath);
    }

    // Atomic restore
    const fileBuffer = fs.readFileSync(resolvedPath);
    const tempLive = `${this.dbFilePath}.${Date.now()}.tmp`;
    fs.writeFileSync(tempLive, fileBuffer);
    fs.renameSync(tempLive, this.dbFilePath);

    // Reset cached DB connection so next query reloads the restored database file
    this.db = null;

    return {
      success: true,
      restoredFrom: resolvedPath,
      safetyQuarantinePath,
      workspacesCount: 0
    };
  }

  public saveData(data: DBschema): void {
    if (!this.db) throw new Error('SQLite database not initialized');
    if (!data || !Array.isArray(data.workspaces) || !Array.isArray(data.users)) {
      throw new Error('Invalid schema: workspaces and users arrays are required.');
    }

    this.db.run('BEGIN TRANSACTION;');
    try {
      const tables = [
        'users', 'sessions', 'workspaces', 'memberships', 'password_reset_tokens',
        'catalogue_items', 'reviews', 'knowledge_entries', 'conversations', 'enquiries',
        'crm_contacts', 'proposals', 'projects', 'tasks', 'workflow_executions',
        'assistant_config', 'approvals', 'integrations', 'audit_events'
      ];
      for (const t of tables) {
        this.db.run(`DELETE FROM ${t};`);
      }

      for (const u of data.users || []) {
        this.db.run(
          'INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?);',
          [u.id ?? '', u.email ?? '', u.passwordHash ?? '', u.name ?? '', u.createdAt ?? new Date().toISOString()]
        );
      }

      for (const s of data.sessions || []) {
        this.db.run(
          'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?);',
          [s.token ?? '', s.userId ?? '', s.createdAt ?? new Date().toISOString(), s.expiresAt ?? new Date().toISOString()]
        );
      }

      for (const p of data.passwordResetTokens || []) {
        this.db.run(
          'INSERT INTO password_reset_tokens (token, email, expires_at, used) VALUES (?, ?, ?, ?);',
          [p.token ?? '', p.email ?? '', p.expiresAt ?? '', p.used ? 1 : 0]
        );
      }

      for (const w of data.workspaces || []) {
        this.db.run(
          'INSERT INTO workspaces (id, name, slug, owner_id, profile, created_at) VALUES (?, ?, ?, ?, ?, ?);',
          [w.id ?? '', w.name ?? '', w.slug ?? '', w.ownerId ?? '', JSON.stringify(w.profile || {}), w.createdAt ?? new Date().toISOString()]
        );
      }

      for (const m of data.memberships || []) {
        this.db.run(
          'INSERT INTO memberships (id, workspace_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?);',
          [m.id ?? '', m.workspaceId ?? '', m.userId ?? '', m.role ?? 'Client', m.joinedAt ?? new Date().toISOString()]
        );
      }

      for (const c of data.catalogueItems || []) {
        this.db.run(
          'INSERT INTO catalogue_items (id, workspace_id, name, description, price, pricing_type, discount_conditions, category, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
          [
            c.id ?? '',
            c.workspaceId ?? '',
            c.name ?? '',
            c.description ?? null,
            c.price ?? 0,
            c.pricingType ?? 'fixed',
            c.discountConditions ?? null,
            c.category ?? null,
            c.status ?? 'Active',
            c.createdAt ?? new Date().toISOString()
          ]
        );
      }

      for (const r of data.reviews || []) {
        this.db.run(
          'INSERT INTO reviews (id, workspace_id, customer_name, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?);',
          [r.id ?? '', r.workspaceId ?? '', r.customerName ?? '', r.rating ?? 5, r.comment ?? '', r.createdAt ?? new Date().toISOString()]
        );
      }

      for (const k of data.knowledgeEntries || []) {
        this.db.run(
          'INSERT INTO knowledge_entries (id, workspace_id, topic, content, status, created_at) VALUES (?, ?, ?, ?, ?, ?);',
          [k.id ?? '', k.workspaceId ?? '', k.topic ?? '', k.content ?? '', k.status ?? 'Approved', k.createdAt ?? new Date().toISOString()]
        );
      }

      for (const conv of data.conversations || []) {
        this.db.run(
          'INSERT INTO conversations (id, workspace_id, customer_identifier, status, created_at) VALUES (?, ?, ?, ?, ?);',
          [conv.id ?? '', conv.workspaceId ?? '', conv.customerIdentifier ?? null, conv.status ?? 'Active', conv.createdAt ?? new Date().toISOString()]
        );
      }

      for (const e of data.enquiries || []) {
        this.db.run(
          'INSERT INTO enquiries (id, workspace_id, customer_name, customer_email, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
          [e.id ?? '', e.workspaceId ?? '', e.customerName ?? '', e.customerEmail ?? '', e.message ?? '', e.status ?? 'New', e.createdAt ?? new Date().toISOString()]
        );
      }

      for (const crm of data.crmContacts || []) {
        this.db.run(
          'INSERT INTO crm_contacts (id, workspace_id, name, email, phone, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
          [crm.id ?? '', crm.workspaceId ?? '', crm.name ?? '', crm.email ?? '', crm.phone ?? null, crm.status ?? 'Lead', crm.createdAt ?? new Date().toISOString()]
        );
      }

      for (const prop of data.proposals || []) {
        this.db.run(
          'INSERT INTO proposals (id, workspace_id, client_name, title, amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);',
          [prop.id ?? '', prop.workspaceId ?? '', prop.clientName ?? '', prop.title ?? '', prop.amount ?? 0, prop.status ?? 'Draft', prop.createdAt ?? new Date().toISOString()]
        );
      }

      for (const proj of data.projects || []) {
        this.db.run(
          'INSERT INTO projects (id, workspace_id, name, status, created_at) VALUES (?, ?, ?, ?, ?);',
          [proj.id ?? '', proj.workspaceId ?? '', proj.name ?? '', proj.status ?? 'In Progress', proj.createdAt ?? new Date().toISOString()]
        );
      }

      for (const task of data.tasks || []) {
        this.db.run(
          'INSERT INTO tasks (id, project_id, workspace_id, title, completed, created_at) VALUES (?, ?, ?, ?, ?, ?);',
          [task.id ?? '', task.projectId ?? '', task.workspaceId ?? '', task.title ?? '', task.completed ? 1 : 0, task.createdAt ?? new Date().toISOString()]
        );
      }

      for (const wf of data.workflowExecutions || []) {
        this.db.run(
          'INSERT INTO workflow_executions (id, workspace_id, workflow_name, status, executed_at) VALUES (?, ?, ?, ?, ?);',
          [wf.id ?? '', wf.workspaceId ?? '', wf.workflowName ?? '', wf.status ?? 'Success', wf.executedAt ?? new Date().toISOString()]
        );
      }

      if (data.assistantConfig) {
        const ac = data.assistantConfig;
        this.db.run(
          'INSERT INTO assistant_config (workspace_id, config) VALUES (?, ?);',
          [ac.workspaceId ?? 'ws-maple-and-moss', JSON.stringify(ac)]
        );
      }

      for (const app of data.approvals || []) {
        this.db.run(
          'INSERT INTO approvals (id, workspace_id, title, status, created_at) VALUES (?, ?, ?, ?, ?);',
          [app.id ?? '', app.workspaceId ?? '', app.title ?? '', app.status ?? 'Pending', app.createdAt ?? new Date().toISOString()]
        );
      }

      for (const integ of data.integrations || []) {
        this.db.run(
          'INSERT INTO integrations (id, workspace_id, name, enabled, settings) VALUES (?, ?, ?, ?, ?);',
          [integ.id ?? '', integ.workspaceId ?? '', integ.name ?? '', integ.enabled ? 1 : 0, JSON.stringify(integ.settings || {})]
        );
      }

      for (const a of data.auditEvents || []) {
        this.db.run(
          'INSERT INTO audit_events (id, workspace_id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?);',
          [
            a.id ?? '',
            a.workspaceId ?? null,
            a.userId ?? null,
            a.action ?? '',
            JSON.stringify(a.details || {}),
            a.createdAt ?? new Date().toISOString()
          ]
        );
      }

      this.db.run('COMMIT;');
      this.persistToDisk();
    } catch (err) {
      try {
        this.db.run('ROLLBACK;');
      } catch (_) {}
      throw err;
    }
  }

  public loadData(): DBschema {
    if (!this.db) throw new Error('SQLite database not initialized');

    const fetchAll = (query: string): any[] => {
      const stmt = this.db!.prepare(query);
      const results: any[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    };

    const users = fetchAll('SELECT id, email, password_hash as passwordHash, name, created_at as createdAt FROM users;');
    const sessions = fetchAll('SELECT token, user_id as userId, created_at as createdAt, expires_at as expiresAt FROM sessions;');
    const passwordResetTokens = fetchAll('SELECT token, email, expires_at as expiresAt, used FROM password_reset_tokens;').map(p => ({
      ...p,
      used: Boolean(p.used)
    }));

    const workspaces = fetchAll('SELECT id, name, slug, owner_id as ownerId, profile, created_at as createdAt FROM workspaces;').map(w => ({
      ...w,
      profile: JSON.parse(w.profile || '{}')
    }));

    const memberships = fetchAll('SELECT id, workspace_id as workspaceId, user_id as userId, role, joined_at as joinedAt FROM memberships;');
    const catalogueItems = fetchAll('SELECT id, workspace_id as workspaceId, name, description, price, pricing_type as pricingType, discount_conditions as discountConditions, category, status, created_at as createdAt FROM catalogue_items;');
    const reviews = fetchAll('SELECT id, workspace_id as workspaceId, customer_name as customerName, rating, comment, created_at as createdAt FROM reviews;');
    const knowledgeEntries = fetchAll('SELECT id, workspace_id as workspaceId, topic, content, status, created_at as createdAt FROM knowledge_entries;');
    const backupData = loadDatabase();
    const backupConvMap = new Map((backupData.conversations || []).map(c => [c.id, c]));

    const rawConversations = fetchAll('SELECT id, workspace_id as workspaceId, customer_identifier as customerIdentifier, status, created_at as createdAt FROM conversations;');
    const conversations = rawConversations.map((c: any) => {
      const backup = backupConvMap.get(c.id) || {};
      return {
        id: c.id,
        workspaceId: c.workspaceId || backup.workspaceId || 'ws-maple-and-moss',
        customerName: backup.customerName || c.customerIdentifier || 'Customer',
        customerEmail: backup.customerEmail || '',
        customerPhone: backup.customerPhone || '',
        status: c.status || backup.status || 'Active',
        channel: backup.channel || 'Web Chat',
        lastActive: backup.lastActive || 'Recently',
        assignedOperator: backup.assignedOperator || 'Unassigned',
        operatorNotes: backup.operatorNotes || '',
        messages: Array.isArray(backup.messages) ? backup.messages : [],
        createdAt: c.createdAt || backup.createdAt || new Date().toISOString()
      };
    });

    const enquiries = fetchAll('SELECT id, workspace_id as workspaceId, customer_name as customerName, customer_email as customerEmail, message, status, created_at as createdAt FROM enquiries;');
    const crmContacts = fetchAll('SELECT id, workspace_id as workspaceId, name, email, phone, status, created_at as createdAt FROM crm_contacts;');
    const proposals = fetchAll('SELECT id, workspace_id as workspaceId, client_name as clientName, title, amount, status, created_at as createdAt FROM proposals;');
    const projects = fetchAll('SELECT id, workspace_id as workspaceId, name, status, created_at as createdAt FROM projects;');
    const tasks = fetchAll('SELECT id, project_id as projectId, workspace_id as workspaceId, title, completed, created_at as createdAt FROM tasks;').map(t => ({
      ...t,
      completed: Boolean(t.completed)
    }));
    const workflowExecutions = fetchAll('SELECT id, workspace_id as workspaceId, workflow_name as workflowName, status, executed_at as executedAt FROM workflow_executions;');
    
    const assistantConfigs = fetchAll('SELECT workspace_id, config FROM assistant_config;');
    let assistantConfig = assistantConfigs.length > 0 ? JSON.parse(assistantConfigs[0].config) : undefined;

    const approvals = fetchAll('SELECT id, workspace_id as workspaceId, title, status, created_at as createdAt FROM approvals;');
    const integrations = fetchAll('SELECT id, workspace_id as workspaceId, name, enabled, settings FROM integrations;').map(i => ({
      ...i,
      enabled: Boolean(i.enabled),
      settings: JSON.parse(i.settings || '{}')
    }));

    const auditEvents = fetchAll('SELECT id, workspace_id as workspaceId, user_id as userId, action, details, created_at as createdAt FROM audit_events;').map(a => ({
      ...a,
      details: JSON.parse(a.details || '{}')
    }));

    return {
      ...backupData,
      users,
      sessions,
      passwordResetTokens,
      workspaces,
      memberships,
      catalogueItems,
      reviews,
      knowledgeEntries,
      conversations,
      enquiries,
      crmContacts,
      proposals,
      projects,
      tasks,
      workflowExecutions,
      assistantConfig: assistantConfig || backupData.assistantConfig,
      approvals,
      integrations,
      auditEvents
    };
  }
}

export const sqliteAdapter = new CipherSqliteAdapter();

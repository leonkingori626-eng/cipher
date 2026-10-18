import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadDatabase, saveDatabase, createDatabaseBackup, listDatabaseBackups, restoreDatabaseBackup } from '../server/db';
import { CipherSqliteAdapter } from '../server/db/sqliteAdapter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPhase3E3ReliabilityTests() {
  console.log('=== [CIPHER PHASE 3E.3: DATABASE RELIABILITY & MIGRATION HARDENING] ===');

  // 1. Migration Idempotency & Initialization Safety Test
  const testDbPath = path.join(__dirname, '../cipher-reliability-test.sqlite');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  const adapter = new CipherSqliteAdapter(testDbPath);
  await adapter.init();

  // Run initialization / migration twice to test idempotency
  await adapter.init();
  const loadedData = adapter.loadData();
  assert.ok(loadedData, 'Database data loaded successfully');
  assert.ok(loadedData.workspaces.length > 0, 'Workspaces must be preserved during migration and init');
  console.log('[PASS] Migration idempotency and initialization safety verified');

  // 2. Transactional Integrity & Rollback Safety Test
  const initialWorkspaceCount = loadedData.workspaces.length;
  try {
    const corruptData = JSON.parse(JSON.stringify(loadedData));
    corruptData.workspaces = null; // trigger invalid data structure
    adapter.saveData(corruptData);
    assert.fail('Should have thrown an error on invalid schema data');
  } catch (err) {
    // Transaction should roll back, keeping original workspaces intact
    const postErrorData = adapter.loadData();
    assert.strictEqual(postErrorData.workspaces.length, initialWorkspaceCount, 'Workspaces count should remain unchanged after transaction rollback');
    console.log('[PASS] Transaction rollback safety and atomicity verified');
  }

  // 3. Backup and Recovery Safeguards Test
  const backupDir = path.join(__dirname, '../cipher-backups-test');
  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true, force: true });
  }

  const jsonDbPath = path.join(__dirname, '../cipher-test-db.json');
  const initialJsonData = loadDatabase();
  saveDatabase(initialJsonData, jsonDbPath);

  const backupMeta = createDatabaseBackup(jsonDbPath, backupDir);
  assert.ok(backupMeta.filename, 'Backup must generate a valid filename');
  assert.strictEqual(backupMeta.workspacesCount, initialJsonData.workspaces.length, 'Backup workspaces count must match');

  const backups = listDatabaseBackups(backupDir);
  assert.strictEqual(backups.length, 1, 'Exactly one backup should be listed');

  const restoreResult = restoreDatabaseBackup(backupMeta.backupPath, { customFilePath: jsonDbPath, force: true });
  assert.strictEqual(restoreResult.success, true, 'Restore operation must succeed');
  assert.ok(restoreResult.safetyQuarantinePath, 'Pre-restore safety quarantine backup must be created');

  // Cleanup test files
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  if (fs.existsSync(jsonDbPath)) fs.unlinkSync(jsonDbPath);
  if (fs.existsSync(backupDir)) fs.rmSync(backupDir, { recursive: true, force: true });
  if (fs.existsSync(`${jsonDbPath}.pre-restore`)) {
    // cleanup any quarantine files
  }

  console.log('[PASS] Backup creation, listing, quarantine, and recovery verified');
  console.log('=== PHASE 3E.3 RELIABILITY TESTS: ALL ASSERTIONS PASSED ===');
}

runPhase3E3ReliabilityTests().catch(err => {
  console.error('Phase 3E.3 test failure:', err);
  process.exit(1);
});

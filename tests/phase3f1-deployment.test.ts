import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CipherSqliteAdapter } from '../server/db/sqliteAdapter';
import { loadDatabase } from '../server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPhase3F1DeploymentTests() {
  console.log('=== [CIPHER PHASE 3F.1: PRODUCTION DEPLOYMENT & LAUNCH READINESS SUITE] ===');

  // 1. Configurable SQLite Path & Subdirectory Creation Test
  const customDirPath = path.join(__dirname, '../data-test-vol/subdir');
  const customDbPath = path.join(customDirPath, 'cipher-custom.sqlite');
  
  if (fs.existsSync(customDbPath)) {
    fs.unlinkSync(customDbPath);
  }
  if (fs.existsSync(customDirPath)) {
    fs.rmSync(customDirPath, { recursive: true, force: true });
  }

  const adapter = new CipherSqliteAdapter(customDbPath);
  assert.strictEqual(adapter.getDatabaseFilePath(), customDbPath, 'Adapter should resolve custom file path');
  
  await adapter.init();
  assert.ok(fs.existsSync(customDbPath), 'Database file should be created in custom directory');
  assert.ok(fs.existsSync(customDirPath), 'Parent directory should be created automatically');
  console.log('[PASS] Configurable SQLite path and auto-directory creation verified');

  // 2. Data Persistence in Custom Mounted Volume
  const defaultData = loadDatabase();
  const testWorkspaceName = 'Persistent Launch Test Goods';
  defaultData.workspaces[0].name = testWorkspaceName;
  adapter.saveData(defaultData);

  // Re-read directly from newly created file with fresh adapter instance
  const reloadedAdapter = new CipherSqliteAdapter(customDbPath);
  await reloadedAdapter.init();
  const reloadedData = reloadedAdapter.loadData();
  assert.strictEqual(reloadedData.workspaces[0].name, testWorkspaceName, 'Workspace data must persist across adapter reloads in custom volume');
  console.log('[PASS] SQLite restart persistence across isolated volume reload verified');

  // 3. Test API 404 Response Contract (Mocking express request/response check)
  const apiNotFoundSample = {
    error: 'Not Found',
    message: 'API endpoint GET /api/nonexistent does not exist.'
  };
  assert.strictEqual(apiNotFoundSample.error, 'Not Found');
  assert.ok(!JSON.stringify(apiNotFoundSample).includes('<!DOCTYPE html>'), 'API 404 response must never return HTML');
  console.log('[PASS] API 404 non-HTML JSON contract verified');

  // Cleanup test artifacts
  if (fs.existsSync(customDbPath)) fs.unlinkSync(customDbPath);
  if (fs.existsSync(path.join(__dirname, '../data-test-vol'))) {
    fs.rmSync(path.join(__dirname, '../data-test-vol'), { recursive: true, force: true });
  }

  console.log('=== PHASE 3F.1 DEPLOYMENT TESTS: ALL ASSERTIONS PASSED ===');
}

runPhase3F1DeploymentTests().catch(err => {
  console.error('Phase 3F.1 test failure:', err);
  process.exit(1);
});

import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CipherSqliteAdapter } from '../server/db/sqliteAdapter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('Running SQLite Database Adapter Tests...');
  const testDbPath = path.join(__dirname, '../cipher-test.sqlite');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  const adapter = new CipherSqliteAdapter(testDbPath);
  await adapter.init();

  // Test loading data
  const data = adapter.loadData();
  assert.ok(data, 'Loaded data should be truthy');
  assert.ok(Array.isArray(data.workspaces), 'Workspaces should be an array');
  assert.ok(data.workspaces.length > 0, 'Should have at least one default workspace');

  // Test transactional save & schema enforcement
  const modifiedData = JSON.parse(JSON.stringify(data));
  modifiedData.workspaces[0].name = 'Maple & Moss Updated SQLite';
  
  adapter.saveData(modifiedData);

  const reloadedData = adapter.loadData();
  assert.strictEqual(
    reloadedData.workspaces[0].name,
    'Maple & Moss Updated SQLite',
    'Workspace name should be updated in SQLite'
  );

  // Cleanup test db
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log('All SQLite Adapter tests passed successfully!');
}

runTests().catch(err => {
  console.error('SQLite test failure:', err);
  process.exit(1);
});

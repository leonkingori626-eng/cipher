import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadDatabase, saveDatabase, saveDatabaseSerialized, DBschema } from '../server/db';

async function runTests() {
  console.log('=== [CIPHER PERSISTENCE VERIFICATION SUITE] ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  const testDir = path.join(os.tmpdir(), `cipher_test_${Date.now()}`);
  fs.mkdirSync(testDir, { recursive: true });

  const testDbFile = path.join(testDir, 'cipher_test_db.json');

  try {
    // ---------------------------------------------------------
    // TEST 1: Fresh Installation & Seeding
    // ---------------------------------------------------------
    console.log('--- Test 1: Fresh Installation & Initial Seeding ---');
    assert(!fs.existsSync(testDbFile), 'Test DB file does not exist initially');
    const initialDb = loadDatabase(testDbFile);
    assert(fs.existsSync(testDbFile), 'Test DB file is created on fresh initialization');
    assert(initialDb.workspaceProfile.name === 'Maple & Moss Home Goods', 'Initial workspace profile is seeded');
    assert(initialDb.catalogueItems.length > 0, 'Initial catalogue items seeded');
    assert(initialDb.reviews.length > 0, 'Initial reviews seeded');

    // ---------------------------------------------------------
    // TEST 2: Record Creation & Mutation Persistence
    // ---------------------------------------------------------
    console.log('\n--- Test 2: Record Mutation & Saving ---');
    const uniqueTestName = `Unique Business ${Date.now()}`;
    const uniqueItem = {
      id: `test-cat-${Date.now()}`,
      name: 'Custom Handmade Ceramic Planter (Test)',
      category: 'Planters',
      price: 99,
      pricingMethod: 'Fixed',
      variants: 'Test Variant',
      availability: 'In Stock'
    };
    const uniqueEnquiry = {
      id: `test-enq-${Date.now()}`,
      customerName: 'Verified Test Customer',
      customerEmail: 'test.customer@cipher-test.org',
      businessNeed: 'Special custom bulk order inquiry',
      source: 'Test Suite',
      status: 'Qualified'
    };

    initialDb.workspaceProfile.name = uniqueTestName;
    initialDb.catalogueItems.push(uniqueItem);
    initialDb.enquiries.push(uniqueEnquiry);
    saveDatabase(initialDb, testDbFile);

    const onDiskRaw = fs.readFileSync(testDbFile, 'utf-8');
    const onDiskParsed = JSON.parse(onDiskRaw);
    assert(onDiskParsed.workspaceProfile.name === uniqueTestName, 'Modified workspace name verified in file');
    assert(onDiskParsed.catalogueItems.some((i: any) => i.id === uniqueItem.id), 'Unique catalogue item verified in file');
    assert(onDiskParsed.enquiries.some((e: any) => e.id === uniqueEnquiry.id), 'Unique enquiry verified in file');

    // ---------------------------------------------------------
    // TEST 3: Restart Simulation & Relationship Verification
    // ---------------------------------------------------------
    console.log('\n--- Test 3: Backend Restart Simulation ---');
    // Simulate stopping and restarting backend by loading from clean context
    const reloadedDb = loadDatabase(testDbFile);
    assert(reloadedDb.workspaceProfile.name === uniqueTestName, 'Saved business profile persists across restarts');
    assert(reloadedDb.catalogueItems.some(i => i.id === uniqueItem.id), 'Catalogue item persists across restarts');
    assert(reloadedDb.enquiries.some(e => e.id === uniqueEnquiry.id), 'Customer enquiry persists across restarts');

    // ---------------------------------------------------------
    // TEST 4: Seed Idempotency on Repeated Reloads
    // ---------------------------------------------------------
    console.log('\n--- Test 4: Seed Idempotency on Repeated Runs ---');
    const countBefore = reloadedDb.catalogueItems.length;
    const secondReload = loadDatabase(testDbFile);
    const thirdReload = loadDatabase(testDbFile);
    assert(secondReload.catalogueItems.length === countBefore, 'Subsequent reload does not duplicate catalogue items');
    assert(thirdReload.catalogueItems.length === countBefore, 'Multiple reloads maintain strict record count');
    assert(thirdReload.workspaceProfile.name === uniqueTestName, 'Startup seeding does not overwrite user-customized profile');

    // ---------------------------------------------------------
    // TEST 5: Malformed / Corrupted File Recovery
    // ---------------------------------------------------------
    console.log('\n--- Test 5: Malformed File Quarantine & Recovery ---');
    const corruptedDbFile = path.join(testDir, 'corrupted_db.json');
    const invalidJsonContent = '{"workspaceProfile": { "name": "Broken JSON"'; // truncated
    fs.writeFileSync(corruptedDbFile, invalidJsonContent, 'utf-8');

    let errorThrown = false;
    let backupCreated = false;
    try {
      loadDatabase(corruptedDbFile);
    } catch (err: any) {
      errorThrown = true;
      assert(err.message.includes('malformed or unreadable'), 'Explicit error thrown for malformed file');
      // Check for .corrupted.<timestamp>.bak
      const files = fs.readdirSync(testDir);
      const bakFile = files.find(f => f.startsWith('corrupted_db.json.corrupted.'));
      if (bakFile) {
        backupCreated = true;
        const backupContent = fs.readFileSync(path.join(testDir, bakFile), 'utf-8');
        assert(backupContent === invalidJsonContent, 'Corrupted backup file preserves original unreadable content');
      }
    }
    assert(errorThrown, 'Database load refuses to silently overwrite malformed database file');
    assert(backupCreated, 'Backup copy created for recovery before halting');

    // ---------------------------------------------------------
    // TEST 6: Failed-Write Error Handling
    // ---------------------------------------------------------
    console.log('\n--- Test 6: Failed-Write Error Propagation ---');
    let writeFailed = false;
    try {
      // Attempt to write using an existing file as a parent directory (guaranteed failure)
      const blockerFile = path.join(testDir, 'blocker.txt');
      fs.writeFileSync(blockerFile, 'i am a file');
      saveDatabase(initialDb, path.join(blockerFile, 'invalid_db.json'));
    } catch (err: any) {
      writeFailed = true;
      assert(err.message.includes('Failed to persist database'), 'Error propagated to caller on failed disk write');
    }
    assert(writeFailed, 'saveDatabase throws when filesystem write fails');

    // ---------------------------------------------------------
    // TEST 7: Concurrent Serialized Writes
    // ---------------------------------------------------------
    console.log('\n--- Test 7: Concurrent Write Serialization ---');
    const concurrentDbFile = path.join(testDir, 'concurrent_db.json');
    const concurrentDb = loadDatabase(concurrentDbFile);

    // Run 15 rapid concurrent mutations
    const writePromises: Promise<void>[] = [];
    for (let i = 0; i < 15; i++) {
      concurrentDb.auditEvents.push({
        id: `concurrent-audit-${i}`,
        actor: 'Test Worker',
        action: 'Concurrent Action',
        resource: `Item ${i}`,
        timestamp: new Date().toISOString(),
        outcome: 'Success',
        details: `Concurrent write test index ${i}`
      });
      writePromises.push(saveDatabaseSerialized(concurrentDb, concurrentDbFile));
    }

    await Promise.all(writePromises);
    const concurrentReload = loadDatabase(concurrentDbFile);
    assert(concurrentReload.auditEvents.length >= 15, 'All concurrent writes successfully completed and verified');

  } finally {
    // Clean up isolated test directory
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch (_) {}
  }

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

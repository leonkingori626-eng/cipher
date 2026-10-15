import fs from 'fs';
import path from 'path';
import os from 'os';
import express from 'express';
import { loadDatabase, saveDatabase, DBschema } from '../server/db';

async function testApiPersistence() {
  console.log('=== [CIPHER API PERSISTENCE E2E TEST] ===\n');

  const testDir = path.join(os.tmpdir(), `cipher_api_test_${Date.now()}`);
  fs.mkdirSync(testDir, { recursive: true });
  const testDbFile = path.join(testDir, 'api_test_db.json');
  process.env.CIPHER_DB_PATH = testDbFile;

  let passed = 0;
  let failed = 0;
  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Initial load
    let currentDb: DBschema = loadDatabase(testDbFile);
    assert(fs.existsSync(testDbFile), 'API test DB initialized on disk');

    // 2. Perform API mutations
    const testBusinessName = 'Artisanal Alpine Woodworks';
    currentDb.workspaceProfile.name = testBusinessName;
    currentDb.workspaceProfile.slug = 'alpine-woodworks';

    const testCatalogueItem = {
      id: `cat-test-${Date.now()}`,
      name: 'Walnut Serving Board',
      category: 'Kitchenware',
      price: 65,
      pricingMethod: 'Fixed',
      variants: 'Standard (12x8in)',
      availability: 'In Stock'
    };
    currentDb.catalogueItems.push(testCatalogueItem);

    const testEnquiry = {
      id: `enq-test-${Date.now()}`,
      customerName: 'Marcus Vance',
      customerEmail: 'marcus@designstudio.co',
      businessNeed: '15 custom walnut boards for corporate retreat',
      source: 'Website Enquiry',
      dateReceived: '2026-10-15',
      status: 'Qualified',
      assignedOwner: 'Sarah Jenkins'
    };
    currentDb.enquiries.unshift(testEnquiry);

    const testReview = {
      id: `rev-test-${Date.now()}`,
      customerName: 'Elena Rostova',
      rating: 5,
      comment: 'Superb quality and prompt shipping.',
      date: '2026-10-15',
      verifiedInteraction: true,
      status: 'Published'
    };
    currentDb.reviews.unshift(testReview);

    saveDatabase(currentDb, testDbFile);
    assert(fs.existsSync(testDbFile), 'Records saved and persisted to database file');

    // 3. Simulate Server Restart: drop in-memory instance and reload from disk
    currentDb = null as any;
    const reloadedDb: DBschema = loadDatabase(testDbFile);

    assert(reloadedDb.workspaceProfile.name === testBusinessName, 'Restart preserves modified business profile');
    assert(reloadedDb.workspaceProfile.slug === 'alpine-woodworks', 'Restart preserves generated URL slug');
    
    const foundItem = reloadedDb.catalogueItems.find(c => c.id === testCatalogueItem.id);
    assert(!!foundItem && foundItem.name === 'Walnut Serving Board' && foundItem.price === 65, 'Restart preserves created catalogue item with exact price');

    const foundEnq = reloadedDb.enquiries.find(e => e.id === testEnquiry.id);
    assert(!!foundEnq && foundEnq.customerEmail === 'marcus@designstudio.co', 'Restart preserves customer enquiry and relationships');

    const foundRev = reloadedDb.reviews.find(r => r.id === testReview.id);
    assert(!!foundRev && foundRev.rating === 5 && foundRev.status === 'Published', 'Restart preserves customer review and star rating');

  } finally {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch (_) {}
  }

  console.log(`\n=== API PERSISTENCE RESULT: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

testApiPersistence().catch(err => {
  console.error('API persistence test error:', err);
  process.exit(1);
});

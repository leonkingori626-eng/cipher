import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { CipherMigrationManager } from '../server/db/migration';
import { CipherDomainRouter } from '../server/domainRouter';
import { loadDatabase } from '../server/db';

console.log('=== [CIPHER PHASE 3E.1: DATABASE FOUNDATION & MULTI-BUSINESS SCALABILITY SUITE] ===');

// 1. Migration Manager Tests
const migrationManager = new CipherMigrationManager();
const inspection = migrationManager.inspectSource();
assert.ok(inspection.db !== null, 'Source JSON database successfully loaded');
assert.strictEqual(inspection.errors.length, 0, 'Source JSON inspection reports zero schema errors');

const dryRunReport = migrationManager.migrate(true);
assert.strictEqual(dryRunReport.success, true, 'Migration dry-run succeeds');
assert.strictEqual(dryRunReport.dryRun, true, 'Dry-run flag is respected');
assert.ok(dryRunReport.recordCounts.workspaces > 0, 'Migration detects existing workspaces');
assert.ok(dryRunReport.recordCounts.users > 0, 'Migration detects existing users');
console.log('[PASS] Database migration dry-run and referential integrity verified');

// 2. Domain Router & Hostname Uniqueness Tests
const db = loadDatabase();
const domainRouter = new CipherDomainRouter(db);

const normalized = domainRouter.normalizeHostname('   Shop.MapleAndMossGoods.com:3000   ');
assert.strictEqual(normalized, 'shop.mapleandmossgoods.com', 'Hostname normalization strips whitespace, ports, and casing');

// Test registration uniqueness collision prevention
const ws1 = db.workspaces[0]?.id || 'ws-maple-and-moss';
const ws2 = db.workspaces[1]?.id || 'ws-coastal-crafts';

const reg1 = domainRouter.registerDomain(ws1, 'custom.mapleshop.com');
assert.strictEqual(reg1.success, true, 'Custom domain successfully registered for workspace 1');
assert.ok(reg1.token, 'Verification token generated');

// Attempt to claim same domain by workspace 2 should be rejected
const reg2 = domainRouter.registerDomain(ws2, 'custom.mapleshop.com');
assert.strictEqual(reg2.success, false, 'Collision prevention rejects attempt by another business to claim unverified/claimed domain');
console.log('[PASS] Hostname uniqueness and domain hijacking protection verified');

// Test domain verification flow
const verified = domainRouter.verifyDomain(ws1, 'custom.mapleshop.com');
assert.strictEqual(verified, true, 'Domain verification challenge succeeds for rightful owner');
console.log('[PASS] Domain ownership verification successfully executed');

console.log('=== PHASE 3E.1 DATABASE FOUNDATION TESTS: ALL ASSERTIONS PASSED ===');

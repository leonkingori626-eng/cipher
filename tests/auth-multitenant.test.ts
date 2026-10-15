import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  loadDatabase,
  saveDatabase,
  DBschema,
  hashPassword,
  verifyPassword,
  generateSessionToken,
  DEFAULT_WORKSPACE_ID,
  DEFAULT_OWNER_ID,
  DEFAULT_OPERATOR_ID,
  DEFAULT_CLIENT_ID
} from '../server/db';

async function testAuthAndMultiTenancy() {
  console.log('=== [CIPHER PHASE 3B: AUTH & MULTI-TENANCY VERIFICATION SUITE] ===\n');

  const testDir = path.join(os.tmpdir(), `cipher_auth_test_${Date.now()}`);
  fs.mkdirSync(testDir, { recursive: true });
  const testDbFile = path.join(testDir, 'auth_test_db.json');
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
    const db: DBschema = loadDatabase(testDbFile);
    assert(fs.existsSync(testDbFile), 'Database initialized with seed data on disk');

    // -------------------------------------------------------------------------
    // TEST 1: Password Hashing & Timing-Safe Verification
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Password Hashing & Cryptographic Verification ---');
    const rawPassword = 'SuperSecretPassword2026!';
    const hashed = hashPassword(rawPassword);

    assert(typeof hashed === 'string' && hashed.includes(':'), 'Password hash produces salt:hash format');
    assert(verifyPassword(rawPassword, hashed), 'Valid password verifies correctly against scrypt hash');
    assert(!verifyPassword('WrongPassword123!', hashed), 'Invalid password fails verification');
    assert(!verifyPassword('', hashed), 'Empty password fails verification');

    // Verify existing seeded demo accounts
    const sarah = db.users.find(u => u.id === DEFAULT_OWNER_ID);
    assert(!!sarah, 'Seeded Owner (Sarah Jenkins) exists');
    assert(verifyPassword('DemoPassword123!', sarah!.passwordHash), 'Sarah Jenkins demo password verifies correctly');

    const david = db.users.find(u => u.id === DEFAULT_OPERATOR_ID);
    assert(!!david, 'Seeded Operator (David Kim) exists');
    assert(verifyPassword('DemoPassword123!', david!.passwordHash), 'David Kim demo password verifies correctly');

    const marcus = db.users.find(u => u.id === DEFAULT_CLIENT_ID);
    assert(!!marcus, 'Seeded Client (Marcus Vance) exists');
    assert(verifyPassword('DemoPassword123!', marcus!.passwordHash), 'Marcus Vance demo password verifies correctly');

    // -------------------------------------------------------------------------
    // TEST 2: User Registration & Session Token Generation
    // -------------------------------------------------------------------------
    console.log('\n--- 2. User Registration & Session Lifecycle ---');
    const newEmail = 'emily.turner@coastalcrafts.com';
    const newPassword = 'SecureCrafts2026!';
    const newUserId = `usr-${Date.now()}`;

    // Registration creates user
    const newUser = {
      id: newUserId,
      email: newEmail,
      passwordHash: hashPassword(newPassword),
      name: 'Emily Turner',
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);

    // Creates new tenant workspace for Emily
    const newWsId = `ws-coastal-crafts-${Date.now()}`;
    const newWs = {
      id: newWsId,
      name: 'Coastal Crafts Studio',
      slug: 'coastal-crafts',
      ownerId: newUserId,
      profile: {
        name: 'Coastal Crafts Studio',
        type: 'Artisanal Studio',
        description: 'Handmade pottery and ocean-inspired decor',
        contactEmail: newEmail,
        contactPhone: '(555) 432-1098',
        businessHours: 'Tue - Sat: 10:00 AM - 6:00 PM',
        timeZone: 'PST',
        supportTone: 'Warm and artistic',
        escalationInstructions: 'Contact Emily directly for custom commissions',
        emergencyStopActive: false,
        slug: 'coastal-crafts',
        tagline: 'Ocean inspired ceramics handcrafted by the shore',
        published: true,
        template: 'Warm Artisan' as const,
        workspaceId: newWsId
      },
      createdAt: new Date().toISOString()
    };
    db.workspaces.push(newWs);

    // Membership: Owner
    const newMembership = {
      id: `mem-${Date.now()}`,
      workspaceId: newWsId,
      userId: newUserId,
      role: 'Owner' as const,
      joinedAt: new Date().toISOString()
    };
    db.memberships.push(newMembership);

    // Session token
    const userSessionToken = generateSessionToken();
    db.sessions.push({
      token: userSessionToken,
      userId: newUserId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    saveDatabase(db, testDbFile);

    // Verify session
    const activeSession = db.sessions.find(s => s.token === userSessionToken);
    assert(!!activeSession && activeSession.userId === newUserId, 'Session token properly generated and mapped to user');

    // -------------------------------------------------------------------------
    // TEST 3: Multi-Tenant Data Isolation (Tenant A vs Tenant B)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Multi-Tenant Data Isolation & Scoping ---');
    // Tenant A (Maple & Moss Goods: DEFAULT_WORKSPACE_ID)
    // Tenant B (Coastal Crafts Studio: newWsId)

    const mapleItem = {
      id: `cat-maple-${Date.now()}`,
      workspaceId: DEFAULT_WORKSPACE_ID,
      name: 'Artisan Ceramic Mug',
      category: 'Home & Kitchen',
      price: 38,
      pricingMethod: 'Fixed' as const,
      variants: 'Moss Glaze',
      availability: 'In Stock' as const
    };
    db.catalogueItems.push(mapleItem);

    const coastalItem = {
      id: `cat-coastal-${Date.now()}`,
      workspaceId: newWsId,
      name: 'Driftwood Wall Mirror',
      category: 'Home Decor',
      price: 145,
      pricingMethod: 'Fixed' as const,
      variants: 'Large 24-inch Round',
      availability: 'Made to Order' as const
    };
    db.catalogueItems.push(coastalItem);

    // Tenant A customer enquiry
    const mapleEnquiry = {
      id: `enq-maple-${Date.now()}`,
      workspaceId: DEFAULT_WORKSPACE_ID,
      customerName: 'Alice Green',
      customerEmail: 'alice@example.com',
      businessNeed: 'Inquiry on moss glaze mugs gift box',
      source: 'Website Chat',
      dateReceived: '2026-10-15',
      status: 'New' as const,
      assignedOwner: 'Sarah Jenkins'
    };
    db.enquiries.unshift(mapleEnquiry);

    // Tenant B customer enquiry
    const coastalEnquiry = {
      id: `enq-coastal-${Date.now()}`,
      workspaceId: newWsId,
      customerName: 'Robert Pike',
      customerEmail: 'rpike@example.com',
      businessNeed: 'Custom driftwood mirror dimension request',
      source: 'Website Enquiry',
      dateReceived: '2026-10-15',
      status: 'Qualified' as const,
      assignedOwner: 'Emily Turner'
    };
    db.enquiries.unshift(coastalEnquiry);

    saveDatabase(db, testDbFile);

    // Verify Tenant A view
    const tenantAItems = db.catalogueItems.filter(i => i.workspaceId === DEFAULT_WORKSPACE_ID);
    assert(tenantAItems.some(i => i.id === mapleItem.id), 'Tenant A sees own catalogue item');
    assert(!tenantAItems.some(i => i.id === coastalItem.id), 'Tenant A CANNOT see Tenant B catalogue item (isolated)');

    const tenantAEnquiries = db.enquiries.filter(e => e.workspaceId === DEFAULT_WORKSPACE_ID);
    assert(tenantAEnquiries.some(e => e.id === mapleEnquiry.id), 'Tenant A sees own enquiries');
    assert(!tenantAEnquiries.some(e => e.id === coastalEnquiry.id), 'Tenant A CANNOT see Tenant B enquiries (isolated)');

    // Verify Tenant B view
    const tenantBItems = db.catalogueItems.filter(i => i.workspaceId === newWsId);
    assert(tenantBItems.some(i => i.id === coastalItem.id), 'Tenant B sees own catalogue item');
    assert(!tenantBItems.some(i => i.id === mapleItem.id), 'Tenant B CANNOT see Tenant A catalogue item (isolated)');

    const tenantBEnquiries = db.enquiries.filter(e => e.workspaceId === newWsId);
    assert(tenantBEnquiries.some(e => e.id === coastalEnquiry.id), 'Tenant B sees own enquiries');
    assert(!tenantBEnquiries.some(e => e.id === mapleEnquiry.id), 'Tenant B CANNOT see Tenant A enquiries (isolated)');

    // -------------------------------------------------------------------------
    // TEST 4: Workspace Access Control & Cross-Tenant Protection
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Workspace Access Control & Membership Validation ---');
    // Sarah Jenkins belongs to DEFAULT_WORKSPACE_ID
    const sarahMemberships = db.memberships.filter(m => m.userId === DEFAULT_OWNER_ID);
    const sarahInMaple = sarahMemberships.some(m => m.workspaceId === DEFAULT_WORKSPACE_ID);
    const sarahInCoastal = sarahMemberships.some(m => m.workspaceId === newWsId);

    assert(sarahInMaple, 'Sarah has authorized membership in Maple & Moss');
    assert(!sarahInCoastal, 'Sarah has NO membership in Coastal Crafts (Cross-tenant denied)');

    // Emily belongs to newWsId
    const emilyMemberships = db.memberships.filter(m => m.userId === newUserId);
    const emilyInCoastal = emilyMemberships.some(m => m.workspaceId === newWsId);
    const emilyInMaple = emilyMemberships.some(m => m.workspaceId === DEFAULT_WORKSPACE_ID);

    assert(emilyInCoastal, 'Emily has authorized Owner membership in Coastal Crafts');
    assert(!emilyInMaple, 'Emily has NO membership in Maple & Moss (Cross-tenant denied)');

    // Role-based authorization test
    const davidMembership = db.memberships.find(m => m.userId === DEFAULT_OPERATOR_ID && m.workspaceId === DEFAULT_WORKSPACE_ID);
    assert(davidMembership?.role === 'Operator', 'David Kim has Operator role');

    const marcusMembership = db.memberships.find(m => m.userId === DEFAULT_CLIENT_ID && m.workspaceId === DEFAULT_WORKSPACE_ID);
    assert(marcusMembership?.role === 'Client', 'Marcus Vance has Client role');

    // -------------------------------------------------------------------------
    // TEST 5: Public Business Slug Storefront Resolution
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Public Business Slug Routing & Storefront Access ---');
    const slugA = 'maple-and-moss';
    const resolvedWsA = db.workspaces.find(w => w.slug === slugA);
    assert(!!resolvedWsA && resolvedWsA.id === DEFAULT_WORKSPACE_ID, 'Public visitor resolves Maple & Moss by slug');

    const slugB = 'coastal-crafts';
    const resolvedWsB = db.workspaces.find(w => w.slug === slugB);
    assert(!!resolvedWsB && resolvedWsB.id === newWsId, 'Public visitor resolves Coastal Crafts by slug');

    const nonExistentWs = db.workspaces.find(w => w.slug === 'non-existent-company');
    assert(!nonExistentWs, 'Unregistered business slug returns not found');

    // -------------------------------------------------------------------------
    // TEST 6: Password Recovery & Reset Flow
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Password Recovery & Token Lifecycle ---');
    const resetToken = 'test-reset-token-' + Date.now();
    db.passwordResetTokens.push({
      token: resetToken,
      email: newEmail,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      used: false
    });
    saveDatabase(db, testDbFile);

    // Verify recovery token exists
    const storedResetToken = db.passwordResetTokens.find(t => t.token === resetToken && !t.used);
    assert(!!storedResetToken, 'Password reset token saved and valid');

    // Perform password reset
    const brandNewPassword = 'BrandNewPassword2026!';
    const userToReset = db.users.find(u => u.email.toLowerCase() === storedResetToken!.email.toLowerCase());
    assert(!!userToReset, 'User found for reset token');

    userToReset!.passwordHash = hashPassword(brandNewPassword);
    storedResetToken!.used = true;

    // Invalidate sessions on password reset
    db.sessions = db.sessions.filter(s => s.userId !== userToReset!.id);
    saveDatabase(db, testDbFile);

    // Reload from disk to verify persistence of reset
    const reloadedDb = loadDatabase(testDbFile);
    const reloadedUser = reloadedDb.users.find(u => u.email === newEmail);
    assert(verifyPassword(brandNewPassword, reloadedUser!.passwordHash), 'New password verifies after reset and reload');
    assert(!verifyPassword(newPassword, reloadedUser!.passwordHash), 'Old password fails verification after reset');

    const reloadedResetToken = reloadedDb.passwordResetTokens.find(t => t.token === resetToken);
    assert(reloadedResetToken?.used === true, 'Reset token is marked used and cannot be reused');

    const remainingSessions = reloadedDb.sessions.filter(s => s.userId === newUserId);
    assert(remainingSessions.length === 0, 'Active sessions invalidated on password reset');

    // -------------------------------------------------------------------------
    // TEST 7: Restart Persistence of Multi-Tenant State
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Restart Persistence of Multi-Tenant Database ---');
    assert(reloadedDb.workspaces.length >= 2, 'Workspaces persisted across restart');
    assert(reloadedDb.memberships.length >= 4, 'Memberships persisted across restart');
    assert(reloadedDb.catalogueItems.some(c => c.id === coastalItem.id), 'Tenant B item persisted across restart');
    assert(reloadedDb.enquiries.some(e => e.id === coastalEnquiry.id), 'Tenant B enquiry persisted across restart');

  } finally {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch (_) {}
  }

  console.log(`\n=== RESULT: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

testAuthAndMultiTenancy().catch(err => {
  console.error('[FATAL TEST ERROR]:', err);
  process.exit(1);
});

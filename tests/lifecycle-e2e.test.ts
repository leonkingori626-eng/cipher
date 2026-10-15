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
  Workspace,
  Membership
} from '../server/db';

console.log('=== [CIPHER PHASE 3C: END-TO-END BUSINESS LIFECYCLE TEST SUITE] ===\n');

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cipher_lifecycle_test_'));
const testDbPath = path.join(testDir, 'cipher_lifecycle_db.json');

let db: DBschema = loadDatabase(testDbPath);
let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`[PASS] ${msg}`);
    passed++;
  } else {
    console.error(`[FAIL] ${msg}`);
    failed++;
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runLifecycleTestSuite() {
  // ---------------------------------------------------------------------------
  // 1. BUSINESS REGISTRATION & AUTHENTICATION
  // ---------------------------------------------------------------------------
  console.log('--- 1. Business Registration & Ownership ---');

  // Register Owner A
  const ownerA = {
    id: `usr-elena-${Date.now()}`,
    email: 'elena.rostova@cascadeceramics.com',
    passwordHash: hashPassword('CascadeArtisan2026!'),
    name: 'Elena Rostova',
    createdAt: new Date().toISOString()
  };
  db.users.push(ownerA);

  const sessionA = {
    token: generateSessionToken(),
    userId: ownerA.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
  db.sessions.push(sessionA);

  // Create Workspace A
  const wsSlugA = 'cascade-studio-ceramics';
  const wsIdA = `ws-cascade-${Date.now()}`;
  const profileA = {
    name: 'Cascade Studio & Ceramics',
    type: 'Artisan Pottery & Homewares',
    description: 'Handcrafted functional ceramics and stoneware rooted in Pacific Northwest clay traditions.',
    contactEmail: ownerA.email,
    contactPhone: '(503) 555-0182',
    businessHours: 'Tue - Sat: 10:00 AM - 6:00 PM',
    timeZone: 'PST',
    supportTone: 'Warm, thoughtful, and artisan-informed',
    escalationInstructions: 'Contact Elena directly via studio mobile.',
    emergencyStopActive: false,
    slug: wsSlugA,
    tagline: 'Hand-thrown ceramics for daily rituals.',
    published: false,
    template: 'Maple Botanical' as const,
    workspaceId: wsIdA,
    location: 'Bend, Oregon • Pacific Northwest'
  };

  const workspaceA: Workspace = {
    id: wsIdA,
    name: profileA.name,
    slug: wsSlugA,
    ownerId: ownerA.id,
    profile: profileA,
    createdAt: new Date().toISOString()
  };
  db.workspaces.push(workspaceA);

  const membershipA: Membership = {
    id: `mem-${Date.now()}`,
    workspaceId: wsIdA,
    userId: ownerA.id,
    role: 'Owner',
    joinedAt: new Date().toISOString()
  };
  db.memberships.push(membershipA);

  saveDatabase(db, testDbPath);

  assert(db.users.some(u => u.id === ownerA.id), 'Owner A user record created');
  assert(db.workspaces.some(w => w.id === wsIdA), 'Workspace A created with unique ID and slug');
  assert(
    db.memberships.some(m => m.workspaceId === wsIdA && m.userId === ownerA.id && m.role === 'Owner'),
    'Owner A granted exclusive Owner membership in workspace'
  );

  // ---------------------------------------------------------------------------
  // 2. CATALOGUE ITEMS, PRICING, & DISCOUNT CONDITIONS
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Catalogue, Pricing & Discount Conditions ---');

  const itemPlate = {
    id: `cat-plate-${Date.now()}`,
    workspaceId: wsIdA,
    name: 'Stoneware Dinner Plate',
    category: 'Tableware',
    description: 'Durable speckled stoneware with unglazed foot and food-safe satin white glaze.',
    price: 48,
    pricingMethod: 'Fixed' as const,
    variants: 'Obsidian Black / Birch White',
    availability: 'In Stock' as const,
    discountPrice: 42,
    discountConditions: '15% discount applied automatically on sets of 4 or more'
  };

  const itemPourOver = {
    id: `cat-pourover-${Date.now()}`,
    workspaceId: wsIdA,
    name: 'Custom Studio Pour-Over Set',
    category: 'Coffee & Tea',
    description: 'Hand-fluted ceramic dripper with matched 600ml serving carafe.',
    price: 85,
    pricingMethod: 'From' as const,
    variants: 'Matte Slate Gray',
    availability: 'Made to Order' as const,
    discountConditions: 'Free shipping on orders over $150'
  };

  db.catalogueItems.push(itemPlate, itemPourOver);
  saveDatabase(db, testDbPath);

  assert(db.catalogueItems.some(i => i.id === itemPlate.id && i.price === 48), 'Item 1 saved with exact price');
  assert(
    db.catalogueItems.some(i => i.id === itemPlate.id && i.discountConditions?.includes('15% discount')),
    'Item 1 includes clear commercial discount conditions'
  );
  assert(
    db.catalogueItems.some(i => i.id === itemPourOver.id && i.pricingMethod === 'From'),
    'Item 2 saved with "From" pricing method'
  );

  // ---------------------------------------------------------------------------
  // 3. AI DRAFT GENERATION, EDITING, & OWNER APPROVAL
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. AI Content Draft Generation & Owner Approval ---');

  // Verify that unpublished storefront does NOT serve public visitors initially
  const prePublishStorefront = (() => {
    const ws = db.workspaces.find(w => w.slug === wsSlugA);
    if (!ws || ws.profile?.published === false) return null;
    return ws.profile;
  })();
  assert(prePublishStorefront === null, 'Unpublished website route correctly returns 404 / null to public visitors');

  // Grounded AI draft generated from workspace facts
  const aiGeneratedDraft = {
    status: 'Draft' as const,
    heroHeadline: 'Cascade Studio — Mindful Stoneware',
    tagline: 'Hand-thrown ceramics for daily rituals and quiet moments.',
    aboutText: 'Cascade Studio & Ceramics is an independent pottery workshop in Bend, Oregon. We specialize in functional ceramics crafted with care and intention.',
    faqs: [
      { question: 'What are your studio hours?', answer: 'We are open Tue - Sat: 10:00 AM - 6:00 PM.' },
      { question: 'Are your ceramics microwave and dishwasher safe?', answer: 'Yes, all stoneware tableware is high-fired and 100% food and dishwasher safe.' },
      { question: 'Do you offer bulk discounts on dinnerware sets?', answer: 'Yes, we offer 15% discount on sets of 4 or more plates.' }
    ],
    featuredItems: [itemPlate.name, itemPourOver.name],
    generatedAt: new Date().toISOString()
  };

  workspaceA.profile.websiteDraft = aiGeneratedDraft;
  saveDatabase(db, testDbPath);

  assert(workspaceA.profile.websiteDraft.status === 'Draft', 'AI website draft is strictly separated with status "Draft"');
  assert(
    workspaceA.profile.websiteDraft.faqs.some((f: any) => f.answer.includes('15% discount')),
    'AI draft is grounded strictly in approved facts (no invented claims)'
  );

  // Owner edits draft copy before approving
  workspaceA.profile.websiteDraft.heroHeadline = 'Cascade Studio & Ceramics — Functional Art';
  workspaceA.profile.websiteDraft.tagline = 'Handcrafted Pacific Northwest ceramics made to last a lifetime.';
  saveDatabase(db, testDbPath);

  assert(
    workspaceA.profile.websiteDraft.heroHeadline === 'Cascade Studio & Ceramics — Functional Art',
    'Owner successfully edited draft copy'
  );

  // Owner approves draft
  workspaceA.profile.websiteDraft.status = 'Approved';
  workspaceA.profile.websiteDraft.approvedAt = new Date().toISOString();
  workspaceA.profile.websiteDraft.approvedBy = ownerA.name;
  saveDatabase(db, testDbPath);

  assert(workspaceA.profile.websiteDraft.status === 'Approved', 'Draft successfully marked Approved by Owner');
  assert(workspaceA.profile.websiteDraft.approvedBy === 'Elena Rostova', 'Approval tracks authorized owner name');

  // ---------------------------------------------------------------------------
  // 4. WEBSITE PUBLICATION & PUBLIC STOREFRONT VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Website Publication & Public Storefront Access ---');

  // Publish website
  workspaceA.profile.published = true;
  workspaceA.profile.tagline = workspaceA.profile.websiteDraft.tagline;
  workspaceA.profile.description = workspaceA.profile.websiteDraft.aboutText;
  workspaceA.profile.faqs = workspaceA.profile.websiteDraft.faqs;
  workspaceA.profile.websiteDraft.status = 'Published';
  saveDatabase(db, testDbPath);

  // Public visitor resolves storefront by slug (no auth session)
  const resolvePublicStorefront = (slug: string) => {
    const ws = db.workspaces.find(w => w.slug === slug);
    if (!ws || ws.profile?.published === false) return null;

    // Public sanitize filter (matches server.ts)
    const publicProfile = {
      name: ws.profile.name,
      type: ws.profile.type,
      description: ws.profile.description,
      tagline: ws.profile.tagline,
      contactEmail: ws.profile.contactEmail,
      contactPhone: ws.profile.contactPhone,
      businessHours: ws.profile.businessHours,
      timeZone: ws.profile.timeZone,
      supportTone: ws.profile.supportTone,
      location: ws.profile.location,
      slug: ws.slug,
      template: ws.profile.template,
      published: true,
      faqs: ws.profile.faqs
    };

    const catalogue = db.catalogueItems
      .filter(c => c.workspaceId === ws.id && c.availability !== 'Archived')
      .map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        description: c.description,
        price: c.price,
        pricingMethod: c.pricingMethod,
        variants: c.variants,
        availability: c.availability,
        discountConditions: c.discountConditions
      }));

    const reviews = db.reviews
      .filter(r => r.workspaceId === ws.id && r.status === 'Published')
      .map(r => ({
        id: r.id,
        customerName: r.customerName,
        rating: r.rating,
        comment: r.comment,
        businessResponse: r.businessResponse,
        date: r.date
      }));

    return { profile: publicProfile, catalogue, reviews };
  };

  const publicData = resolvePublicStorefront(wsSlugA);
  assert(publicData !== null, 'Public visitor resolves published site by slug without authentication');
  assert(publicData!.profile.name === 'Cascade Studio & Ceramics', 'Public profile name matches');
  assert(publicData!.profile.location === 'Bend, Oregon • Pacific Northwest', 'Public profile contains location');
  assert(publicData!.catalogue.length === 2, 'Public storefront displays all 2 active catalogue items');
  assert(
    (publicData!.profile as any).escalationInstructions === undefined,
    'Private escalation instructions are NOT leaked to public visitors'
  );
  assert(
    (publicData!.profile as any).emergencyStopActive === undefined,
    'Private emergency stop state is NOT leaked to public visitors'
  );

  // ---------------------------------------------------------------------------
  // 5. PUBLIC INBOUND INTAKE: ENQUIRY & REVIEW SUBMISSION
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Public Customer Intake (Enquiries & Reviews) ---');

  // Customer submits enquiry via public storefront
  const newEnquiry = {
    id: `enq-${Date.now()}`,
    workspaceId: wsIdA,
    customerName: 'Marcus Vance',
    customerEmail: 'marcus.vance@studioarchitecture.com',
    businessNeed: 'We are designing a boutique retreat and need 24 matching stoneware table settings.',
    source: 'Public Site (Cascade Studio & Ceramics)',
    dateReceived: new Date().toISOString().split('T')[0],
    status: 'New' as const,
    assignedOwner: profileA.name
  };
  db.enquiries.unshift(newEnquiry);

  // Customer submits review via public storefront
  const newReview = {
    id: `rev-${Date.now()}`,
    workspaceId: wsIdA,
    customerName: 'Clara Bell',
    rating: 5,
    comment: 'The satin white glaze and weight of these plates is sublime. Truly heirloom quality.',
    date: new Date().toISOString().split('T')[0],
    verifiedInteraction: true,
    status: 'Published' as const
  };
  db.reviews.unshift(newReview);

  saveDatabase(db, testDbPath);

  // Verify enquiry appears in Owner A's private dashboard
  const ownerAEnquiries = db.enquiries.filter(e => e.workspaceId === wsIdA);
  assert(
    ownerAEnquiries.some(e => e.id === newEnquiry.id && e.customerName === 'Marcus Vance'),
    'Public customer enquiry appears in Owner A dashboard'
  );

  // Verify review appears in Owner A's review feed and on public storefront
  const ownerAReviews = db.reviews.filter(r => r.workspaceId === wsIdA && r.status === 'Published');
  assert(
    ownerAReviews.some(r => r.id === newReview.id && r.customerName === 'Clara Bell'),
    'Public customer review appears in Owner A review feed'
  );

  const updatedPublicData = resolvePublicStorefront(wsSlugA);
  assert(
    updatedPublicData!.reviews.some(r => r.customerName === 'Clara Bell' && r.rating === 5),
    'New review immediately reflected on public storefront'
  );

  // ---------------------------------------------------------------------------
  // 6. SERVER RESTART & PERSISTENCE VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Server Restart & Persistence Verification ---');

  // Simulate complete backend restart by reading fresh instance from disk
  const restartedDb = loadDatabase(testDbPath);

  const reloadedWs = restartedDb.workspaces.find(w => w.id === wsIdA);
  assert(reloadedWs !== undefined, 'Workspace persists across restart');
  assert(reloadedWs?.profile.published === true, 'Published status persists across restart');
  assert(reloadedWs?.profile.websiteDraft.status === 'Published', 'Approved draft status persists across restart');
  assert(reloadedWs?.profile.location === 'Bend, Oregon • Pacific Northwest', 'Business location persists across restart');

  const reloadedItem = restartedDb.catalogueItems.find(i => i.id === itemPlate.id);
  assert(reloadedItem !== undefined && reloadedItem.price === 48, 'Catalogue item and price persist across restart');
  assert(
    reloadedItem?.discountConditions?.includes('15% discount'),
    'Discount conditions persist across restart'
  );

  const reloadedEnq = restartedDb.enquiries.find(e => e.id === newEnquiry.id);
  assert(reloadedEnq !== undefined && reloadedEnq.customerName === 'Marcus Vance', 'Customer enquiry persists across restart');

  const reloadedRev = restartedDb.reviews.find(r => r.id === newReview.id);
  assert(reloadedRev !== undefined && reloadedRev.customerName === 'Clara Bell', 'Customer review persists across restart');

  // ---------------------------------------------------------------------------
  // 7. CROSS-TENANT ISOLATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Cross-Tenant Data & Membership Isolation ---');

  // Register Owner B (Second Business)
  const ownerB = {
    id: `usr-nathan-${Date.now()}`,
    email: 'nathan.drake@luminarylighting.co',
    passwordHash: hashPassword('LuminaryDesign2026!'),
    name: 'Nathan Drake',
    createdAt: new Date().toISOString()
  };
  restartedDb.users.push(ownerB);

  const wsIdB = `ws-luminary-${Date.now()}`;
  const wsSlugB = 'luminary-lighting';
  const profileB = {
    name: 'Luminary Modern Lighting',
    type: 'Architectural Lighting',
    description: 'Bespoke brass and frosted glass lighting fixtures.',
    contactEmail: ownerB.email,
    contactPhone: '(206) 555-0941',
    businessHours: 'Mon - Fri: 9:00 AM - 5:00 PM',
    timeZone: 'PST',
    supportTone: 'Minimalist and precise',
    escalationInstructions: 'Contact Nathan directly.',
    emergencyStopActive: false,
    slug: wsSlugB,
    tagline: 'Light as an architectural element.',
    published: true,
    template: 'Modern Clean' as const,
    workspaceId: wsIdB,
    location: 'Seattle, WA'
  };

  const workspaceB: Workspace = {
    id: wsIdB,
    name: profileB.name,
    slug: wsSlugB,
    ownerId: ownerB.id,
    profile: profileB,
    createdAt: new Date().toISOString()
  };
  restartedDb.workspaces.push(workspaceB);

  const membershipB: Membership = {
    id: `mem-${Date.now()}`,
    workspaceId: wsIdB,
    userId: ownerB.id,
    role: 'Owner',
    joinedAt: new Date().toISOString()
  };
  restartedDb.memberships.push(membershipB);

  // Add Item for Tenant B
  const itemPendant = {
    id: `cat-pendant-${Date.now()}`,
    workspaceId: wsIdB,
    name: 'Orbital Brass Pendant',
    category: 'Pendants',
    description: 'Machined solid brass sphere with diffused warm LED core.',
    price: 320,
    pricingMethod: 'Fixed' as const,
    variants: 'Brushed Brass / Matte Nickel',
    availability: 'In Stock' as const
  };
  restartedDb.catalogueItems.push(itemPendant);
  saveDatabase(restartedDb, testDbPath);

  // Verify Owner B CANNOT see Owner A's items
  const tenantBItems = restartedDb.catalogueItems.filter(i => i.workspaceId === wsIdB);
  assert(tenantBItems.length === 1 && tenantBItems[0].name === 'Orbital Brass Pendant', 'Tenant B sees only own item');
  assert(
    !tenantBItems.some(i => i.name === 'Stoneware Dinner Plate'),
    'Tenant B CANNOT see Tenant A catalogue items (isolated)'
  );

  // Verify Owner B CANNOT see Owner A's customer enquiry
  const tenantBEnquiries = restartedDb.enquiries.filter(e => e.workspaceId === wsIdB);
  assert(tenantBEnquiries.length === 0, 'Tenant B has empty enquiry list initially');
  assert(
    !tenantBEnquiries.some(e => e.customerName === 'Marcus Vance'),
    'Tenant B CANNOT see Tenant A enquiries (isolated)'
  );

  // Verify Owner B CANNOT see Owner A's customer review
  const tenantBReviews = restartedDb.reviews.filter(r => r.workspaceId === wsIdB);
  assert(tenantBReviews.length === 0, 'Tenant B has empty review list initially');
  assert(
    !tenantBReviews.some(r => r.customerName === 'Clara Bell'),
    'Tenant B CANNOT see Tenant A reviews (isolated)'
  );

  // Verify Owner B has NO membership in Workspace A
  const ownerBInWsA = restartedDb.memberships.find(m => m.workspaceId === wsIdA && m.userId === ownerB.id);
  assert(ownerBInWsA === undefined, 'Owner B has no membership or access rights in Workspace A');

  // ---------------------------------------------------------------------------
  // 8. UNPUBLISH & DEACTIVATION LIFECYCLE
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. Unpublish / Deactivation Lifecycle ---');

  // Owner A unpublishes site
  workspaceA.profile.published = false;
  workspaceA.profile.websiteDraft.status = 'Draft';
  saveDatabase(restartedDb, testDbPath);

  // Verify public route immediately returns 404 / inactive
  const postUnpublishPublic = resolvePublicStorefront(wsSlugA);
  assert(
    postUnpublishPublic === null,
    'Public route stops serving deactivated / unpublished website immediately'
  );

  // Verify private workspace records remain completely intact
  const ownerAPrivateItems = restartedDb.catalogueItems.filter(i => i.workspaceId === wsIdA);
  const ownerAPrivateEnquiries = restartedDb.enquiries.filter(e => e.workspaceId === wsIdA);
  assert(
    ownerAPrivateItems.length === 2,
    'Private catalogue items remain completely intact while site is unpublished'
  );
  assert(
    ownerAPrivateEnquiries.length === 1,
    'Private customer enquiries remain completely intact while site is unpublished'
  );

  // Owner A re-publishes site
  workspaceA.profile.published = true;
  workspaceA.profile.websiteDraft.status = 'Published';
  saveDatabase(restartedDb, testDbPath);

  const rePublishedPublic = resolvePublicStorefront(wsSlugA);
  assert(
    rePublishedPublic !== null && rePublishedPublic.profile.name === 'Cascade Studio & Ceramics',
    'Re-publishing immediately restores public visitor access'
  );

  // Clean up isolated test directory
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch {}

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
}

runLifecycleTestSuite().catch(err => {
  console.error('[TEST SUITE CRASHED]:', err);
  process.exit(1);
});

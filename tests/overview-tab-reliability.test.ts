import assert from 'node:assert';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OverviewTab } from '../src/components/dashboard/OverviewTab';
import { Conversation, CustomerEnquiry, KnowledgeEntry, ApprovalRequest, AssistantConfig } from '../src/types';

console.log('=== [CIPHER: OVERVIEWTAB RELIABILITY & DEFENSIVE RENDERING TEST SUITE] ===');

const mockAssistant: AssistantConfig = {
  name: 'Maple & Moss Guide',
  workspaceName: 'Maple & Moss Goods',
  tone: 'Warm and helpful',
  model: 'gemini-2.5-flash',
  temperature: 0.3,
  maxTokens: 500,
  escalationThreshold: 'Medium',
  enabled: true,
  version: '1.0.0',
  lastTested: 'Yesterday'
};

const populatedConversations: Conversation[] = [
  {
    id: 'conv-101',
    customerName: 'Marcus Vance',
    customerEmail: 'marcus@example.com',
    status: 'Needs human',
    channel: 'Web Chat',
    lastActive: '5m ago',
    assignedOperator: 'Sarah Jenkins',
    messages: [
      { id: 'm1', sender: 'customer', senderName: 'Marcus', text: 'Hello, do you ship to Ireland?', timestamp: '10:15 AM' },
      { id: 'm2', sender: 'assistant', senderName: 'Cipher AI', text: 'Let me connect you with a team member.', timestamp: '10:16 AM' }
    ],
    createdAt: '2026-10-15T10:15:00Z'
  },
  {
    id: 'conv-102',
    customerName: 'Elena Rostova',
    customerEmail: 'elena@example.com',
    status: 'Resolved',
    channel: 'Web Chat',
    lastActive: '1h ago',
    messages: [
      { id: 'm3', sender: 'customer', senderName: 'Elena', text: 'Thank you!', timestamp: '09:00 AM' }
    ],
    createdAt: '2026-10-15T09:00:00Z'
  }
];

const populatedEnquiries: CustomerEnquiry[] = [
  {
    id: 'enq-1',
    customerName: 'Alice Green',
    customerEmail: 'alice@example.com',
    businessNeed: 'Bulk purchase',
    source: 'Website',
    dateReceived: 'Today',
    status: 'New',
    assignedOwner: 'Sarah',
    notes: 'Inquiry about 50 units.'
  }
];

const populatedKnowledge: KnowledgeEntry[] = [
  {
    id: 'kb-1',
    title: 'Shipping Policy',
    content: 'We ship domestically within 3-5 days.',
    category: 'Shipping & Delivery',
    status: 'Approved',
    source: 'Policy document',
    effectiveDate: '2026-10-01',
    updatedAt: '2026-10-01',
    createdAt: '2026-10-01'
  },
  {
    id: 'kb-2',
    title: 'Holiday Returns',
    content: 'Extended returns until Jan 31.',
    category: 'Returns & Refunds',
    status: 'Draft',
    source: 'Holiday update',
    effectiveDate: '2026-10-10',
    updatedAt: '2026-10-10',
    createdAt: '2026-10-10'
  }
];

const populatedApprovals: ApprovalRequest[] = [
  {
    id: 'appr-1',
    action: 'Publish winter items',
    requestor: 'Sarah',
    reason: 'Seasonal release',
    context: 'Catalogue additions',
    riskLevel: 'Low',
    status: 'Pending',
    createdAt: '2026-10-14'
  }
];

// --- 1. Initial rendering before dashboard data loads ---
try {
  const html = renderToString(
    React.createElement(OverviewTab, {
      conversations: undefined as any,
      enquiries: undefined as any,
      knowledge: undefined as any,
      approvals: undefined as any,
      assistant: undefined as any,
      setActiveTab: () => {},
      isLoading: true
    })
  );
  assert.ok(html.includes('Synchronizing workspace operational data'), 'Renders loading banner when isLoading is true');
  assert.ok(/Out of .*0.* active sessions/.test(html), 'Safely handles undefined conversations prop');
  console.log('[PASS] Scenario 1: Initial rendering before dashboard data loads succeeds without throwing');
} catch (err: any) {
  assert.fail(`Scenario 1 failed with error: ${err.message}`);
}

// --- 2. Successful rendering with populated data ---
try {
  const html = renderToString(
    React.createElement(OverviewTab, {
      conversations: populatedConversations,
      enquiries: populatedEnquiries,
      knowledge: populatedKnowledge,
      approvals: populatedApprovals,
      assistant: mockAssistant,
      setActiveTab: () => {}
    })
  );
  assert.ok(html.includes('Marcus Vance'), 'Renders customer name from handoff queue');
  assert.ok(html.includes('Let me connect you with a team member.'), 'Renders last message text from populated conversation');
  assert.ok(/Review Handoff Queue.*1/.test(html), 'Computes needsHumanCount correctly (1 needing human)');
  assert.ok(/Out of .*2.* active sessions/.test(html), 'Computes total active conversations correctly');
  assert.ok(/Maple (&amp;|&) Moss Guide/.test(html), 'Renders assistant name correctly');
  console.log('[PASS] Scenario 2: Successful rendering with populated data verifies output and metrics');
} catch (err: any) {
  assert.fail(`Scenario 2 failed with error: ${err.message}`);
}

// --- 3. Successful rendering with empty collections ---
try {
  const html = renderToString(
    React.createElement(OverviewTab, {
      conversations: [],
      enquiries: [],
      knowledge: [],
      approvals: [],
      assistant: mockAssistant,
      setActiveTab: () => {}
    })
  );
  assert.ok(html.includes('All conversations currently resolved or handled by AI'), 'Renders empty state message for handoff queue');
  assert.ok(/Out of .*0.* active sessions/.test(html), 'Shows 0 active sessions for empty queue');
  assert.ok(/Review Handoff Queue.*0/.test(html), 'Shows 0 handoffs');
  console.log('[PASS] Scenario 3: Successful rendering with empty collections displays clear empty state');
} catch (err: any) {
  assert.fail(`Scenario 3 failed with error: ${err.message}`);
}

// --- 4. Missing or malformed optional API fields (Exact reproduction of previous bug) ---
try {
  // A conversation record as returned by raw SQLite without messages array or with messages: undefined
  const malformedConversations: any[] = [
    {
      id: 'conv-raw-sqlite',
      workspaceId: 'ws-maple-and-moss',
      status: 'Needs human',
      channel: 'Web Chat',
      customerName: undefined,
      messages: undefined, // CRITICAL: This previously crashed with Cannot read properties of undefined (reading 'length')
      createdAt: '2026-10-15T12:00:00Z'
    },
    {
      id: 'conv-null-messages',
      workspaceId: 'ws-maple-and-moss',
      status: 'Needs human',
      channel: 'Direct',
      customerName: 'Anonymous Caller',
      messages: null,
      createdAt: '2026-10-15T12:30:00Z'
    },
    {
      id: 'conv-empty-messages',
      workspaceId: 'ws-maple-and-moss',
      status: 'Needs human',
      channel: 'Web Chat',
      customerName: 'Empty Chat Visitor',
      messages: [],
      createdAt: '2026-10-15T13:00:00Z'
    }
  ];

  const html = renderToString(
    React.createElement(OverviewTab, {
      conversations: malformedConversations,
      enquiries: [],
      knowledge: [],
      approvals: [],
      assistant: undefined as any,
      setActiveTab: () => {}
    })
  );
  assert.ok(html.includes('No recent messages'), 'Provides fallback for missing or empty messages without throwing');
  assert.ok(/Review Handoff Queue.*3/.test(html), 'Correctly aggregates handoff count with malformed records');
  assert.ok(html.includes('Cipher Assistant'), 'Safely falls back on default assistant name when assistant is undefined');
  console.log('[PASS] Scenario 4: Missing and malformed optional API fields safely handled with zero crashes');
} catch (err: any) {
  assert.fail(`Scenario 4 failed with error: ${err.message}`);
}

// --- 5. API failure or required data being unavailable ---
try {
  let retryCalled = false;
  const html = renderToString(
    React.createElement(OverviewTab, {
      conversations: [],
      enquiries: [],
      knowledge: [],
      approvals: [],
      assistant: mockAssistant,
      setActiveTab: () => {},
      loadError: 'Network timeout: upstream API unavailable',
      onRetry: () => { retryCalled = true; }
    })
  );
  assert.ok(html.includes('Unable to load live dashboard data'), 'Displays explicit error header when loadError is present');
  assert.ok(html.includes('Network timeout: upstream API unavailable'), 'Displays error details');
  assert.ok(html.includes('Retry'), 'Renders retry button for user recovery');
  console.log('[PASS] Scenario 5: API failure state renders clear error and recovery action');
} catch (err: any) {
  assert.fail(`Scenario 5 failed with error: ${err.message}`);
}

console.log('=== OVERVIEWTAB RELIABILITY TESTS: ALL 5 SCENARIOS PASSED ===');

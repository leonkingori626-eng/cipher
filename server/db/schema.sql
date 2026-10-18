-- CIPHER PostgreSQL-Compatible Relational Schema (Phase 3E.1)
-- Designed for multi-tenant scalability (1,000+ businesses) with Row Level Security and Domain Isolation.

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Workspaces (Businesses) table
CREATE TABLE IF NOT EXISTS workspaces (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(128) NOT NULL UNIQUE,
    owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);

-- 3. Memberships and RBAC table
CREATE TABLE IF NOT EXISTS memberships (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL CHECK (role IN ('Owner', 'Operator', 'Client')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_workspace_user UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_workspace ON memberships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);

-- 4. Business Domains and Verification records
CREATE TABLE IF NOT EXISTS business_domains (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    hostname VARCHAR(255) NOT NULL UNIQUE, -- Normalized lowercase hostname, e.g. shop.example.com or example.com
    is_custom BOOLEAN DEFAULT FALSE NOT NULL,
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    verification_token VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_business_domains_hostname ON business_domains(hostname);
CREATE INDEX IF NOT EXISTS idx_business_domains_workspace ON business_domains(workspace_id);

-- 5. Catalogue Items, Products, Services & Pricing
CREATE TABLE IF NOT EXISTS catalogue_items (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    pricing_type VARCHAR(32) DEFAULT 'fixed' NOT NULL,
    discount_conditions TEXT,
    category VARCHAR(128),
    status VARCHAR(32) DEFAULT 'Active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_catalogue_workspace ON catalogue_items(workspace_id);

-- 6. Website Drafts, Approved Content & Publication Status
CREATE TABLE IF NOT EXISTS website_content (
    workspace_id VARCHAR(64) PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
    published BOOLEAN DEFAULT FALSE NOT NULL,
    draft_status VARCHAR(32) DEFAULT 'Draft' NOT NULL CHECK (draft_status IN ('Draft', 'Reviewing', 'Approved')),
    draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    approved_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    approved_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. Enquiries
CREATE TABLE IF NOT EXISTS enquiries (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'New' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_enquiries_workspace ON enquiries(workspace_id);

-- 8. Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_workspace ON reviews(workspace_id);

-- 9. AI Knowledge Entries & Assistant Settings
CREATE TABLE IF NOT EXISTS ai_knowledge (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'Approved' NOT NULL CHECK (status IN ('Draft', 'Approved', 'Archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_workspace ON ai_knowledge(workspace_id);

CREATE TABLE IF NOT EXISTS ai_assistant_config (
    workspace_id VARCHAR(64) PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
    model VARCHAR(64) DEFAULT 'gemini-2.5-flash' NOT NULL,
    system_instructions TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.30 NOT NULL,
    emergency_stop BOOLEAN DEFAULT FALSE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 10. Conversations and Messages
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    customer_identifier VARCHAR(255),
    status VARCHAR(32) DEFAULT 'Active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversations_workspace ON conversations(workspace_id);

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    workspace_id VARCHAR(64) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    sender VARCHAR(32) NOT NULL CHECK (sender IN ('customer', 'assistant', 'owner', 'operator')),
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_workspace ON messages(workspace_id);

-- 11. Audit Events
CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(128) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_workspace ON audit_events(workspace_id);

-- 12. Backup & Migration Metadata
CREATE TABLE IF NOT EXISTS migration_metadata (
    migration_id VARCHAR(64) PRIMARY KEY,
    version INT NOT NULL,
    description TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    record_counts JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Row Level Security (RLS) policies example for tenant isolation
-- (Note: Enforced primarily in server-side queries via workspace_id filters, with RLS as defense-in-depth)
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

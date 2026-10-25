import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, decimal, jsonb } from 'drizzle-orm/pg-core';

// Define the 'users' table.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'workspaces' table.
export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  ownerUid: text('owner_uid').notNull(),
  profile: jsonb('profile').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'memberships' table.
export const memberships = pgTable('memberships', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id').notNull(),
  role: text('role').notNull(),
  joinedAt: timestamp('joined_at').defaultNow(),
});

// Define the 'catalogue_items' table.
export const catalogueItems = pgTable('catalogue_items', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 12, scale: 2 }).notNull().default('0.00'),
  pricingType: text('pricing_type').notNull().default('fixed'),
  category: text('category'),
  status: text('status').notNull().default('Active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'enquiries' table.
export const enquiries = pgTable('enquiries', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('New'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'reviews' table.
export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .notNull(),
  customerName: text('customer_name').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relationships for the 'users' table.
export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

// Define relationships for the 'workspaces' table.
export const workspacesRelations = relations(workspaces, ({ many }) => ({
  memberships: many(memberships),
  catalogueItems: many(catalogueItems),
  enquiries: many(enquiries),
  reviews: many(reviews),
}));

// Define relationships for the 'memberships' table.
export const membershipsRelations = relations(memberships, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [memberships.workspaceId],
    references: [workspaces.id],
  }),
}));

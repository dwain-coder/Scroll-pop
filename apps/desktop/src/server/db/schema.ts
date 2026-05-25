import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull().default('Admin'),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('admin'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const sites = sqliteTable('sites', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  domain: text('domain').notNull(),
  name: text('name').notNull(),
  publicKey: text('public_key').notNull().$defaultFn(() => `pk_${crypto.randomUUID().replace(/-/g, '')}`),
  status: text('status').notNull().default('active'),
  verifiedAt: text('verified_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  deletedAt: text('deleted_at'),
});

export const campaigns = sqliteTable('campaigns', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  siteId: text('site_id').notNull().references(() => sites.id),
  name: text('name').notNull(),
  status: text('status').notNull().default('draft'),
  startsAt: text('starts_at'),
  endsAt: text('ends_at'),
  design: text('design', { mode: 'json' }).$type<Record<string, unknown>>(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  deletedAt: text('deleted_at'),
});

export const events = sqliteTable('events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  campaignId: text('campaign_id').notNull(),
  siteId: text('site_id').notNull(),
  eventType: text('event_type').notNull(),
  ts: text('ts').notNull().default(sql`(datetime('now'))`),
  meta: text('meta', { mode: 'json' }).$type<Record<string, unknown>>(),
});

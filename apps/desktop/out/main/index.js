"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const electronUpdater = require("electron-updater");
const Fastify = require("fastify");
const cors = require("@fastify/cors");
const crypto$1 = require("crypto");
const initSqlJs = require("sql.js");
const sqlJs = require("drizzle-orm/sql-js");
const sqliteCore = require("drizzle-orm/sqlite-core");
const drizzleOrm = require("drizzle-orm");
const bcrypt = require("bcryptjs");
const users = sqliteCore.sqliteTable("users", {
  id: sqliteCore.text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: sqliteCore.text("email").notNull().unique(),
  passwordHash: sqliteCore.text("password_hash").notNull(),
  name: sqliteCore.text("name").notNull().default("Admin"),
  avatarUrl: sqliteCore.text("avatar_url"),
  role: sqliteCore.text("role").notNull().default("admin"),
  createdAt: sqliteCore.text("created_at").notNull().default(drizzleOrm.sql`(datetime('now'))`),
  updatedAt: sqliteCore.text("updated_at").notNull().default(drizzleOrm.sql`(datetime('now'))`)
});
const sites = sqliteCore.sqliteTable("sites", {
  id: sqliteCore.text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: sqliteCore.text("user_id").notNull().references(() => users.id),
  domain: sqliteCore.text("domain").notNull(),
  name: sqliteCore.text("name").notNull(),
  publicKey: sqliteCore.text("public_key").notNull().$defaultFn(() => `pk_${crypto.randomUUID().replace(/-/g, "")}`),
  status: sqliteCore.text("status").notNull().default("active"),
  verifiedAt: sqliteCore.text("verified_at"),
  createdAt: sqliteCore.text("created_at").notNull().default(drizzleOrm.sql`(datetime('now'))`),
  updatedAt: sqliteCore.text("updated_at").notNull().default(drizzleOrm.sql`(datetime('now'))`),
  deletedAt: sqliteCore.text("deleted_at")
});
const campaigns = sqliteCore.sqliteTable("campaigns", {
  id: sqliteCore.text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: sqliteCore.text("user_id").notNull().references(() => users.id),
  siteId: sqliteCore.text("site_id").notNull().references(() => sites.id),
  name: sqliteCore.text("name").notNull(),
  status: sqliteCore.text("status").notNull().default("draft"),
  startsAt: sqliteCore.text("starts_at"),
  endsAt: sqliteCore.text("ends_at"),
  design: sqliteCore.text("design", { mode: "json" }).$type(),
  createdAt: sqliteCore.text("created_at").notNull().default(drizzleOrm.sql`(datetime('now'))`),
  updatedAt: sqliteCore.text("updated_at").notNull().default(drizzleOrm.sql`(datetime('now'))`),
  deletedAt: sqliteCore.text("deleted_at")
});
const events = sqliteCore.sqliteTable("events", {
  id: sqliteCore.text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  campaignId: sqliteCore.text("campaign_id").notNull(),
  siteId: sqliteCore.text("site_id").notNull(),
  eventType: sqliteCore.text("event_type").notNull(),
  ts: sqliteCore.text("ts").notNull().default(drizzleOrm.sql`(datetime('now'))`),
  meta: sqliteCore.text("meta", { mode: "json" }).$type()
});
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  campaigns,
  events,
  sites,
  users
}, Symbol.toStringTag, { value: "Module" }));
let _db = null;
let _raw = null;
let _dbPath = "";
async function initDb() {
  if (_db) return _db;
  const userDataPath = electron.app.getPath("userData");
  const dir = path.join(userDataPath, "data");
  fs.mkdirSync(dir, { recursive: true });
  _dbPath = path.join(dir, "scrollpop.db");
  const sqlJsMain = require.resolve("sql.js");
  const sqlJsDist = path.dirname(sqlJsMain);
  const wasmPath = electron.app.isPackaged ? path.join(process.resourcesPath, "sql-wasm.wasm") : path.join(sqlJsDist, "sql-wasm.wasm");
  const SQL = await initSqlJs({ locateFile: () => wasmPath });
  _raw = fs.existsSync(_dbPath) ? new SQL.Database(fs.readFileSync(_dbPath)) : new SQL.Database();
  _db = sqlJs.drizzle(_raw, { schema });
  return _db;
}
function getDb() {
  if (!_db) throw new Error("DB not initialized — call initDb() first");
  return _db;
}
function getRaw() {
  if (!_raw) throw new Error("DB not initialized — call initDb() first");
  return _raw;
}
function persist() {
  if (_raw && _dbPath) {
    fs.writeFileSync(_dbPath, Buffer.from(_raw.export()));
  }
}
async function runMigrations() {
  const db = getRaw();
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT 'Admin',
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      domain TEXT NOT NULL,
      name TEXT NOT NULL,
      public_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      site_id TEXT NOT NULL REFERENCES sites(id),
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      starts_at TEXT,
      ends_at TEXT,
      design TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      site_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      ts TEXT NOT NULL DEFAULT (datetime('now')),
      meta TEXT
    )
  `);
  try {
    db.run(`ALTER TABLE sites ADD COLUMN verified_at TEXT`);
  } catch {
  }
  const result = db.exec(`SELECT COUNT(*) as cnt FROM users`);
  const count = result[0]?.values[0]?.[0] ?? 0;
  if (count === 0) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    const id = crypto.randomUUID();
    db.run(
      `INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`,
      [id, "admin@scrollpop.local", passwordHash, "Admin", "admin"]
    );
    persist();
  }
}
const JWT_SECRET = "scrollpop-desktop-local-secret-key-2025";
function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function signJwt(payload) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1e3), exp: Math.floor(Date.now() / 1e3) + 60 * 60 * 24 * 30 }));
  const { createHmac } = require("crypto");
  const sig = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${header}.${body}.${sig}`;
}
function verifyJwt(token) {
  try {
    const [header, body, sig] = token.split(".");
    const { createHmac } = require("crypto");
    const expected = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64").toString());
    if (payload.exp < Math.floor(Date.now() / 1e3)) return null;
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}
async function signIn(email, password) {
  const db = getDb();
  const [user] = db.select().from(users).where(drizzleOrm.eq(users.email, email)).all();
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  const token = signJwt({ userId: user.id, email: user.email, role: user.role });
  return { token, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, role: user.role } };
}
async function changePassword(userId, currentPassword, newPassword) {
  const db = getDb();
  const [user] = db.select().from(users).where(drizzleOrm.eq(users.id, userId)).all();
  if (!user) return false;
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return false;
  const passwordHash = await bcrypt.hash(newPassword, 10);
  db.update(users).set({ passwordHash, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(drizzleOrm.eq(users.id, userId)).run();
  return true;
}
const PORT = 3010;
async function authGuard(request, reply) {
  const auth = request.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Missing token" } });
  const payload = verifyJwt(auth.slice(7));
  if (!payload) return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Invalid token" } });
  request.userId = payload.userId;
  request.userEmail = payload.email;
}
async function startServer() {
  await initDb();
  await runMigrations();
  const fastify = Fastify({ logger: false });
  await fastify.register(cors, { origin: true, credentials: true });
  fastify.post("/api/v1/auth/sign-in", async (request, reply) => {
    const { email, password } = request.body;
    if (!email || !password) return reply.code(400).send({ error: { code: "VALIDATION", message: "Email and password required" } });
    const result = await signIn(email, password);
    if (!result) return reply.code(401).send({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
    return reply.send({ data: result });
  });
  fastify.post("/api/v1/auth/change-password", { preHandler: authGuard }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body;
    const ok = await changePassword(request.userId, currentPassword, newPassword);
    if (!ok) return reply.code(400).send({ error: { code: "INVALID_PASSWORD", message: "Current password is incorrect" } });
    persist();
    return reply.send({ data: { success: true } });
  });
  fastify.get("/api/v1/auth/me", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const rows = db.select({ id: users.id, email: users.email, name: users.name, avatarUrl: users.avatarUrl, role: users.role }).from(users).where(drizzleOrm.eq(users.id, request.userId)).all();
    if (!rows.length) return reply.code(404).send({ error: { code: "NOT_FOUND", message: "User not found" } });
    return reply.send({ data: rows[0] });
  });
  fastify.patch("/api/v1/auth/profile", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const { name, avatarUrl } = request.body;
    db.update(users).set({ name, avatarUrl, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(drizzleOrm.eq(users.id, request.userId)).run();
    persist();
    const rows = db.select({ id: users.id, email: users.email, name: users.name, avatarUrl: users.avatarUrl, role: users.role }).from(users).where(drizzleOrm.eq(users.id, request.userId)).all();
    return reply.send({ data: rows[0] });
  });
  fastify.get("/api/v1/admin/users", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const allUsers = db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt
    }).from(users).all();
    const enriched = allUsers.map((u) => {
      const siteCount = db.select({ id: sites.id }).from(sites).where(drizzleOrm.and(drizzleOrm.eq(sites.userId, u.id), drizzleOrm.isNull(sites.deletedAt))).all().length;
      const campaignCount = db.select({ id: campaigns.id }).from(campaigns).where(drizzleOrm.and(drizzleOrm.eq(campaigns.userId, u.id), drizzleOrm.isNull(campaigns.deletedAt))).all().length;
      return { ...u, siteCount, campaignCount };
    });
    return reply.send({ data: enriched });
  });
  fastify.get("/api/v1/sites", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const rows = db.select().from(sites).where(drizzleOrm.and(drizzleOrm.eq(sites.userId, request.userId), drizzleOrm.isNull(sites.deletedAt))).all();
    return reply.send({ data: rows, meta: { total: rows.length } });
  });
  fastify.post("/api/v1/sites", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const { domain, name } = request.body;
    const id = crypto$1.randomUUID();
    const publicKey = `pk_${crypto$1.randomUUID().replace(/-/g, "")}`;
    db.insert(sites).values({ id, userId: request.userId, domain, name, publicKey }).run();
    persist();
    const rows = db.select().from(sites).where(drizzleOrm.eq(sites.id, id)).all();
    return reply.code(201).send({ data: rows[0] });
  });
  fastify.patch("/api/v1/sites/:id", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const { id } = request.params;
    const { domain, name, status } = request.body;
    db.update(sites).set({ domain, name, status, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(drizzleOrm.and(drizzleOrm.eq(sites.id, id), drizzleOrm.eq(sites.userId, request.userId))).run();
    persist();
    const rows = db.select().from(sites).where(drizzleOrm.eq(sites.id, id)).all();
    return reply.send({ data: rows[0] });
  });
  fastify.post("/api/v1/sites/:id/verify", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const { id } = request.params;
    db.update(sites).set({ verifiedAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(drizzleOrm.and(drizzleOrm.eq(sites.id, id), drizzleOrm.eq(sites.userId, request.userId))).run();
    persist();
    const rows = db.select().from(sites).where(drizzleOrm.eq(sites.id, id)).all();
    if (!rows.length) return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Site not found" } });
    return reply.send({ data: rows[0] });
  });
  fastify.delete("/api/v1/sites/:id", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const { id } = request.params;
    db.update(sites).set({ deletedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(drizzleOrm.and(drizzleOrm.eq(sites.id, id), drizzleOrm.eq(sites.userId, request.userId))).run();
    persist();
    return reply.code(204).send();
  });
  fastify.get("/api/v1/campaigns", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const rows = db.select().from(campaigns).where(drizzleOrm.and(drizzleOrm.eq(campaigns.userId, request.userId), drizzleOrm.isNull(campaigns.deletedAt))).all();
    return reply.send({ data: rows, meta: { total: rows.length } });
  });
  fastify.post("/api/v1/campaigns", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const { siteId, name, startsAt, endsAt } = request.body;
    const id = crypto$1.randomUUID();
    db.insert(campaigns).values({ id, userId: request.userId, siteId, name, startsAt, endsAt }).run();
    persist();
    const rows = db.select().from(campaigns).where(drizzleOrm.eq(campaigns.id, id)).all();
    return reply.code(201).send({ data: rows[0] });
  });
  fastify.patch("/api/v1/campaigns/:id", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const { id } = request.params;
    const { name, status, startsAt, endsAt } = request.body;
    db.update(campaigns).set({ name, status, startsAt, endsAt, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(drizzleOrm.and(drizzleOrm.eq(campaigns.id, id), drizzleOrm.eq(campaigns.userId, request.userId))).run();
    persist();
    const rows = db.select().from(campaigns).where(drizzleOrm.eq(campaigns.id, id)).all();
    return reply.send({ data: rows[0] });
  });
  const handleActivate = async (request, reply) => {
    const db = getDb();
    const { id } = request.params;
    db.update(campaigns).set({ status: "active", updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(drizzleOrm.and(drizzleOrm.eq(campaigns.id, id), drizzleOrm.eq(campaigns.userId, request.userId))).run();
    persist();
    return reply.send({ data: { status: "active" } });
  };
  fastify.post("/api/v1/campaigns/:id/activate", { preHandler: authGuard }, handleActivate);
  fastify.patch("/api/v1/campaigns/:id/activate", { preHandler: authGuard }, handleActivate);
  const handlePause = async (request, reply) => {
    const db = getDb();
    const { id } = request.params;
    db.update(campaigns).set({ status: "paused", updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(drizzleOrm.and(drizzleOrm.eq(campaigns.id, id), drizzleOrm.eq(campaigns.userId, request.userId))).run();
    persist();
    return reply.send({ data: { status: "paused" } });
  };
  fastify.post("/api/v1/campaigns/:id/pause", { preHandler: authGuard }, handlePause);
  fastify.patch("/api/v1/campaigns/:id/pause", { preHandler: authGuard }, handlePause);
  fastify.delete("/api/v1/campaigns/:id", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const { id } = request.params;
    db.update(campaigns).set({ deletedAt: (/* @__PURE__ */ new Date()).toISOString(), status: "archived" }).where(drizzleOrm.and(drizzleOrm.eq(campaigns.id, id), drizzleOrm.eq(campaigns.userId, request.userId))).run();
    persist();
    return reply.code(204).send();
  });
  fastify.get("/api/v1/campaigns/:id", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const { id } = request.params;
    const rows = db.select().from(campaigns).where(drizzleOrm.and(drizzleOrm.eq(campaigns.id, id), drizzleOrm.eq(campaigns.userId, request.userId))).all();
    if (!rows.length) return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Campaign not found" } });
    return reply.send({ data: rows[0] });
  });
  fastify.get("/api/v1/campaigns/:id/design", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const { id } = request.params;
    const rows = db.select({ design: campaigns.design }).from(campaigns).where(drizzleOrm.and(drizzleOrm.eq(campaigns.id, id), drizzleOrm.eq(campaigns.userId, request.userId))).all();
    if (!rows.length) return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Campaign not found" } });
    return reply.send({ data: rows[0].design ?? {} });
  });
  fastify.put("/api/v1/campaigns/:id/design", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const { id } = request.params;
    const design = request.body;
    db.update(campaigns).set({ design, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(drizzleOrm.and(drizzleOrm.eq(campaigns.id, id), drizzleOrm.eq(campaigns.userId, request.userId))).run();
    persist();
    return reply.send({ data: design });
  });
  fastify.post("/api/v1/campaigns/:id/design", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const { id } = request.params;
    const body = request.body;
    const row = db.select({ design: campaigns.design }).from(campaigns).where(drizzleOrm.and(drizzleOrm.eq(campaigns.id, id), drizzleOrm.eq(campaigns.userId, request.userId))).all()[0];
    if (!row) return reply.code(404).send({ error: "Campaign not found" });
    const design = row.design || {};
    design.config = body.config;
    design.frequency = body.frequency;
    design.affiliateSlots = body.affiliateSlots;
    db.update(campaigns).set({ design, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(drizzleOrm.and(drizzleOrm.eq(campaigns.id, id), drizzleOrm.eq(campaigns.userId, request.userId))).run();
    persist();
    return reply.send({ data: body });
  });
  fastify.post("/api/v1/campaigns/:id/triggers", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const { id } = request.params;
    const body = request.body;
    const row = db.select({ design: campaigns.design }).from(campaigns).where(drizzleOrm.and(drizzleOrm.eq(campaigns.id, id), drizzleOrm.eq(campaigns.userId, request.userId))).all()[0];
    if (!row) return reply.code(404).send({ error: "Campaign not found" });
    const design = row.design || {};
    if (!design.triggers) design.triggers = [];
    design.triggers.push({ id: crypto$1.randomUUID(), type: body.type, params: body.params });
    db.update(campaigns).set({ design, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(drizzleOrm.and(drizzleOrm.eq(campaigns.id, id), drizzleOrm.eq(campaigns.userId, request.userId))).run();
    persist();
    return reply.send({ data: body });
  });
  fastify.post("/api/v1/campaigns/:id/targeting", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const { id } = request.params;
    const body = request.body;
    const row = db.select({ design: campaigns.design }).from(campaigns).where(drizzleOrm.and(drizzleOrm.eq(campaigns.id, id), drizzleOrm.eq(campaigns.userId, request.userId))).all()[0];
    if (!row) return reply.code(404).send({ error: "Campaign not found" });
    const design = row.design || {};
    if (!design.targeting) design.targeting = [];
    design.targeting.push({ id: crypto$1.randomUUID(), kind: body.kind, operator: body.operator, value: body.value });
    db.update(campaigns).set({ design, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }).where(drizzleOrm.and(drizzleOrm.eq(campaigns.id, id), drizzleOrm.eq(campaigns.userId, request.userId))).run();
    persist();
    return reply.send({ data: body });
  });
  fastify.get("/api/v1/analytics/overview", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString();
    const rows = db.select({
      eventType: events.eventType,
      count: drizzleOrm.sql`count(*)`
    }).from(events).innerJoin(campaigns, drizzleOrm.eq(events.campaignId, campaigns.id)).where(drizzleOrm.and(drizzleOrm.eq(campaigns.userId, request.userId), drizzleOrm.gte(events.ts, thirtyDaysAgo))).groupBy(events.eventType).all();
    const map = {};
    for (const r of rows) map[r.eventType] = Number(r.count);
    const impressions = map["impression"] ?? 0;
    const clicks = map["click"] ?? 0;
    return reply.send({ data: { impressions, views: map["view"] ?? 0, clicks, conversions: map["conversion"] ?? 0, ctr: impressions > 0 ? parseFloat((clicks / impressions).toFixed(4)) : 0 } });
  });
  fastify.get("/api/v1/analytics/campaigns", { preHandler: authGuard }, async (request, reply) => {
    const db = getDb();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString();
    const myCampaigns = db.select({ id: campaigns.id }).from(campaigns).where(drizzleOrm.and(drizzleOrm.eq(campaigns.userId, request.userId), drizzleOrm.isNull(campaigns.deletedAt))).all();
    const result = myCampaigns.map(({ id: campaignId }) => {
      const rows = db.select({ eventType: events.eventType, count: drizzleOrm.sql`count(*)` }).from(events).where(drizzleOrm.and(drizzleOrm.eq(events.campaignId, campaignId), drizzleOrm.gte(events.ts, thirtyDaysAgo))).groupBy(events.eventType).all();
      const map = {};
      for (const r of rows) map[r.eventType] = Number(r.count);
      const impressions = map["impression"] ?? 0;
      const clicks = map["click"] ?? 0;
      return { campaignId, impressions, views: map["view"] ?? 0, clicks, conversions: map["conversion"] ?? 0, ctr: impressions > 0 ? parseFloat((clicks / impressions).toFixed(4)) : 0 };
    });
    return reply.send({ data: result });
  });
  fastify.post("/e", async (request, reply) => {
    const db = getDb();
    const { campaignId, siteId, eventType, meta } = request.body;
    if (!campaignId || !siteId || !eventType) return reply.code(400).send({ error: "Missing required fields" });
    db.insert(events).values({ id: crypto$1.randomUUID(), campaignId, siteId, eventType, meta }).run();
    persist();
    return reply.code(204).send();
  });
  fastify.get("/v1/:publicKey/p.js", async (request, reply) => {
    const devPath = path.join(__dirname, "../../../../packages/snippet/dist/p.js");
    const prodPath = typeof process !== "undefined" && process.resourcesPath ? path.join(process.resourcesPath, "snippet", "p.js") : "";
    const pJsPath = fs.existsSync(prodPath) ? prodPath : fs.existsSync(devPath) ? devPath : null;
    if (!pJsPath) return reply.code(404).send("p.js not found");
    const content = fs.readFileSync(pJsPath, "utf-8");
    reply.header("Content-Type", "application/javascript");
    return reply.send(content);
  });
  fastify.get("/c/:publicKey", async (request, reply) => {
    const db = getDb();
    const { publicKey } = request.params;
    const siteRows = db.select().from(sites).where(drizzleOrm.and(drizzleOrm.eq(sites.publicKey, publicKey), drizzleOrm.isNull(sites.deletedAt))).all();
    if (!siteRows.length) return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Site not found" } });
    const site = siteRows[0];
    const activeCampaigns = db.select().from(campaigns).where(drizzleOrm.and(drizzleOrm.eq(campaigns.siteId, site.id), drizzleOrm.eq(campaigns.status, "active"), drizzleOrm.isNull(campaigns.deletedAt))).all();
    const validCampaigns = activeCampaigns.map((c) => {
      const design = c.design;
      if (!design) return null;
      return {
        id: c.id,
        design: design.config,
        triggers: design.triggers || [],
        targeting: design.targeting || [],
        frequency: { frequency: design.frequency || "once_per_session" },
        affiliateSlots: design.affiliateSlots || []
      };
    }).filter(Boolean);
    const version = crypto$1.createHash("sha256").update(JSON.stringify(validCampaigns)).digest("hex").slice(0, 8);
    const payload = { siteId: site.id, campaigns: validCampaigns, version };
    return reply.send(payload);
  });
  await fastify.listen({ port: PORT, host: "127.0.0.1" });
  return fastify;
}
let mainWindow = null;
function getDashboardPath() {
  const packedPath = path.join(process.resourcesPath, "dashboard", "index.html");
  if (fs.existsSync(packedPath)) return packedPath;
  const devPath = path.join(__dirname, "../../../dashboard/dist/index.html");
  if (fs.existsSync(devPath)) return devPath;
  return path.join(__dirname, "../renderer/index.html");
}
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#020308",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
      // needed to load file:// assets from extraResources
    },
    show: false
  });
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    electron.shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.loadFile(getDashboardPath());
}
async function bootstrap() {
  await electron.app.whenReady();
  try {
    await startServer();
    console.log("[desktop] Local server started on port 3010");
  } catch (err) {
    console.error("[desktop] Failed to start local server:", err);
  }
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  if (electron.app.isPackaged) {
    electronUpdater.autoUpdater.checkForUpdatesAndNotify();
    electronUpdater.autoUpdater.on("update-available", (info) => mainWindow?.webContents.send("update-available", info));
    electronUpdater.autoUpdater.on("update-downloaded", (info) => mainWindow?.webContents.send("update-downloaded", info));
  }
}
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
electron.ipcMain.handle("app:version", () => electron.app.getVersion());
electron.ipcMain.handle("updater:check", () => electronUpdater.autoUpdater.checkForUpdatesAndNotify());
electron.ipcMain.handle("updater:install", () => electronUpdater.autoUpdater.quitAndInstall());
bootstrap().catch(console.error);

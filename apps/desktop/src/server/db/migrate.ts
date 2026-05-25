import { getRaw, persist } from './client';
import bcrypt from 'bcryptjs';

export async function runMigrations() {
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

  // Add verified_at column if missing (idempotent for existing DBs)
  try { db.run(`ALTER TABLE sites ADD COLUMN verified_at TEXT`); } catch {}

  // Seed default admin if none exists
  const result = db.exec(`SELECT COUNT(*) as cnt FROM users`);
  const count = result[0]?.values[0]?.[0] as number ?? 0;
  if (count === 0) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const id = crypto.randomUUID();
    db.run(
      `INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`,
      [id, 'admin@scrollpop.local', passwordHash, 'Admin', 'admin']
    );
    persist();
  }
}

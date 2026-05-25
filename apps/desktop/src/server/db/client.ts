import initSqlJs from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import { app } from 'electron';
import { join, dirname } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import * as schema from './schema';

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | null = null;
let _raw: import('sql.js').Database | null = null;
let _dbPath = '';

export async function initDb(): Promise<DrizzleDb> {
  if (_db) return _db;

  const userDataPath = app.getPath('userData');
  const dir = join(userDataPath, 'data');
  mkdirSync(dir, { recursive: true });
  _dbPath = join(dir, 'scrollpop.db');

  // Use Node module resolution to find sql.js regardless of pnpm hoisting
  const sqlJsMain = require.resolve('sql.js');
  const sqlJsDist = dirname(sqlJsMain);
  const wasmPath = app.isPackaged
    ? join(process.resourcesPath, 'sql-wasm.wasm')
    : join(sqlJsDist, 'sql-wasm.wasm');

  const SQL = await initSqlJs({ locateFile: () => wasmPath });

  _raw = existsSync(_dbPath)
    ? new SQL.Database(readFileSync(_dbPath))
    : new SQL.Database();

  _db = drizzle(_raw, { schema });
  return _db;
}

export function getDb(): DrizzleDb {
  if (!_db) throw new Error('DB not initialized — call initDb() first');
  return _db;
}

export function getRaw(): import('sql.js').Database {
  if (!_raw) throw new Error('DB not initialized — call initDb() first');
  return _raw;
}

export function persist(): void {
  if (_raw && _dbPath) {
    writeFileSync(_dbPath, Buffer.from(_raw.export()));
  }
}

import bcrypt from 'bcryptjs';
import { getDb } from './db/client';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = 'scrollpop-desktop-local-secret-key-2025';

// Simple JWT implementation without external library overhead
function base64url(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function signJwt(payload: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 }));
  const { createHmac } = require('crypto');
  const sig = createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${header}.${body}.${sig}`;
}

export function verifyJwt(token: string): { userId: string; email: string } | null {
  try {
    const [header, body, sig] = token.split('.');
    const { createHmac } = require('crypto');
    const expected = createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

export async function signIn(email: string, password: string) {
  const db = getDb();
  const [user] = db.select().from(users).where(eq(users.email, email)).all();
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  const token = signJwt({ userId: user.id, email: user.email, role: user.role });
  return { token, user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, role: user.role } };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const db = getDb();
  const [user] = db.select().from(users).where(eq(users.id, userId)).all();
  if (!user) return false;
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return false;
  const passwordHash = await bcrypt.hash(newPassword, 10);
  db.update(users).set({ passwordHash, updatedAt: new Date().toISOString() }).where(eq(users.id, userId)).run();
  return true;
}

import { createHmac, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export const COOKIE_NAME = 'mgmt_session';

function secret(): string {
  const s = import.meta.env.SESSION_SECRET ?? process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET not set');
  return s;
}

export function createSession(userId: number): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}:${expires}`;
  const sig = createHmac('sha256', secret()).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

export function verifySession(token: string): number | null {
  const parts = token.split(':');
  if (parts.length !== 3) return null;
  const [userIdStr, expiresStr, sig] = parts;
  const payload = `${userIdStr}:${expiresStr}`;
  const expected = createHmac('sha256', secret()).update(payload).digest('hex');
  try {
    const sigBuf = Buffer.from(sig, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
  } catch {
    return null;
  }
  if (Date.now() > parseInt(expiresStr)) return null;
  const userId = parseInt(userIdStr);
  return isNaN(userId) ? null : userId;
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

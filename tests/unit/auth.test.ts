import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';

// Set environment variable before importing auth
process.env.SESSION_SECRET = 'test-secret-1234567890abcdef1234567890ab';

import { createSession, verifySession } from '../../src/lib/auth';

describe('createSession / verifySession', () => {
  it('round-trip returns the original userId', () => {
    const token = createSession(42);
    expect(verifySession(token)).toBe(42);
  });

  it('returns null for a tampered signature', () => {
    const token = createSession(1);
    const parts = token.split(':');
    parts[2] = parts[2].replace(/a/g, 'b'); // tamper sig
    expect(verifySession(parts.join(':'))).toBeNull();
  });

  it('returns null for an expired token', () => {
    const userId = 7;
    const expires = Date.now() - 1;
    const payload = `${userId}:${expires}`;
    const sig = createHmac('sha256', 'test-secret-1234567890abcdef1234567890ab')
      .update(payload).digest('hex');
    const expired = `${payload}:${sig}`;
    expect(verifySession(expired)).toBeNull();
  });

  it('returns null for a malformed token', () => {
    expect(verifySession('not-a-valid-token')).toBeNull();
    expect(verifySession('')).toBeNull();
    expect(verifySession('a:b')).toBeNull();
  });
});

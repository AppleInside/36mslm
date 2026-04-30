import { describe, it, expect } from 'vitest';
import { eventSignupSchema } from '../../src/server/validation/event-signup';

describe('eventSignupSchema', () => {
  const valid = {
    eventSlug: '2026-05-10-camminata-golena',
    name: 'Mario Rossi',
    email: 'mario@example.com',
    partySize: 2,
    sourceLang: 'it',
  };

  it('accepts a minimal valid payload', () => {
    const r = eventSignupSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it('rejects missing name', () => {
    const r = eventSignupSchema.safeParse({ ...valid, name: '' });
    expect(r.success).toBe(false);
  });

  it('rejects bad email', () => {
    const r = eventSignupSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(r.success).toBe(false);
  });

  it('rejects partySize < 1', () => {
    const r = eventSignupSchema.safeParse({ ...valid, partySize: 0 });
    expect(r.success).toBe(false);
  });

  it('rejects unknown sourceLang', () => {
    const r = eventSignupSchema.safeParse({ ...valid, sourceLang: 'fr' });
    expect(r.success).toBe(false);
  });

  it('coerces string partySize from form input', () => {
    const r = eventSignupSchema.safeParse({ ...valid, partySize: '3' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.partySize).toBe(3);
  });
});

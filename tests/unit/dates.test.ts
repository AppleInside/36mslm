import { describe, it, expect } from 'vitest';
import { formatEventDate } from '../../src/lib/dates';

describe('formatEventDate', () => {
  it('formats italian date', () => {
    const out = formatEventDate(new Date('2026-05-10T06:30:00+02:00'), 'it');
    expect(out).toMatch(/10 maggio 2026/);
  });
  it('formats english date', () => {
    const out = formatEventDate(new Date('2026-05-10T06:30:00+02:00'), 'en');
    expect(out).toMatch(/May 10, 2026/);
  });
});

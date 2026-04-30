import { describe, it, expect } from 'vitest';
import { byLang, sortByDateAsc, sortByDateDesc, splitFutureFromPast } from '../../src/lib/content';

type E = { slug: string; data: { date: Date; draft?: boolean } };

const items: E[] = [
  { slug: 'it/a', data: { date: new Date('2026-01-01') } },
  { slug: 'en/b', data: { date: new Date('2026-02-01') } },
  { slug: 'it/c', data: { date: new Date('2026-03-01'), draft: true } },
  { slug: 'it/d', data: { date: new Date('2026-04-01') } },
];

describe('content helpers', () => {
  it('byLang filters by slug prefix and drops drafts', () => {
    const out = byLang(items, 'it');
    expect(out.map((e) => e.slug)).toEqual(['it/a', 'it/d']);
  });

  it('sortByDateAsc sorts ascending', () => {
    const out = sortByDateAsc([items[3], items[0]]);
    expect(out[0].slug).toBe('it/a');
  });

  it('sortByDateDesc sorts descending', () => {
    const out = sortByDateDesc([items[0], items[3]]);
    expect(out[0].slug).toBe('it/d');
  });

  it('splitFutureFromPast partitions on a reference date', () => {
    const ref = new Date('2026-02-15');
    const { future, past } = splitFutureFromPast(byLang(items, 'it'), ref);
    expect(future.map((e) => e.slug)).toEqual(['it/d']);
    expect(past.map((e) => e.slug)).toEqual(['it/a']);
  });
});

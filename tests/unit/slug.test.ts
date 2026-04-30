import { describe, it, expect } from 'vitest';
import { slugify } from '../../src/lib/slug';

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Camminata in Golena')).toBe('camminata-in-golena');
  });
  it('strips italian accents', () => {
    expect(slugify('Città è perché')).toBe('citta-e-perche');
  });
  it('removes punctuation', () => {
    expect(slugify('Risotto, è pronto!')).toBe('risotto-e-pronto');
  });
  it('collapses repeated hyphens', () => {
    expect(slugify('a -- b')).toBe('a-b');
  });
});

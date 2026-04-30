import { describe, it, expect } from 'vitest';
import { getLangFromUrl, useTranslations } from '../../src/i18n/utils';

describe('i18n', () => {
  it('extracts lang from URL path', () => {
    expect(getLangFromUrl(new URL('https://x/it/eventi'))).toBe('it');
    expect(getLangFromUrl(new URL('https://x/en/events'))).toBe('en');
    expect(getLangFromUrl(new URL('https://x/'))).toBe('it');
  });
  it('translates known keys', () => {
    const t = useTranslations('it');
    expect(t('nav.events')).toBe('Eventi');
    const tEn = useTranslations('en');
    expect(tEn('nav.events')).toBe('Events');
  });
  it('falls back to italian when key missing in en', () => {
    const t = useTranslations('en');
    expect(t('footer.press')).toBeTruthy();
  });
});

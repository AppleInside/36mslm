import type { Lang } from '../i18n/ui';
const LOCALES: Record<Lang, string> = { it: 'it-IT', en: 'en-US' };

export function formatEventDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALES[lang], {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(date);
}
export function formatTime(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { hour: '2-digit', minute: '2-digit' }).format(date);
}

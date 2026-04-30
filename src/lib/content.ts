import type { Lang } from '../i18n/ui';

type WithDate = { slug: string; data: { date: Date; draft?: boolean } };

export function byLang<T extends WithDate>(items: T[], lang: Lang): T[] {
  return items.filter((e) => e.slug.startsWith(`${lang}/`) && !e.data.draft);
}

export function sortByDateAsc<T extends WithDate>(items: T[]): T[] {
  return [...items].sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
}

export function sortByDateDesc<T extends WithDate>(items: T[]): T[] {
  return [...items].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function splitFutureFromPast<T extends WithDate>(items: T[], now: Date): { future: T[]; past: T[] } {
  const future: T[] = [];
  const past: T[] = [];
  for (const e of items) {
    if (e.data.date.getTime() >= now.getTime()) future.push(e);
    else past.push(e);
  }
  return { future: sortByDateAsc(future), past: sortByDateDesc(past) };
}

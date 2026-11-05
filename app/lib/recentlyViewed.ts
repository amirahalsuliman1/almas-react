/**
 * «شاهدته مؤخراً» — the products this visitor opened, newest first, kept in
 * their own browser only (Twig's `partials/recently-viewed.js`, same key, so a
 * visitor's list survives the move to React). Nothing is sent anywhere; a
 * browser that refuses storage simply has no history.
 */
export const STORAGE_KEY = 'am1als:recently-viewed';
export const MAX_STORED = 20;

export function readRecentlyViewed(): string[] {
  try {
    const ids = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(ids) ? ids.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(id: unknown): void {
  if (id == null || id === '') return;
  const key = String(id);
  const ids = [key, ...readRecentlyViewed().filter((stored) => stored !== key)].slice(0, MAX_STORED);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable: the visitor simply has no history.
  }
}

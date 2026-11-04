/**
 * Helpers for the highlights row (home.highlights): which highlights a visitor
 * has opened. The pickers' shapes are in `pickers.ts`.
 */

const SEEN_KEY = 'am1als:highlights-seen';

/** A stable id for a highlight, from its slides, so a changed highlight shows as new. */
export function highlightId(slides: string[]): string {
  let h = 5381;
  const text = slides.join('|');
  for (let i = 0; i < text.length; i += 1) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function readSeen(): string[] {
  try {
    const list = JSON.parse(window.localStorage.getItem(SEEN_KEY) || '[]');
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Remembers the last 100 opened highlights. */
export function markSeen(id: string): void {
  const list = [id, ...readSeen().filter((seen) => seen !== id)].slice(0, 100);
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(list));
  } catch {
    // Private mode: the ring stays unseen; nothing else depends on it.
  }
}

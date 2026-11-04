/**
 * The visitor's own colour choice, when the merchant enables the toggle
 * (`dark_mode_toggle`). Kept in this browser and wins over `color_mode`.
 */
export type VisitorMode = 'dark' | 'light' | null;

export const VISITOR_MODE_KEY = 'am1als:color-mode';

const listeners = new Set<() => void>();
let current: VisitorMode | undefined;

function read(): VisitorMode {
  try {
    const value = window.localStorage.getItem(VISITOR_MODE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

export function getVisitorMode(): VisitorMode {
  if (current === undefined) current = read();
  return current;
}

export function setVisitorMode(mode: Exclude<VisitorMode, null>): void {
  current = mode;
  try {
    window.localStorage.setItem(VISITOR_MODE_KEY, mode);
  } catch {
    // Private mode or full storage: the choice holds for this page view.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeVisitorMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Test helper: forget the cached value. */
export function resetVisitorModeCache(): void {
  current = undefined;
}

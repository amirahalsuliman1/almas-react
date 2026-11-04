/**
 * Readers for raw theme settings. A dropdown can arrive as a string or as
 * `[{ value }]`; numbers and URLs arrive from merchant input and are checked
 * before they reach CSS.
 */

/** The selected value of a dropdown setting, or `fallback`. */
export function selectedValue<T extends string>(
  raw: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  const first = Array.isArray(raw) ? raw[0] : raw;
  const value =
    typeof first === 'string' ? first : (first as { value?: unknown } | undefined)?.value;
  return (allowed as readonly unknown[]).includes(value) ? (value as T) : fallback;
}

/** A whole number within `[min, max]`, or `fallback`. */
export function clampedInteger(raw: unknown, min: number, max: number, fallback: number): number {
  const n = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw;
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

const SAFE_URL = /^https?:\/\/[^\s"'()\\<>]+$/i;

/** An http(s) URL safe to put inside `url("…")`, or null. */
export function safeImageUrl(raw: unknown): string | null {
  return typeof raw === 'string' && SAFE_URL.test(raw.trim()) ? raw.trim() : null;
}

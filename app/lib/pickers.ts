/**
 * The shapes twilight.json pickers send, read the same way everywhere.
 */

/** The product picker sends a list even for one choice, of products or of ids. */
export function pickedProductId(raw: unknown): string | null {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (first == null || first === '') return null;
  if (typeof first === 'number' || typeof first === 'string') return String(first);
  const id = (first as { id?: unknown; value?: unknown }).id ?? (first as { value?: unknown }).value;
  return id == null || id === '' ? null : String(id);
}

/** A variable-list link arrives as a URL string or as `{ url }` / `{ value }`. */
export function pickedUrl(raw: unknown): string | null {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (typeof first === 'string') return first.trim() || null;
  if (first && typeof first === 'object') {
    const value = (first as { url?: unknown; value?: unknown }).url ?? (first as { value?: unknown }).value;
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
  return null;
}

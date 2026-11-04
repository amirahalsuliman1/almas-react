/**
 * The merchant's accent colour (`accent_color` setting), checked before it
 * reaches CSS, and the text colour that reads on it.
 */

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** A `#rgb` or `#rrggbb` value in lower-case six-digit form, or null. */
export function normaliseHex(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!HEX.test(trimmed)) return null;
  const hex = trimmed.slice(1).toLowerCase();
  return `#${hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex}`;
}

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG contrast ratio between two six-digit hex colours. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE = '#ffffff';
const INK = '#1b1b1b';

/** White or the page ink, whichever reads better on `accent`. */
export function inkOn(accent: string): string {
  return contrastRatio(accent, WHITE) >= contrastRatio(accent, INK) ? WHITE : INK;
}

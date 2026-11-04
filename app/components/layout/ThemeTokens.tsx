import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { inkOn, normaliseHex } from '../../lib/accent';

/**
 * Writes the merchant's `accent_color` over the accent tokens in
 * `01-settings/global.scss`. Unset or invalid, nothing is written and the
 * accent stays the store's primary colour. Rendered on the server, so the first
 * paint already carries the merchant's colour.
 */
export function ThemeTokens() {
  const { theme } = useTwilight();
  const accent = normaliseHex(theme?.settings?.accent_color);
  if (!accent) return null;

  return (
    <style data-theme-tokens>
      {`:root{--color-accent:${accent};--color-accent-ink:${inkOn(accent)}}`}
    </style>
  );
}

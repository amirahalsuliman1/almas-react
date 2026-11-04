import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { inkOn, normaliseHex } from '../../lib/accent';
import { beforePaintScript, COLOR_MODES, DARK_SELECTOR } from '../../lib/colorMode';
import { useColorMode } from '../../hooks/useColorMode';
import { clampedInteger, safeImageUrl, selectedValue } from '../../lib/settings';

/** Colour settings and the token each one fills, in light mode. */
const LIGHT_COLORS: Record<string, string[]> = {
  secondary_color: ['--color-brand-secondary'],
  color_page_background: ['--surface-page'],
  color_text_primary: ['--main-text-color'],
  color_header_background: ['--surface-header'],
  color_header_text: ['--text-header'],
  color_footer_background: ['--surface-footer'],
  color_footer_text: ['--text-footer'],
  color_icons: ['--color-icon'],
  announcement_bg: ['--announcement-bg'],
  announcement_text_color: ['--announcement-text'],
};

/** The same, in dark mode. */
const DARK_COLORS: Record<string, string[]> = {
  dark_color_page: ['--surface-page'],
  dark_color_section: ['--surface-section', '--surface-header', '--surface-footer'],
  dark_color_card: ['--surface-card'],
  dark_color_text: ['--main-text-color', '--text-header', '--text-footer'],
};

const BUTTON_RADIUS = { rounded: '0.75rem', pill: '9999px', square: '0' } as const;
const BUTTON_STYLES = ['rounded', 'pill', 'square'] as const;

function colorDeclarations(settings: Record<string, unknown>, map: Record<string, string[]>) {
  const out: string[] = [];
  for (const [id, tokens] of Object.entries(map)) {
    const hex = normaliseHex(settings[id]);
    if (hex) for (const token of tokens) out.push(`${token}:${hex}`);
  }
  return out;
}

/**
 * Turns the theme-wide settings into CSS custom properties and keeps the
 * colour mode on `<html>`. Rendered on the server, so the first paint carries the merchant's
 * values. Only values that pass a format check are written.
 */
export function ThemeTokens() {
  const { theme } = useTwilight();
  const settings = (theme?.settings ?? {}) as Record<string, unknown>;
  const mode = selectedValue(settings.color_mode, COLOR_MODES, 'store');

  const storeIsDark = theme?.color?.is_dark === true;
  const visitorToggle = settings.dark_mode_toggle === true;
  useColorMode(mode, storeIsDark, visitorToggle);

  const light = colorDeclarations(settings, LIGHT_COLORS);
  const accent = normaliseHex(settings.accent_color);
  if (accent) light.push(`--color-accent:${accent}`, `--color-accent-ink:${inkOn(accent)}`);
  light.push(`--page-gutter:${clampedInteger(settings.page_gutter, 0, 48, 16)}px`);
  light.push(`--logo-height:${clampedInteger(settings.header_logo_height, 24, 80, 44)}px`);
  light.push(
    `--button-radius:${BUTTON_RADIUS[selectedValue(settings.button_style, BUTTON_STYLES, 'rounded')]}`
  );
  const bg = safeImageUrl(settings.store_background_image);
  if (bg) light.push(`--store-bg-image:url("${bg}")`);

  const dark = colorDeclarations(settings, DARK_COLORS);
  const darkBg = safeImageUrl(settings.dark_background_image);
  if (darkBg) dark.push(`--store-bg-image:url("${darkBg}")`);

  const script = beforePaintScript(mode, storeIsDark, visitorToggle);
  const css = `:root{${light.join(';')}}${dark.length ? `${DARK_SELECTOR}{${dark.join(';')}}` : ''}`;

  return (
    <>
      <style data-theme-tokens>{css}</style>
      {script && <script dangerouslySetInnerHTML={{ __html: script }} />}
    </>
  );
}

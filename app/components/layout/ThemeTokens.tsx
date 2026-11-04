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

/** Where each gradient switch applies, as selectors. */
const GRADIENT_TARGETS: Record<string, string> = {
  gradient_on_bars: '.announcement-bar,.marquee',
  gradient_on_buttons:
    '.s-product-card .s-product-card-content-footer .s-button-btn,.hero__cta,.highlights__shop',
  gradient_on_quantity: '.s-quantity-input-button',
};

/**
 * The merchant's two-colour gradient, painted where they switched it on. It
 * runs from the first colour at the right to the second at the left, as the
 * settings' labels say. Both colours must be valid, or nothing is written.
 */
export function gradientRules(settings: Record<string, unknown>): string {
  const start = normaliseHex(settings.gradient_color_start);
  const end = normaliseHex(settings.gradient_color_end);
  if (!start || !end) return '';
  const selectors = Object.entries(GRADIENT_TARGETS)
    .filter(([id]) => settings[id] === true)
    .map(([, sel]) => sel);
  if (!selectors.length) return '';
  return `${selectors.join(',')}{background-image:linear-gradient(to left,${start},${end});border-color:transparent}`;
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
    `--footer-logo-height:${clampedInteger(settings.footer_logo_height, 24, 80, 40)}px`
  );
  light.push(
    `--button-radius:${BUTTON_RADIUS[selectedValue(settings.button_style, BUTTON_STYLES, 'rounded')]}`
  );
  const bg = safeImageUrl(settings.store_background_image);
  if (bg) light.push(`--store-bg-image:url("${bg}")`);

  const dark = colorDeclarations(settings, DARK_COLORS);
  const darkBg = safeImageUrl(settings.dark_background_image);
  if (darkBg) dark.push(`--store-bg-image:url("${darkBg}")`);

  const script = beforePaintScript(mode, storeIsDark, visitorToggle);
  const css = `:root{${light.join(';')}}${dark.length ? `${DARK_SELECTOR}{${dark.join(';')}}` : ''}${gradientRules(settings)}`;

  return (
    <>
      <style data-theme-tokens>{css}</style>
      {script && <script dangerouslySetInnerHTML={{ __html: script }} />}
    </>
  );
}

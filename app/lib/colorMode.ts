/**
 * The theme's colour mode (`color_mode` setting).
 *
 * - `store`: follow the store's own dark flag (`theme.color.is_dark`).
 * - `light` / `dark`: fixed for every visitor, whatever the store flag says.
 * - `auto`: follow each visitor's device.
 *
 * One switch carries the result: the `dark` class on `<html>`. The token layer
 * (`01-settings/global.scss`) and Tailwind's `dark:` read nothing else, so the
 * engine's own `body.color-mode-dark` does not decide the theme's colours.
 */
export const COLOR_MODES = ['store', 'light', 'dark', 'auto'] as const;

/**
 * Dark mode is switched off for now (owner, 2026-11-05): the theme is light for
 * every visitor whatever the setting, the store flag or the device say, the
 * visitor toggle is not drawn, and the dark settings are out of the editor.
 * The code stays, so turning it back on is this flag plus the settings.
 */
export const DARK_MODE_ENABLED = false;
export type ColorMode = (typeof COLOR_MODES)[number];

export const DARK_CLASS = 'dark';
export const DARK_SELECTOR = `html.${DARK_CLASS}`;

/** Whether the page is dark for this mode, store flag and device preference. */
export function isDark(mode: ColorMode, storeIsDark: boolean, deviceIsDark: boolean): boolean {
  if (mode === 'auto') return deviceIsDark;
  if (mode === 'store') return storeIsDark;
  return mode === 'dark';
}

/*
 * React only takes over `<html>` once it hydrates, so a page that should be dark
 * would paint light first. These run inline, before the first paint.
 */

/** `dark` mode, or `store` mode on a store whose own flag is dark. */
export const DARK_NOW_SCRIPT = `document.documentElement.classList.add('${DARK_CLASS}')`;

/** `auto` mode: dark when the visitor's device prefers it. */
export const AUTO_MODE_SCRIPT = `try{if(window.matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('${DARK_CLASS}')}catch(e){}`;

/** The before-paint script for a mode, or null when the page starts light. */
export function beforePaintScript(
  mode: ColorMode,
  storeIsDark: boolean,
  visitorToggle = false
): string | null {
  const base = mode === 'auto' ? AUTO_MODE_SCRIPT : isDark(mode, storeIsDark, false) ? DARK_NOW_SCRIPT : null;
  if (!visitorToggle) return base;
  // A visitor's stored choice (colorModeStore) decides first; otherwise the mode does.
  return `try{var m=localStorage.getItem('am1als:color-mode')}catch(e){}if(m==='dark')document.documentElement.classList.add('${DARK_CLASS}');else if(m!=='light'){${base ?? ''}}`;
}

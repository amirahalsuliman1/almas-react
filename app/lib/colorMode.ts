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
export function beforePaintScript(mode: ColorMode, storeIsDark: boolean): string | null {
  if (mode === 'auto') return AUTO_MODE_SCRIPT;
  return isDark(mode, storeIsDark, false) ? DARK_NOW_SCRIPT : null;
}

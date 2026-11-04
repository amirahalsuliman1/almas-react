import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { beforePaintScript, DARK_SELECTOR, isDark } from '../../app/lib/colorMode';

describe('isDark', () => {
  it.each([
    ['store', true, false, true],
    ['store', false, true, false],
    ['light', true, true, false],
    ['dark', false, false, true],
    ['auto', true, false, false],
    ['auto', false, true, true],
  ] as const)('%s, store dark %s, device dark %s → %s', (mode, store, device, expected) => {
    expect(isDark(mode, store, device)).toBe(expected);
  });
});

describe('beforePaintScript', () => {
  it('only pages that start dark, or may, get a script', () => {
    expect(beforePaintScript('light', true)).toBeNull();
    expect(beforePaintScript('store', false)).toBeNull();
    expect(beforePaintScript('store', true)).toContain("classList.add('dark')");
    expect(beforePaintScript('auto', false)).toContain('prefers-color-scheme: dark');
  });
});

describe('beforePaintScript with the visitor toggle', () => {
  const run = (script: string | null, stored: string | null) => {
    document.documentElement.classList.remove('dark');
    localStorage.clear();
    if (stored) localStorage.setItem('am1als:color-mode', stored);
    if (script) new Function(script)();
    return document.documentElement.classList.contains('dark');
  };

  it("a visitor's stored choice wins over the mode", () => {
    expect(run(beforePaintScript('light', false, true), 'dark')).toBe(true);
    expect(run(beforePaintScript('dark', false, true), 'light')).toBe(false);
  });

  it('with no stored choice the mode decides', () => {
    expect(run(beforePaintScript('dark', false, true), null)).toBe(true);
    expect(run(beforePaintScript('light', false, true), null)).toBe(false);
  });
});

describe('one statement of "dark"', () => {
  it('global.scss re-points the tokens under DARK_SELECTOR only', () => {
    const css = readFileSync('app/styles/01-settings/global.scss', 'utf8');
    expect(css).toContain(`${DARK_SELECTOR} {`);
    expect(css).not.toContain('color-mode-dark');
  });

  it("Tailwind's dark: reads the same class", () => {
    expect(readFileSync('tailwind.config.cjs', 'utf8')).toContain("darkMode: 'class'");
  });
});

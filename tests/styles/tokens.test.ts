import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { contrastRatio } from '../../app/lib/accent';

const css = readFileSync('app/styles/01-settings/global.scss', 'utf8');

/** The value of `--name` inside the first block whose selector starts with `selector`. */
function token(selector: string, name: string): string {
  const start = css.indexOf(`${selector}`);
  const block = css.slice(start, css.indexOf('}', start));
  const match = block.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'));
  if (!match) throw new Error(`--${name} not found under ${selector}`);
  return match[1].toLowerCase();
}

describe.each([
  ['light', ':root {\n  /* Three surfaces'],
  ['dark', 'html.dark,'],
])('%s tokens', (_mode, selector) => {
  const page = token(selector, 'surface-page');
  const section = token(selector, 'surface-section');
  const card = token(selector, 'surface-card');
  const ink = token(selector, 'main-text-color');
  const secondary = token(selector, 'text-secondary');

  it('ink and secondary text pass AA on every surface', () => {
    for (const surface of [page, section, card]) {
      expect(contrastRatio(ink, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(secondary, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the three surfaces are three different values', () => {
    expect(new Set([page, section, card]).size).toBe(3);
  });
});

describe('dark mode', () => {
  it('keys off the theme switch and the platform switch', () => {
    expect(css).toMatch(/html\.dark,\s*body\.color-mode-dark \{/);
  });
});

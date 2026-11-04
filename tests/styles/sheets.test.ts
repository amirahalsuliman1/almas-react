// @vitest-environment node
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import * as sass from 'sass';
import postcss, { type Root, type Rule } from 'postcss';
import tailwindcss from 'tailwindcss';

const themeRoot = fileURLToPath(new URL('../../', import.meta.url));
const tailwindConfig = createRequire(import.meta.url)(`${themeRoot}tailwind.config.cjs`);

async function compile(file: string): Promise<Root> {
  const { css } = sass.compile(`${themeRoot}app/styles/04-components/${file}`);
  const result = await postcss([tailwindcss({ ...tailwindConfig, content: [{ raw: '' }] })]).process(
    css,
    { from: undefined }
  );
  return result.root;
}

function decls(root: Root, selector: string, inMedia?: RegExp): Record<string, string> {
  const out: Record<string, string> = {};
  root.walkRules((rule: Rule) => {
    if (!rule.selectors.includes(selector)) return;
    const media = rule.parent?.type === 'atrule' ? (rule.parent as { params?: string }).params : '';
    if (inMedia ? !inMedia.test(media ?? '') : media) return;
    rule.walkDecls((d) => {
      out[d.prop] = d.value;
    });
  });
  return out;
}

describe('the sheet primitive', () => {
  it('paints from tokens, with the shared scrim', async () => {
    const root = await compile('bottom-sheet.scss');
    expect(decls(root, '.bottom-sheet')['background-color']).toBe('var(--surface-card)');
    expect(decls(root, '.bottom-sheet__backdrop')['background-color']).toBe('var(--overlay-scrim)');
  });

  it('has a 40px close button', async () => {
    const root = await compile('bottom-sheet.scss');
    const close = decls(root, '.bottom-sheet__close');
    expect(close.height).toBe('2.5rem');
    expect(close.width).toBe('2.5rem');
  });

  it('is a centred dialog from 1024px (B4), without the grab handle', async () => {
    const root = await compile('bottom-sheet.scss');
    const desktop = decls(root, '.bottom-sheet', /min-width:\s*1024px/);
    expect(desktop.inset).toBe('50% auto auto 50%');
    expect(desktop['border-radius']).toBe('1rem');
    expect(decls(root, '.bottom-sheet__handle', /min-width:\s*1024px/).display).toBe('none');
  });
});

describe('the menu drawer', () => {
  it('paints from tokens, links in the accent when active', async () => {
    const root = await compile('header.scss');
    expect(decls(root, '.site-nav-drawer')['background-color']).toBe('var(--surface-card)');
    expect(decls(root, '.site-nav-drawer__backdrop')['background-color']).toBe(
      'var(--overlay-scrim)'
    );
    expect(decls(root, '.site-nav-drawer__link.is-active').color).toBe('var(--color-accent-text)');
  });

  it('has 40px close and back controls', async () => {
    const root = await compile('header.scss');
    expect(decls(root, '.site-nav-drawer__close').height).toBe('2.5rem');
    expect(decls(root, '.site-nav-drawer__back').height).toBe('2.5rem');
  });
});

describe('the product card (R-05)', () => {
  it('sits on the card surface with a hairline, apart from its section', async () => {
    const root = await compile('product.scss');
    const card = decls(root, '.s-product-card-entry.s-product-card-vertical');
    expect(card['background-color']).toBe('var(--surface-card)');
    expect(card['border-color']).toBe('var(--border-subtle)');
  });

  it('prints the name at text-base semibold and the price at text-lg bold in the accent', async () => {
    const root = await compile('product.scss');
    const title = decls(root, '.s-product-card .s-product-card-content-title');
    expect(title['font-size']).toBe('1rem');
    expect(title['font-weight']).toBe('600');
    const price = decls(root, '.s-product-card-price');
    expect(price['font-size']).toBe('1.125rem');
    expect(price['font-weight']).toBe('700');
    expect(price.color).toBe('var(--color-accent-text)');
  });

  it('has a 40px accent add button and a 40px heart', async () => {
    const root = await compile('product.scss');
    const add = decls(root, '.s-product-card .s-product-card-content-footer .s-button-btn');
    expect(add.height).toBe('2.5rem');
    expect(add['background-color']).toBe('var(--color-accent)');
    const heart = decls(root, '.s-product-card .s-product-card-content-footer .s-product-card-wishlist-btn');
    expect(heart.height).toBe('2.5rem');
  });

  it('lays products four to a row on desktop, 24px apart', async () => {
    // home-blocks.scss only compiles inside app.scss (it @extends another
    // file's selector), so read its source.
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(`${themeRoot}app/styles/04-components/home-blocks.scss`, 'utf8');
    const rule = src.slice(src.indexOf('\n.s-products-list-wrapper.s-products-list-vertical-cards {'));
    expect(rule).toMatch(/grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/);
    expect(rule).toMatch(/@media \(min-width: 1024px\) \{\s*gap: 1\.5rem;/);
  });

  it('keeps no hard-coded sale red', async () => {
    const root = await compile('product.scss');
    expect(root.toString()).not.toMatch(/rgb\(153 27 27/);
  });
});

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

describe('section headers (R-06)', () => {
  it('titles at text-2xl, text-3xl from 1024px, bold, in the ink', async () => {
    const root = await compile('section-header.scss');
    const sel = '.section-header__title';
    expect(decls(root, sel)['font-size']).toBe('1.5rem');
    expect(decls(root, sel)['font-weight']).toBe('700');
    expect(decls(root, sel).color).toBe('var(--main-text-color)');
    expect(decls(root, sel, /min-width:\s*1024px/)['font-size']).toBe('1.875rem');
  });

  it('puts «عرض الكل» in the accent at text-base', async () => {
    const root = await compile('section-header.scss');
    const link = decls(root, '.section-header__all');
    expect(link.color).toBe('var(--color-accent-text)');
    expect(link['font-size']).toBe('1rem');
  });

  it("reaches Salla's slider headers and the Twig-era markup too", async () => {
    const root = await compile('section-header.scss');
    expect(decls(root, '.s-slider-block__title h2')['font-size']).toBe('1.5rem');
    expect(decls(root, '.s-block__title h2')['font-size']).toBe('1.5rem');
    expect(decls(root, '.s-slider-block__display-all').color).toBe('var(--color-accent-text)');
  });
});

describe('the hero (R-07)', () => {
  it('headline text-3xl, text-5xl from 1024px, bold', async () => {
    const root = await compile('hero.scss');
    expect(decls(root, '.hero__headline')['font-size']).toBe('1.875rem');
    expect(decls(root, '.hero__headline')['font-weight']).toBe('700');
    expect(decls(root, '.hero__headline', /min-width:\s*1024px/)['font-size']).toBe('3rem');
  });

  it('a filled accent CTA at least 48px tall', async () => {
    const root = await compile('hero.scss');
    const cta = decls(root, '.hero__cta');
    expect(cta['background-color']).toBe('var(--color-accent)');
    expect(cta.color).toBe('var(--color-accent-ink)');
    expect(cta['min-height']).toBe('3rem');
  });

  it("reserves Twig's shapes: 5:7 on a phone, 4:3 on a tablet, 31:20 from 1024px (no CLS)", async () => {
    const root = await compile('hero.scss');
    expect(decls(root, '.hero__image')['aspect-ratio']).toMatch(/^900\s*\/\s*1260$/);
    expect(decls(root, '.hero__image', /min-width:\s*768px/)['aspect-ratio']).toMatch(/^4\s*\/\s*3$/);
    expect(decls(root, '.hero__image', /min-width:\s*1024px/)['aspect-ratio']).toMatch(/^31\s*\/\s*20$/);
  });

  it('lays the copy over the photograph at every width, never beside it (Twig, owner 2026-11-05)', async () => {
    const root = await compile('hero.scss');
    expect(decls(root, '.hero__content')['grid-area'].replace(/\s/g, '')).toBe('1/1');
    expect(decls(root, '.hero__slide', /min-width:\s*1024px/)['grid-template-columns']).toBeUndefined();
    expect(decls(root, '.hero__content', /min-width:\s*1024px/)['grid-area']).toBeUndefined();
  });
});

describe('product rows (R-10)', () => {
  it('draw no scroll bar on the carousel track', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(`${themeRoot}app/styles/04-components/home-blocks.scss`, 'utf8');
    const track = src.slice(src.indexOf('  &__track {\n    @apply flex gap-3 overflow-x-auto'));
    expect(track.slice(0, 1200)).toMatch(/scrollbar-width: none;/);
    expect(track.slice(0, 1200)).toMatch(/&::-webkit-scrollbar \{\s*display: none;/);
  });

  it('paint the arrows and dots from tokens, the active dot in the accent', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(`${themeRoot}app/styles/04-components/home-blocks.scss`, 'utf8');
    expect(src).toMatch(/&\.is-active::before \{\s*@apply w-\[18px\];\s*background-color: var\(--color-accent\);/);
    expect(src).not.toMatch(/border-gray-300 text-gray-800/);
  });
});

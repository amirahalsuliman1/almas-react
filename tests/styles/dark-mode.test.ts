// @vitest-environment node
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import * as sass from 'sass';
import postcss, { type Root } from 'postcss';
import tailwindcss from 'tailwindcss';

const themeRoot = fileURLToPath(new URL('../../', import.meta.url));
const tailwindConfig = createRequire(import.meta.url)(`${themeRoot}tailwind.config.cjs`);

async function compile(file: string): Promise<Root> {
  const { css } = sass.compile(`${themeRoot}app/styles/04-components/${file}`);
  const result = await postcss([
    tailwindcss({ ...tailwindConfig, content: [{ raw: '' }] }),
  ]).process(css, { from: undefined });
  return result.root;
}

function declarations(root: Root, selector: string): Record<string, string> {
  const decls: Record<string, string> = {};
  root.walkRules((rule) => {
    if (rule.selectors.includes(selector)) {
      rule.walkDecls((decl) => {
        decls[decl.prop] = decl.value;
      });
    }
  });
  return decls;
}

describe('footer_is_dark (.store-footer--dark)', () => {
  // The footer paints from tokens (footer.scss); the setting re-points the
  // footer's own tokens to the dark palette, so its menu, headings and links
  // follow without a rule per element.
  it("keeps no dark footer variant (Twig), and the menu items read the footer tokens", async () => {
    const root = await compile('footer.scss');

    expect(declarations(root, '.store-footer--dark')).toEqual({});

    const item = declarations(root, '.store-footer__menu .s-menu-footer-item');
    expect(item.color).toBe('var(--text-footer)');
  });
});

describe('topnav_is_dark (body.topnav-is-dark)', () => {
  it('darkens the header bar, the only bar either layout has (Twig)', async () => {
    const root = await compile('header.scss');

    const bar = declarations(root, 'body.topnav-is-dark .site-header__bar');
    expect(bar['background-color']).toContain('rgb(29 31 31'); // dark #1D1F1F

    const action = declarations(
      root,
      'body.topnav-is-dark .site-header__bar .header-action'
    );
    expect(action.color).toContain('rgb(209 213 219'); // gray-300
  });

  it('paints the bar cart hover once, on the circle around the icon', async () => {
    const root = await compile('header.scss');
    const bar = 'body.topnav-is-dark .site-header__bar';

    expect(declarations(root, `${bar} .header-action:hover`)).toHaveProperty('background-color');
    expect(declarations(root, `${bar} .s-cart-summary-wrapper`).color).toContain(
      'rgb(209 213 219' // gray-300
    );
    expect(declarations(root, `${bar} .s-cart-summary-wrapper:hover`)).toEqual({});
  });

  it('shows the bar login icon in gray like the cart and search, with no hover background of its own', async () => {
    const root = await compile('header.scss');
    const login = 'body.topnav-is-dark .site-header__bar .s-user-menu-login-btn';

    expect(declarations(root, `${login} svg`).fill).toBe('#d1d5db'); // gray-300
    expect(declarations(root, login).color).toContain('rgb(209 213 219'); // gray-300
    expect(declarations(root, `${login}:hover`)['background-color']).toBe('transparent');
  });
});

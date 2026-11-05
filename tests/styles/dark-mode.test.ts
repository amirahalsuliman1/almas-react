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

describe('topnav_is_dark', () => {
  it("is gone with the top bar: Twig's header has one light bar, coloured by the header settings", async () => {
    const root = await compile('header.scss');
    expect(root.toString()).not.toContain('topnav-is-dark');
  });
});

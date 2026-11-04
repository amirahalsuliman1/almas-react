import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ThemeTokens, gradientRules } from '../../../app/components/layout/ThemeTokens';
import { DARK_SELECTOR } from '../../../app/lib/colorMode';
import manifest from '../../../twilight.json';

const theme = vi.hoisted(() => ({
  settings: {} as Record<string, unknown>,
  color: { is_dark: false } as { is_dark: boolean },
}));
vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({
  useTwilight: () => ({ theme }),
}));

const render = () => renderToString(<ThemeTokens />);
type Setting = { id?: string; value?: unknown; selected?: { value: string }[] };
const setting = (id: string) =>
  (manifest.settings as Setting[]).find((s) => s.id === id) as Setting | undefined;

beforeEach(() => {
  theme.settings = {};
  theme.color = { is_dark: false };
});

describe('ThemeTokens — accent', () => {
  it('leaves the accent to the store colour when accent_color is unset', () => {
    expect(render()).not.toContain('--color-accent');
  });

  it('writes the accent and a readable ink', () => {
    theme.settings = { accent_color: '#86663A' };
    const html = render();
    expect(html).toContain('--color-accent:#86663a');
    expect(html).toContain('--color-accent-ink:#ffffff');
  });

  it('drops anything that is not a colour', () => {
    theme.settings = { accent_color: 'red;}body{display:none', color_page_background: 'url(x)' };
    const html = render();
    expect(html).not.toContain('display:none');
    expect(html).not.toContain('url(x)');
  });
});

describe('ThemeTokens — colour panel', () => {
  it('fills the light tokens from their settings', () => {
    theme.settings = { color_page_background: '#FAFAFA', color_header_text: '#222222' };
    const html = render();
    expect(html).toContain('--surface-page:#fafafa');
    expect(html).toContain('--text-header:#222222');
  });

  it('writes dark colours under the dark selector, card separate from section', () => {
    theme.settings = { dark_color_section: '#202020', dark_color_card: '#303030' };
    const html = render();
    const dark = html.slice(html.indexOf(DARK_SELECTOR));
    expect(dark).toContain('--surface-section:#202020');
    expect(dark).toContain('--surface-card:#303030');
  });

  it('clamps the page gutter and maps the button style', () => {
    theme.settings = { page_gutter: 200, button_style: [{ value: 'pill' }] };
    const html = render();
    expect(html).toContain('--page-gutter:48px');
    expect(html).toContain('--button-radius:9999px');
  });

  it('writes the logo height, clamped to 24–80 and 44 by default', () => {
    expect(render()).toContain('--logo-height:44px');
    theme.settings = { header_logo_height: 200 };
    expect(render()).toContain('--logo-height:80px');
  });

  it('writes the footer logo height, clamped to 24–80 and 40 by default', () => {
    expect(render()).toContain('--footer-logo-height:40px');
    theme.settings = { footer_logo_height: 10 };
    expect(render()).toContain('--footer-logo-height:24px');
  });

  it('writes a background image only for an http(s) URL', () => {
    theme.settings = { store_background_image: 'https://cdn.salla.sa/a.jpg' };
    expect(render()).toContain('--store-bg-image:url("https://cdn.salla.sa/a.jpg")');
    theme.settings = { store_background_image: 'javascript:alert(1)' };
    expect(render()).not.toContain('--store-bg-image');
  });
});

describe('ThemeTokens — colour mode', () => {
  it('a light store paints light: no script', () => {
    expect(render()).not.toContain('<script');
  });

  it('marks <html> dark before paint in dark mode', () => {
    theme.settings = { color_mode: 'dark' };
    expect(render()).toContain("document.documentElement.classList.add('dark')");
  });

  it('follows a dark store before paint, and a fixed light mode ignores it', () => {
    theme.color = { is_dark: true };
    expect(render()).toContain("classList.add('dark')");
    theme.settings = { color_mode: [{ value: 'light' }] };
    expect(render()).not.toContain('<script');
  });

  it('auto adds the before-paint device check', () => {
    theme.settings = { color_mode: 'auto' };
    expect(render()).toContain('prefers-color-scheme: dark');
  });
});

describe('manifest', () => {
  it('declares every setting ThemeTokens reads', () => {
    for (const id of [
      'accent_color',
      'secondary_color',
      'color_page_background',
      'color_text_primary',
      'color_header_background',
      'color_header_text',
      'color_footer_background',
      'color_footer_text',
      'color_icons',
      'button_style',
      'page_gutter',
      'store_background_image',
      'color_mode',
      'dark_color_page',
      'dark_color_section',
      'dark_color_card',
      'dark_color_text',
      'dark_background_image',
      'logo_main',
      'dark_logo',
      'header_logo_height',
    ]) {
      expect(setting(id), id).toBeDefined();
    }
  });

  it('defaults the header to the layout with the desktop category row', () => {
    expect(setting('header_layout')?.selected?.[0]?.value).toBe('default');
  });

  it('defaults the colour mode to the store setting', () => {
    expect(setting('color_mode')?.selected?.[0]?.value).toBe('store');
  });
});

describe('gradientRules', () => {
  const colours = { gradient_color_start: '#86663A', gradient_color_end: '#F9E6E7' };

  it('writes nothing without both colours or without a switch on', () => {
    expect(gradientRules({ gradient_on_bars: true, gradient_color_start: '#86663A' })).toBe('');
    expect(gradientRules(colours)).toBe('');
  });

  it('paints the switched-on places, first colour at the right', () => {
    const css = gradientRules({ ...colours, gradient_on_bars: true, gradient_on_buttons: true });
    expect(css).toContain('.announcement-bar,.marquee');
    expect(css).toContain('.hero__cta');
    expect(css).not.toContain('.s-quantity-input-button');
    expect(css).toContain('linear-gradient(to left,#86663a,#f9e6e7)');
  });

  it('drops a colour that is not a hex value', () => {
    expect(gradientRules({ gradient_color_start: 'red', gradient_color_end: '#fff', gradient_on_bars: true })).toBe('');
  });
});


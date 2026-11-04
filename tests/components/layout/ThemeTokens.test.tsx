import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ThemeTokens } from '../../../app/components/layout/ThemeTokens';
import manifest from '../../../twilight.json';

const theme = vi.hoisted(() => ({ settings: {} as Record<string, unknown> }));
vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({
  useTwilight: () => ({ theme }),
}));

describe('ThemeTokens', () => {
  it('writes nothing when accent_color is unset, so the store colour stays', () => {
    theme.settings = {};
    expect(renderToString(<ThemeTokens />)).toBe('');
  });

  it('writes the accent and a readable ink on the server render', () => {
    theme.settings = { accent_color: '#86663A' };
    const html = renderToString(<ThemeTokens />);
    expect(html).toContain('--color-accent:#86663a');
    expect(html).toContain('--color-accent-ink:#ffffff');
  });

  it('ignores a value that is not a colour', () => {
    theme.settings = { accent_color: 'red;}body{display:none' };
    expect(renderToString(<ThemeTokens />)).toBe('');
  });

  it('is declared in twilight.json as an optional colour with no default', () => {
    const setting = manifest.settings.find((s: { id?: string }) => s.id === 'accent_color') as
      | Record<string, unknown>
      | undefined;
    expect(setting).toMatchObject({ type: 'string', format: 'color', required: false, value: '' });
  });
});

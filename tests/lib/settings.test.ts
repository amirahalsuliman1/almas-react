import { describe, it, expect } from 'vitest';
import { clampedInteger, safeImageUrl, selectedValue } from '../../app/lib/settings';

describe('selectedValue', () => {
  const allowed = ['a', 'b'] as const;
  it('reads a string or the first { value }', () => {
    expect(selectedValue('b', allowed, 'a')).toBe('b');
    expect(selectedValue([{ value: 'b' }], allowed, 'a')).toBe('b');
  });
  it('falls back on anything not allowed', () => {
    expect(selectedValue('c', allowed, 'a')).toBe('a');
    expect(selectedValue(undefined, allowed, 'a')).toBe('a');
    expect(selectedValue([], allowed, 'a')).toBe('a');
  });
});

describe('clampedInteger', () => {
  it('rounds, clamps and accepts numeric strings', () => {
    expect(clampedInteger(12.6, 0, 48, 16)).toBe(13);
    expect(clampedInteger(-4, 0, 48, 16)).toBe(0);
    expect(clampedInteger('20', 0, 48, 16)).toBe(20);
  });
  it('keeps 0 as a real value and falls back on garbage', () => {
    expect(clampedInteger(0, 0, 48, 16)).toBe(0);
    expect(clampedInteger('x', 0, 48, 16)).toBe(16);
    expect(clampedInteger(null, 0, 48, 16)).toBe(16);
  });
});

describe('safeImageUrl', () => {
  it('accepts http(s) URLs only, with nothing that could close url("…")', () => {
    expect(safeImageUrl('https://cdn.salla.sa/x.png')).toBe('https://cdn.salla.sa/x.png');
    for (const bad of ['javascript:x', 'https://a.b/x")', "https://a.b/'", 'data:image/png;base64,x', '', null]) {
      expect(safeImageUrl(bad)).toBeNull();
    }
  });
});

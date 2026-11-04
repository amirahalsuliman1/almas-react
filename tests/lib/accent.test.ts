import { describe, it, expect } from 'vitest';
import { contrastRatio, inkOn, normaliseHex } from '../../app/lib/accent';

describe('normaliseHex', () => {
  it('accepts #rrggbb and #rgb, case-insensitive, trimmed', () => {
    expect(normaliseHex('#86663A')).toBe('#86663a');
    expect(normaliseHex(' #abc ')).toBe('#aabbcc');
  });

  it('rejects anything that is not a hex colour, so nothing else reaches CSS', () => {
    for (const bad of ['', 'red', '#12345', '#86663a;}body{display:none', 'url(x)', null, 42, undefined]) {
      expect(normaliseHex(bad)).toBeNull();
    }
  });
});

describe('contrast', () => {
  it('matches the WCAG values for black and white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  it('the demo store bronze carries white text at AA', () => {
    expect(contrastRatio('#86663a', '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('picks white on a dark accent and ink on a pale one', () => {
    expect(inkOn('#86663a')).toBe('#ffffff');
    expect(inkOn('#f9e6e7')).toBe('#1b1b1b');
  });
});

import { describe, it, expect } from 'vitest';
import ar from '../../locales/ar.json';
import en from '../../locales/en.json';

describe('locales', () => {
  it('Arabic and English carry the same keys', () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });

  it('no value is empty', () => {
    for (const [key, value] of [...Object.entries(ar), ...Object.entries(en)]) {
      expect(value, key).not.toBe('');
    }
  });
});

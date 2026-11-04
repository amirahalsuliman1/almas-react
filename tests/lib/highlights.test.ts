import { describe, it, expect, beforeEach } from 'vitest';
import { highlightId, markSeen, readSeen } from '../../app/lib/highlights';
import { pickedProductId, pickedUrl } from '../../app/lib/pickers';

beforeEach(() => localStorage.clear());

describe('highlights helpers', () => {
  it('ids follow the slides, so a changed highlight reads as new', () => {
    expect(highlightId(['a', 'b'])).toBe(highlightId(['a', 'b']));
    expect(highlightId(['a', 'b'])).not.toBe(highlightId(['a', 'c']));
  });

  it('remembers opened highlights, newest first, at most 100', () => {
    for (let i = 0; i < 105; i += 1) markSeen(`h${i}`);
    const seen = readSeen();
    expect(seen).toHaveLength(100);
    expect(seen[0]).toBe('h104');
  });

  it('reads the product picker in each shape it sends', () => {
    expect(pickedProductId([{ id: 843322474, name: 'x' }])).toBe('843322474');
    expect(pickedProductId([843322474])).toBe('843322474');
    expect(pickedProductId('843322474')).toBe('843322474');
    expect(pickedProductId([])).toBeNull();
    expect(pickedProductId(null)).toBeNull();
  });

  it('reads a link as a string or an object', () => {
    expect(pickedUrl('https://am1als.com/a')).toBe('https://am1als.com/a');
    expect(pickedUrl([{ url: '/offers' }])).toBe('/offers');
    expect(pickedUrl({ value: '/brands' })).toBe('/brands');
    expect(pickedUrl('  ')).toBeNull();
  });
});

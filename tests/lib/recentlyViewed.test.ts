import { describe, it, expect, beforeEach } from 'vitest';
import { MAX_STORED, STORAGE_KEY, readRecentlyViewed, recordRecentlyViewed } from '../../app/lib/recentlyViewed';

describe('recently viewed', () => {
  beforeEach(() => window.localStorage.clear());

  it("keeps Twig's key, so a visitor's list carries over", () => {
    expect(STORAGE_KEY).toBe('am1als:recently-viewed');
  });

  it('puts the newest first, once, and keeps at most twenty', () => {
    recordRecentlyViewed(1);
    recordRecentlyViewed('2');
    recordRecentlyViewed(1);
    expect(readRecentlyViewed()).toEqual(['1', '2']);
    for (let i = 10; i < 40; i++) recordRecentlyViewed(i);
    expect(readRecentlyViewed()).toHaveLength(MAX_STORED);
    expect(readRecentlyViewed()[0]).toBe('39');
  });

  it('ignores an empty id and survives broken storage', () => {
    recordRecentlyViewed('');
    recordRecentlyViewed(null);
    expect(readRecentlyViewed()).toEqual([]);
    window.localStorage.setItem(STORAGE_KEY, '{not json');
    expect(readRecentlyViewed()).toEqual([]);
  });
});

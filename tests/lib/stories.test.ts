import { describe, it, expect } from 'vitest';
import {
  brandsOf,
  filterStories,
  isStoriesPage,
  splitTags,
  tagsOf,
  toStories,
} from '../../app/lib/stories';

describe('stories', () => {
  it('splits tags on Arabic and Latin commas and drops blanks', () => {
    expect(splitTags('هدايا، عروض, ميكاب ,, ')).toEqual(['هدايا', 'عروض', 'ميكاب']);
    expect(splitTags('')).toEqual([]);
  });

  it('skips items without an image and keeps each item’s place in the list', () => {
    const stories = toStories([{ image: '' }, { image: 'https://cdn/a.jpg' }]);
    expect(stories).toHaveLength(1);
    expect(stories[0].index).toBe(1);
  });

  it('reads the shape from the dropdown, portrait by default', () => {
    const [a, b, c] = toStories([
      { image: '/a', shape: [{ value: 'tall' }] },
      { image: '/b', shape: 'square' },
      { image: '/c', shape: 'wide' },
    ]);
    expect([a.shape, b.shape, c.shape]).toEqual(['tall', 'square', 'portrait']);
  });

  it('places one point for the product at the merchant’s percentages, clamped', () => {
    const [withProduct, without, centred] = toStories([
      { image: '/a', product: [{ id: 7 }], hotspot_x: 120, hotspot_y: -4 },
      { image: '/b', hotspot_x: 30 },
      { image: '/c', product: ['9'] },
    ]);
    expect(withProduct.points).toEqual([{ x: 100, y: 0, productId: '7' }]);
    expect(without.points).toEqual([]);
    expect(centred.points).toEqual([{ x: 50, y: 50, productId: '9' }]);
  });

  it('reads multilanguage alt text and tags in the current locale', () => {
    const [story] = toStories(
      [{ image: '/a', alt: { ar: 'عميلة', en: 'A customer' }, tags: { ar: 'هدايا', en: 'Gifts, Offers' } }],
      'en'
    );
    expect(story.alt).toBe('A customer');
    expect(story.tags).toEqual(['Gifts', 'Offers']);
  });

  it('builds the filter choices from the stories, each once, in order', () => {
    const stories = toStories([
      { image: '/a', brand: 'Rhode', tags: 'ميكاب، هدايا' },
      { image: '/b', brand: '', tags: 'هدايا' },
      { image: '/c', brand: 'Rhode', tags: 'عروض' },
    ]);
    expect(tagsOf(stories)).toEqual(['ميكاب', 'هدايا', 'عروض']);
    expect(brandsOf(stories)).toEqual(['Rhode']);
    expect(filterStories(stories, 'هدايا', '').map((s) => s.index)).toEqual([0, 1]);
    expect(filterStories(stories, 'هدايا', 'Rhode').map((s) => s.index)).toEqual([0]);
    expect(filterStories(stories, '', '')).toHaveLength(3);
  });

  it('matches the custom page only against a set page id', () => {
    expect(isStoriesPage('42', 42)).toBe(true);
    expect(isStoriesPage('42', ' 42 ')).toBe(true);
    expect(isStoriesPage('42', '')).toBe(false);
    expect(isStoriesPage(undefined, '42')).toBe(false);
    expect(isStoriesPage('43', '42')).toBe(false);
  });
});

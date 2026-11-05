import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../app/components/home', () => ({
  Lookbook: () => null,
  StoryModal: () => null,
  StoryCard: () => null,
}));
vi.mock('../../../app/components/common', () => ({ SectionHeader: () => null }));

import { lookFor, lookForCategory } from '../../../app/components/product/ProductExtras';

const look = (over: Record<string, unknown>) => ({ path: 'lookbook', image: '/a.jpg', hotspots: [{ x: 1, y: 2, product: [{ id: 5 }] }], ...over });

describe('lookFor («نسّقيه مع»)', () => {
  it('finds the first Home lookbook with a point on the product', () => {
    const blocks = [{ path: 'hero' }, look({ image: '/first.jpg' }), look({ image: '/second.jpg' })];
    expect(lookFor(blocks as never, 5)?.image).toBe('/first.jpg');
  });

  it('skips one that turned show_on_products off, one with no image, and one without the product', () => {
    expect(lookFor([look({ show_on_products: false })] as never, 5)).toBeNull();
    expect(lookFor([look({ image: '' })] as never, 5)).toBeNull();
    expect(lookFor([look({})] as never, 6)).toBeNull();
  });
});

describe('lookFor with the list endpoint’s names', () => {
  it('accepts a block named home.lookbook', () => {
    expect(lookFor([look({ path: 'home.lookbook' })] as never, 5)?.image).toBe('/a.jpg');
  });
});

describe('lookForCategory (the category cover)', () => {
  it('finds the first Home lookbook whose category field names this category', () => {
    const blocks = [
      look({ image: '/other.jpg', category: [{ id: 9 }] }),
      look({ path: 'home.lookbook', image: '/mine.jpg', category: [{ id: 3 }] }),
      look({ image: '/later.jpg', category: [{ id: 3 }] }),
    ];
    expect(lookForCategory(blocks as never, 3)?.image).toBe('/mine.jpg');
  });

  it('ignores a lookbook with no category, no image, or another block', () => {
    expect(lookForCategory([look({})] as never, 3)).toBeNull();
    expect(lookForCategory([look({ image: '', category: [{ id: 3 }] })] as never, 3)).toBeNull();
    expect(lookForCategory([{ path: 'hero', category: [{ id: 3 }], image: '/x.jpg' }] as never, 3)).toBeNull();
  });
});

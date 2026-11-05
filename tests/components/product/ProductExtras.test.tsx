import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../app/components/common', () => ({ SectionHeader: () => null }));
vi.mock('../../../app/components/home/Lookbook', () => ({ Lookbook: () => null }));
vi.mock('../../../app/components/home/Stories', () => ({ StoryCard: () => null }));
vi.mock('../../../app/components/home/StoryModal', () => ({ StoryModal: () => null }));

import { lookFor } from '../../../app/components/product/ProductExtras';

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

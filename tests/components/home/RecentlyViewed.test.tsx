import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { RecentlyViewed } from '../../../app/components/home/RecentlyViewed';
import { recordRecentlyViewed } from '../../../app/lib/recentlyViewed';
import manifest from '../../../twilight.json';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale: 'ar' }),
}));
const seen = vi.hoisted(() => ({ data: undefined as Record<string, unknown> | undefined }));
vi.mock('../../../app/components/home/ProductsSlider', () => ({
  ProductsSlider: ({ data }: { data: Record<string, unknown> }) => {
    seen.data = data;
    return <div className="s-products-carousel" />;
  },
}));

beforeEach(() => {
  window.localStorage.clear();
  seen.data = undefined;
});

describe('RecentlyViewed', () => {
  it('renders nothing on the server and for a visitor with no history', () => {
    recordRecentlyViewed(5);
    expect(renderToString(<RecentlyViewed data={{}} />)).toBe('');
    window.localStorage.clear();
    expect(render(<RecentlyViewed data={{}} />).container.innerHTML).toBe('');
  });

  it("asks for the visitor's products, newest first, up to the block's count", () => {
    [1, 2, 3, 4].forEach(recordRecentlyViewed);
    render(<RecentlyViewed data={{ title: 'شاهدته مؤخراً', count: 3 }} />);
    expect(seen.data?.products).toEqual({ source: 'selected', source_value: [4, 3, 2] });
    expect(seen.data?.title).toBe('شاهدته مؤخراً');
    expect(seen.data?.limit).toBe(3);
  });

  it('leaves out the product on screen', () => {
    [7, 8].forEach(recordRecentlyViewed);
    render(<RecentlyViewed data={{}} exclude={8} />);
    expect(seen.data?.products).toEqual({ source: 'selected', source_value: [7] });
  });

  it("declares Twig's block in twilight.json", () => {
    const comp = (manifest.components as { path: string; fields: { id: string }[] }[]).find(
      (c) => c.path === 'home.recently-viewed'
    );
    expect(comp?.fields.map((f) => f.id)).toEqual(['static-desc', 'title', 'count']);
  });
});

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock('@salla.sa/twilight-theme-engine/utils/cdn-image', () => ({
  getCdnImageUrl: (src: string) => src,
  getCdnImageSrcSet: () => undefined,
}));

import {
  FiltersHeading,
  ListingBanner,
  ListingCover,
  ListingEmpty,
  appliedFilterCount,
  itemListJsonLd,
  resetFilters,
} from '../../../app/components/product/ListingExtras';

describe('ListingCover (the offers cover)', () => {
  it('draws the image with its size reserved, the breadcrumb and the page title as the h1', () => {
    const { container } = render(<ListingCover image="https://cdn.salla.sa/c.jpg" title="العروض" breadcrumb={<nav>trail</nav>} />);
    const img = container.querySelector('img.listing-cover__image');
    expect(img?.getAttribute('width')).toBe('1920');
    expect(img?.getAttribute('height')).toBe('900');
    expect(img?.getAttribute('alt')).toBe('');
    expect(container.querySelector('.listing-cover__breadcrumbs nav')?.textContent).toBe('trail');
    const h1 = container.querySelector('h1#page-main-title');
    expect(h1?.textContent).toBe('العروض');
  });

  it('leaves the breadcrumb out when there is none', () => {
    const { container } = render(<ListingCover image="https://cdn.salla.sa/c.jpg" title="العروض" />);
    expect(container.querySelector('.listing-cover__breadcrumbs')).toBeNull();
  });
});

describe('ListingBanner (the merchant banner)', () => {
  it('is absent without an image', () => {
    expect(render(<ListingBanner settings={{}} fallbackLabel="x" />).container.innerHTML).toBe('');
  });

  it('draws a plain image when no link is set, with the alt text written for it', () => {
    const { container } = render(
      <ListingBanner
        settings={{ listing_banner_image: 'https://cdn.salla.sa/b.jpg', listing_banner_alt: 'تخفيضات' }}
        fallbackLabel="العطور"
      />
    );
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('img.promo-banner__image')?.getAttribute('alt')).toBe('تخفيضات');
  });

  it('links where the merchant points it, and names a link whose image has no alt', () => {
    const { container } = render(
      <ListingBanner
        settings={{ listing_banner_image: 'https://cdn.salla.sa/b.jpg', listing_banner_url: [{ url: '/offers' }] }}
        fallbackLabel="العطور"
      />
    );
    const link = container.querySelector('a.promo-banner__link');
    expect(link?.getAttribute('href')).toBe('/offers');
    expect(link?.getAttribute('aria-label')).toBe('العطور');
  });
});

describe('appliedFilterCount', () => {
  it('counts each ticked value, a range once and a single value once', () => {
    expect(appliedFilterCount(null)).toBe(0);
    expect(appliedFilterCount({})).toBe(0);
    expect(
      appliedFilterCount({ brand_id: ['1', '2'], price: { min: '10', max: '' }, rating: '4', category_id: [], color: '' })
    ).toBe(4);
    expect(appliedFilterCount({ price: { min: '', max: '' } })).toBe(0);
  });
});

describe('FiltersHeading', () => {
  it('shows the count and the reset only while something is applied', () => {
    const onReset = vi.fn();
    const props = { title: 'تصفية النتائج', countLabel: '(2)', resetLabel: 'إعادة تعيين', onReset };
    const none = render(<FiltersHeading {...props} count={0} />).container;
    expect(none.querySelector('h2')?.textContent).toBe('تصفية النتائج');
    expect(none.querySelector('.filters-reset')).toBeNull();

    const some = render(<FiltersHeading {...props} count={2} headingId="h" />).container;
    expect(some.querySelector('h2#h')?.textContent).toBe('تصفية النتائج (2)');
    fireEvent.click(some.querySelector('.filters-reset')!);
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

describe('resetFilters', () => {
  it("calls the component's own reset, and is safe when it is not there", () => {
    const el = document.createElement('salla-filters') as HTMLElement & { resetFilters?: () => void };
    el.id = 'filters-menu';
    el.resetFilters = vi.fn();
    document.body.append(el);
    resetFilters('filters-menu');
    expect(el.resetFilters).toHaveBeenCalledTimes(1);
    el.remove();
    expect(() => resetFilters('filters-menu')).not.toThrow();
  });
});

describe('ListingEmpty', () => {
  it('says why and offers the way home', () => {
    const { container } = render(<ListingEmpty message="لا توجد منتجات" actionLabel="العودة للرئيسية" />);
    expect(container.querySelector('.no-content-placeholder p')?.textContent).toBe('لا توجد منتجات');
    const link = container.querySelector('a.empty-state__action');
    expect(link?.getAttribute('href')).toBe('/');
    expect(link?.textContent).toBe('العودة للرئيسية');
    expect(container.querySelector('.icon i')?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('itemListJsonLd', () => {
  it('lists the products on screen in order, skipping any without a name or a link', () => {
    const json = itemListJsonLd([
      { name: ' عطر ', url: 'https://s.test/p1' },
      { name: '', url: 'https://s.test/p2' },
      { name: 'كريم', url: 'https://s.test/p3' },
    ]);
    const data = JSON.parse(json!);
    expect(data['@type']).toBe('ItemList');
    expect(data.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, url: 'https://s.test/p1', name: 'عطر' },
      { '@type': 'ListItem', position: 2, url: 'https://s.test/p3', name: 'كريم' },
    ]);
  });

  it('emits nothing for an empty list, and cannot close its script tag', () => {
    expect(itemListJsonLd([])).toBeNull();
    const json = itemListJsonLd([{ name: '</script><b>', url: 'https://s.test/p' }])!;
    expect(json).not.toContain('<');
    expect(JSON.parse(json).itemListElement[0].name).toBe('</script><b>');
  });
});

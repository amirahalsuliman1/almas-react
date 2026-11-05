import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

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

import { ListingBanner, ListingCover } from '../../../app/components/product/ListingExtras';

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

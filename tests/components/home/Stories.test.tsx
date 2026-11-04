import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { Stories } from '../../../app/components/home/Stories';
import manifest from '../../../twilight.json';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale: 'ar' }),
}));
const env = vi.hoisted(() => ({ pageId: undefined as string | undefined, settings: {} as Record<string, unknown> }));
vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({
  useTwilight: () => ({ theme: { settings: env.settings } }),
}));
vi.mock('@tanstack/react-router', () => ({
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({
      matches: env.pageId ? [{ routeId: '/{-$locale}/$slug/page-{$id}', params: { id: env.pageId } }] : [],
    }),
}));
vi.mock('@salla.sa/twilight-theme-engine/utils/cdn-image', () => ({
  getCdnImageUrl: (src: string) => src,
  getCdnImageSrcSet: (src: string) => `${src} 400w`,
}));
const wishlist = vi.hoisted(() => ({ toggle: vi.fn(), has: () => false }));
vi.mock('@salla.sa/twilight-theme-engine/hooks/useWishlist', () => ({ useWishlist: () => wishlist }));
const hotspot = vi.hoisted(() => ({ props: undefined as Record<string, unknown> | undefined }));
// The barrel pulls in every shared component; the stories use three of them.
vi.mock('../../../app/components/common', async () => ({
  BottomSheet: (await import('../../../app/components/common/BottomSheet')).BottomSheet,
  HotspotImage: (props: Record<string, unknown>) => {
    hotspot.props = props;
    return <div className="hotspot" data-image={props.image as string} />;
  },
  SectionHeader: ({ title }: { title?: string }) => (title ? <h2>{title}</h2> : null),
}));
vi.mock('../../../app/lib/afterNextPaint', () => ({
  afterNextPaint: (fn: () => void) => {
    fn();
    return () => {};
  },
}));

const items = [
  { image: '/1.jpg', shape: 'square', brand: 'Rhode', tags: 'ميكاب، هدايا', product: [{ id: 5 }], hotspot_x: 20, hotspot_y: 30 },
  { image: '/2.jpg', shape: 'tall', tags: 'هدايا' },
  { image: '/3.jpg', brand: 'Dior', tags: 'عروض' },
];

const dialog = () => document.body.querySelector('[role="dialog"]');

describe('Stories', () => {
  beforeEach(() => {
    env.pageId = undefined;
    env.settings = {};
    hotspot.props = undefined;
    document.documentElement.dir = 'rtl';
  });

  it('renders nothing without a story that has an image', () => {
    expect(renderToString(<Stories data={{ items: [{ image: '' }] }} />)).toBe('');
  });

  it('reserves each photograph’s box from its shape', () => {
    const { container } = render(<Stories data={{ title: 'تجارب عملائنا', items }} />);
    const media = container.querySelectorAll<HTMLElement>('.story-card__media');
    expect(media[0].style.getPropertyValue('--story-ratio')).toBe('1 / 1');
    expect(media[1].style.getPropertyValue('--story-ratio')).toBe('2 / 3');
    const img = media[1].querySelector('img')!;
    expect([img.getAttribute('width'), img.getAttribute('height')]).toEqual(['600', '900']);
    expect(container.querySelector('h2')?.textContent).toBe('تجارب عملائنا');
  });

  it('isolates a Latin brand inside the Arabic tags, outside the button', () => {
    const { container } = render(<Stories data={{ items }} />);
    const card = container.querySelector('.story-card')!;
    expect(card.querySelector('.story-tags bdi')?.textContent).toBe('Rhode');
    expect(card.querySelector('.story-card__trigger .story-tags')).toBeNull();
    expect(card.querySelector('.story-card__trigger')?.getAttribute('aria-label')).toBe('View the Rhode story');
  });

  it('has no filter on the home page', () => {
    env.settings = { stories_page_id: '42' };
    const { container } = render(<Stories data={{ items }} />);
    expect(container.querySelector('.stories-filter')).toBeNull();
    expect(container.querySelector('.stories--page')).toBeNull();
  });

  it('filters by tag and brand on the stories page', () => {
    env.pageId = '42';
    env.settings = { stories_page_id: 42 };
    const { container, getByRole } = render(<Stories data={{ items }} />);
    const chips = [...container.querySelectorAll('.stories-filter__chip')].map((c) => c.textContent);
    expect(chips).toEqual(['All', 'ميكاب', 'هدايا', 'عروض']);

    fireEvent.click(getByRole('button', { name: 'هدايا' }));
    expect(container.querySelectorAll('.story-card')).toHaveLength(2);
    expect(getByRole('button', { name: 'هدايا' }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.change(container.querySelector('select')!, { target: { value: 'Rhode' } });
    expect(container.querySelectorAll('.story-card')).toHaveLength(1);
    expect(container.querySelector('[aria-live]')?.textContent).toBe('1 stories');
  });

  it('opens a story over the feed with its product point on the shared hotspot image', () => {
    const { container } = render(<Stories data={{ items }} />);
    fireEvent.click(container.querySelector('.story-card__trigger')!);
    expect(dialog()?.getAttribute('aria-label')).toBe('Customer story — Rhode');
    expect(hotspot.props?.image).toBe('/1.jpg');
    expect(hotspot.props?.points).toEqual([{ x: 20, y: 30, productId: '5' }]);
    fireEvent.click(document.body.querySelector('.story-modal__action--wishlist')!);
    expect(wishlist.toggle).toHaveBeenCalledWith(5);
  });

  it('steps between stories with the arrows and the keys, in reading direction', () => {
    const { container } = render(<Stories data={{ items }} />);
    fireEvent.click(container.querySelectorAll('.story-card__trigger')[1]);
    const prev = document.body.querySelector<HTMLButtonElement>('.story-modal__nav--prev')!;
    const next = document.body.querySelector<HTMLButtonElement>('.story-modal__nav--next')!;
    expect(prev.hidden || next.hidden).toBe(false);

    fireEvent.click(next);
    expect(hotspot.props?.image).toBe('/3.jpg');
    expect(document.body.querySelector<HTMLButtonElement>('.story-modal__nav--next')!.hidden).toBe(true);

    // In Arabic ← is the next story's way, so → goes back.
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(hotspot.props?.image).toBe('/2.jpg');
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(hotspot.props?.image).toBe('/3.jpg');
  });

  it('closes on Escape and gives focus back to the last story’s card', async () => {
    vi.useFakeTimers();
    const { container } = render(<Stories data={{ items }} />);
    const triggers = container.querySelectorAll<HTMLButtonElement>('.story-card__trigger');
    triggers[0].focus();
    fireEvent.click(triggers[0]);
    fireEvent.click(document.body.querySelector('.story-modal__nav--next')!);
    fireEvent.keyDown(document, { key: 'Escape' });
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(document.activeElement).toBe(triggers[1]);
    vi.useRealTimers();
  });

  it('shows the follow link only for a safe address', () => {
    const { container, rerender } = render(<Stories data={{ items, cta_url: 'javascript:alert(1)' }} />);
    expect(container.querySelector('.stories__cta')).toBeNull();
    rerender(<Stories data={{ items, cta_url: 'https://instagram.com/am1als', cta_label: 'تابعينا' }} />);
    const link = container.querySelector('.stories__cta-link')!;
    expect(link.getAttribute('href')).toBe('https://instagram.com/am1als');
    expect(link.textContent).toBe('تابعينا');
  });

  it('emits no Article schema', () => {
    render(<Stories data={{ items }} />);
    expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it('declares the block and the page setting in twilight.json', () => {
    const comp = (manifest.components as { path: string; fields: { id: string }[] }[]).find((c) => c.path === 'home.stories');
    expect(comp?.fields.map((f) => f.id)).toEqual(['title', 'cta_label', 'cta_url', 'items']);
    expect((manifest.settings as { id?: string }[]).some((s) => s.id === 'stories_page_id')).toBe(true);
  });
});

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { VideoCarousel } from '../../../app/components/home/VideoCarousel';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale: 'ar' }),
}));
vi.mock('../../../app/components/common', () => ({
  ScrollCarousel: ({ children }: { children: React.ReactNode }) => <div data-testid="carousel">{children}</div>,
}));
vi.mock('../../../app/components/common/SectionHeader', () => ({
  SectionHeader: ({ title }: { title?: string }) => <h2>{title}</h2>,
}));
const products = vi.hoisted(() => ({ map: {} as Record<string, unknown> }));
vi.mock('../../../app/components/common/ProductPill', () => ({
  useProducts: () => products.map,
  ProductPill: ({ product }: { product: { name: string } }) => <li className="product-pill">{product.name}</li>,
}));

// Every slide counts as near the screen.
class ImmediateObserver {
  constructor(private cb: IntersectionObserverCallback) {}
  observe() {
    this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
  disconnect() {}
  unobserve() {}
}

beforeEach(() => {
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = ImmediateObserver;
  products.map = { '5': { name: 'Stanley' } };
});

const items = [
  { embed_url: 'https://youtu.be/abc', poster: 'itsawjan', product: [{ id: 5 }] },
  { embed_url: 'https://cdn.salla.sa/clip.mp4' },
  { embed_url: 'not a url' },
];

describe('VideoCarousel', () => {
  it('renders nothing without a playable link', () => {
    expect(renderToString(<VideoCarousel data={{ items: [{ embed_url: '' }] }} />)).toBe('');
  });

  it('plays YouTube in an iframe and a file in <video>, each named', () => {
    const { container } = render(<VideoCarousel data={{ items }} />);
    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toBe('https://www.youtube.com/embed/abc?playsinline=1');
    expect(iframe?.getAttribute('title')).toBe('Video itsawjan');
    const video = container.querySelector('video');
    expect(video?.getAttribute('src')).toBe('https://cdn.salla.sa/clip.mp4');
    expect(container.querySelectorAll('.video-carousel__slide')).toHaveLength(2);
  });

  it('mounts no player server-side: only the frame, whose shape is set in CSS', () => {
    const html = renderToString(<VideoCarousel data={{ items }} />);
    expect(html).not.toContain('<iframe');
    expect(html).toContain('video-carousel__frame');
  });

  it("shows the publisher's name and the product row", () => {
    const { container } = render(<VideoCarousel data={{ items }} />);
    expect(container.querySelector('.video-carousel__publisher')?.textContent).toBe('itsawjan');
    expect(container.querySelector('.product-pill')?.textContent).toBe('Stanley');
  });

  it('drops a file that fails to play', () => {
    const { container } = render(<VideoCarousel data={{ items }} />);
    act(() => {
      fireEvent.error(container.querySelector('video')!);
    });
    expect(container.querySelectorAll('.video-carousel__slide')).toHaveLength(1);
  });

  it('titles the section when the merchant gives a title', () => {
    const { container } = render(<VideoCarousel data={{ items, title: 'شاهديها' }} />);
    expect(container.querySelector('h2')?.textContent).toBe('شاهديها');
  });
});

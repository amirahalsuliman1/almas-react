import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { Hero } from '../../../app/components/home/Hero';
import manifest from '../../../twilight.json';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale: 'ar' }),
}));
vi.mock('@salla.sa/twilight-theme-engine/utils/cdn-image', () => ({
  getCdnImageUrl: (url?: string) => url,
  getCdnImageSrcSet: (url?: string) => (url ? `${url} 900w` : undefined),
}));
const carousel = vi.hoisted(() => ({ autoPlay: undefined as boolean | undefined }));
vi.mock('../../../app/components/common', () => ({
  ScrollCarousel: ({ children, autoPlay }: { children: React.ReactNode; autoPlay?: boolean }) => {
    carousel.autoPlay = autoPlay;
    return <div data-testid="carousel">{children}</div>;
  },
}));

const slide = {
  image: 'https://cdn.salla.sa/hero.jpg',
  quote: 'تشكيلة جديدة وصلت',
  subtitle: 'منتجات أصلية',
  url: '/offers',
};

describe('Hero', () => {
  it('renders nothing without a slide that has an image', () => {
    expect(renderToString(<Hero data={{ slides: [{ quote: 'x' }] }} />)).toBe('');
  });

  it('shows the headline as the section heading, the subline and a filled «تسوق الآن»', () => {
    const { container } = render(<Hero data={{ slides: [slide] }} />);
    expect(container.querySelector('h2.hero__headline')?.textContent).toContain('تشكيلة جديدة وصلت');
    expect(container.querySelector('.hero__subtitle')?.textContent).toBe('منتجات أصلية');
    const cta = container.querySelector('a.hero__cta');
    expect(cta?.getAttribute('href')).toBe('/offers');
    expect(cta?.textContent).toBe('Shop now');
  });

  it("uses the merchant's button label, and drops the button without a link", () => {
    const labelled = render(<Hero data={{ slides: [{ ...slide, cta_label: 'اكتشفي' }] }} />);
    expect(labelled.container.querySelector('.hero__cta')?.textContent).toBe('اكتشفي');
    labelled.unmount();
    const noLink = render(<Hero data={{ slides: [{ ...slide, url: '' }] }} />);
    expect(noLink.container.querySelector('.hero__cta')).toBeNull();
  });

  it('makes the first image the LCP: eager, high priority, sized', () => {
    const { container } = render(<Hero data={{ slides: [slide, { ...slide, quote: 'ب' }] }} />);
    const [first, second] = container.querySelectorAll('img.hero__image');
    expect(first.getAttribute('loading')).toBe('eager');
    expect(first.getAttribute('fetchpriority')).toBe('high');
    expect(first.getAttribute('width')).toBe('900');
    expect(second.getAttribute('loading')).toBe('lazy');
  });

  it('has one heading: later slides use a paragraph for their headline', () => {
    const { container } = render(<Hero data={{ slides: [slide, { ...slide, quote: 'ب' }] }} />);
    expect(container.querySelectorAll('h2')).toHaveLength(1);
  });

  it('hides the hand-drawn hearts from screen readers, and drops them when switched off', () => {
    const on = render(<Hero data={{ slides: [slide] }} />);
    const hearts = on.container.querySelectorAll('.hero__heart');
    expect(hearts).toHaveLength(2);
    hearts.forEach((h) => expect(h.getAttribute('aria-hidden')).toBe('true'));
    on.unmount();
    const off = render(<Hero data={{ slides: [slide], quote_hearts: false }} />);
    expect(off.container.querySelector('.hero__heart')).toBeNull();
  });

  it('autoplay comes with a pause button that stops it', () => {
    const { getByRole } = render(<Hero data={{ slides: [slide, slide], autoplay: true }} />);
    expect(carousel.autoPlay).toBe(true);
    const toggle = getByRole('button');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(toggle);
    expect(carousel.autoPlay).toBe(false);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });

  it('is declared in twilight.json with a subline and a button label per slide', () => {
    const comp = (manifest.components as { path: string; fields: { id: string; fields?: { id: string }[] }[] }[]).find(
      (c) => c.path === 'home.hero'
    );
    const ids = comp?.fields.find((f) => f.id === 'slides')?.fields?.map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining(['slides.quote', 'slides.subtitle', 'slides.cta_label', 'slides.url']));
  });
});

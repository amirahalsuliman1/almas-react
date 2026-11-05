import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { PhotosSlider } from '../../../app/components/home/PhotosSlider';

const twilight = vi.hoisted(() => ({ settings: {} as Record<string, unknown> }));
vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({
  useTwilight: () => ({ theme: { settings: twilight.settings } }),
}));
vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale: 'ar' }),
}));
vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, children, className, ...rest }: { to: string; children?: React.ReactNode; className?: string }) => (
    <a href={to} className={className} {...rest}>
      {children}
    </a>
  ),
  Image: ({ alt, src, priority }: { alt?: string; src?: string; priority?: boolean }) => (
    <img alt={alt ?? ''} src={src ?? ''} data-priority={priority ? 'yes' : undefined} />
  ),
}));
// Only the two shared components the slider uses, not the whole barrel.
vi.mock('../../../app/components/common', async () => ({
  ScrollCarousel: (await import('../../../app/components/common/ScrollCarousel')).ScrollCarousel,
  SectionHeader: ({ title }: { title?: string }) => (title ? <h2>{title}</h2> : null),
}));

const items = [
  { url: '/photo1', image: 'photo1.jpg' },
  { url: '/photo2', image: { url: 'photo2.jpg', alt: 'إطلالة شتوية' } },
  { url: '/photo3', image: 'photo3.jpg' },
];

beforeEach(() => {
  twilight.settings = {};
  Element.prototype.scrollBy = vi.fn();
});

describe('PhotosSlider (Twig photos carousel)', () => {
  it('draws nothing without a photo', () => {
    expect(renderToString(<PhotosSlider data={{ items: [{ url: '/x' }] }} />)).toBe('');
  });

  it('links every photo where the merchant points it, in a row of slides', () => {
    const { container } = render(<PhotosSlider data={{ items }} />);
    const slides = container.querySelectorAll('a.photos-carousel__slide');
    expect([...slides].map((a) => a.getAttribute('href'))).toEqual(['/photo1', '/photo2', '/photo3']);
    expect(container.querySelector('.scroll-carousel__track.photos-carousel__track')).toBeTruthy();
  });

  it('asks for the first photo eagerly, and only that one', () => {
    const { container } = render(<PhotosSlider data={{ items }} />);
    expect(container.querySelectorAll('img[data-priority="yes"]')).toHaveLength(1);
    expect(container.querySelector('img')?.getAttribute('data-priority')).toBe('yes');
  });

  it('uses the alt text when there is one, and names the link by section and place when not', () => {
    twilight.settings = { photos_slider_title: 'تنسيقات جاهزة' };
    const { container } = render(<PhotosSlider data={{ items }} />);
    const slides = container.querySelectorAll('a.photos-carousel__slide');
    expect(slides[1].querySelector('img')?.getAttribute('alt')).toBe('إطلالة شتوية');
    expect(slides[1].getAttribute('aria-label')).toBeNull();
    expect(slides[0].getAttribute('aria-label')).toBe('تنسيقات جاهزة 1');
  });

  it("titles the section with the block's title, else the theme setting", () => {
    twilight.settings = { photos_slider_title: 'من الإعدادات' };
    expect(render(<PhotosSlider data={{ items }} />).container.querySelector('h2')?.textContent).toBe('من الإعدادات');
    expect(
      render(<PhotosSlider data={{ items, title: 'من القسم' }} />).container.querySelector('h2')?.textContent
    ).toBe('من القسم');
  });

  it('offers a pause button while it moves by itself, and none when autoplay is off or there is one photo', () => {
    const { container, unmount } = render(<PhotosSlider data={{ items }} />);
    const toggle = container.querySelector('.photos-carousel__autoplay-toggle')!;
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    unmount();
    expect(
      render(<PhotosSlider data={{ items, auto_play: false }} />).container.querySelector('.photos-carousel__autoplay-toggle')
    ).toBeNull();
    expect(
      render(<PhotosSlider data={{ items: [items[0]] }} />).container.querySelector('.photos-carousel__autoplay-toggle')
    ).toBeNull();
  });
});

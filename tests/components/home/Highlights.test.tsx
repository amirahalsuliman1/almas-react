import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { Highlights, SLIDE_MS } from '../../../app/components/home/Highlights';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale: 'ar' }),
}));
vi.mock('@salla.sa/twilight-theme-engine/hooks/useMoney', () => ({
  useMoney: () => ({ format: (n: number) => `${n} ر.س` }),
}));
const api = vi.hoisted(() => ({ find: vi.fn() }));
vi.mock('@salla.sa/twilight-theme-engine/api/product', () => ({ product: api }));
vi.mock('@salla.sa/twilight-theme-engine/utils/cdn-image', () => ({
  getCdnImageUrl: (url?: string) => url,
}));
vi.mock('../../../app/components/common/SectionHeader', () => ({
  SectionHeader: ({ title }: { title?: string }) => <h2>{title}</h2>,
}));

// jsdom has no <dialog> methods.
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  localStorage.clear();
  api.find.mockResolvedValue({ url: '/p/1', name: 'Pillow Talk', price: 450 });
});
afterEach(() => vi.useRealTimers());

const items = [
  { title: 'جديدنا', slide_1: '/s1.jpg', slide_2: '/s2.jpg', product: [{ id: 1 }], url: '/new' },
  { title: 'العروض', slide_1: '/o1.jpg' },
  { title: '', slide_1: '/x.jpg' },
  { title: 'بدون صور' },
];

describe('Highlights', () => {
  it('shows a circle only for a highlight with a title and a slide', () => {
    const { container } = render(<Highlights data={{ items }} />);
    expect(container.querySelectorAll('.highlights__bubble')).toHaveLength(2);
  });

  it('renders nothing with no usable highlight', () => {
    expect(renderToString(<Highlights data={{ items: [{ title: 'x' }] }} />)).toBe('');
  });

  it('names each circle by its highlight', () => {
    const { container } = render(<Highlights data={{ items }} />);
    expect(container.querySelector('.highlights__bubble')?.getAttribute('aria-label')).toContain('جديدنا');
  });

  it('opens the viewer on the first slide, and marks the circle seen', () => {
    const { container, getAllByRole } = render(<Highlights data={{ items }} />);
    fireEvent.click(getAllByRole('button')[0]);
    const dialog = container.querySelector('dialog.highlights__viewer');
    expect(dialog?.hasAttribute('open')).toBe(true);
    expect(container.querySelector('.highlights__slide')?.getAttribute('src')).toBe('/s1.jpg');
    expect(container.querySelector('.highlights__bubble')?.className).toContain('--seen');
  });

  it('moves on by itself after five seconds and closes after the last slide', () => {
    // The shared test setup reports every media query as matching, reduced motion included.
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({ ...original(q), matches: false })) as typeof window.matchMedia;
    vi.useFakeTimers();
    const { container, getAllByRole } = render(<Highlights data={{ items }} />);
    fireEvent.click(getAllByRole('button')[0]);
    act(() => vi.advanceTimersByTime(SLIDE_MS));
    expect(container.querySelector('.highlights__slide')?.getAttribute('src')).toBe('/s2.jpg');
    act(() => vi.advanceTimersByTime(SLIDE_MS));
    expect(container.querySelector('dialog')).toBeNull();
    window.matchMedia = original;
  });

  it('stands still under reduced motion', () => {
    vi.useFakeTimers();
    const { container, getAllByRole } = render(<Highlights data={{ items }} />);
    fireEvent.click(getAllByRole('button')[0]);
    act(() => vi.advanceTimersByTime(SLIDE_MS * 2));
    expect(container.querySelector('.highlights__slide')?.getAttribute('src')).toBe('/s1.jpg');
    expect(container.querySelector('.highlights__bar--static')).toBeTruthy();
  });

  it('closing returns focus to the circle that opened it', async () => {
    const { container, getAllByRole, getByLabelText } = render(<Highlights data={{ items }} />);
    const bubble = getAllByRole('button')[0];
    fireEvent.click(bubble);
    fireEvent.click(getByLabelText('Close'));
    expect(container.querySelector('dialog')).toBeNull();
    await act(() => new Promise((r) => window.requestAnimationFrame(() => r(undefined))));
    expect(document.activeElement).toBe(bubble);
  });

  it('shows «تسوّق» with the product name and price, and the link', async () => {
    const { container, getAllByRole, findByText } = render(<Highlights data={{ items }} />);
    fireEvent.click(getAllByRole('button')[0]);
    expect(await findByText('Pillow Talk')).toBeTruthy();
    expect(container.querySelector('.highlights__shop')?.getAttribute('href')).toBe('/p/1');
    expect(container.querySelector('.highlights__link')?.getAttribute('href')).toBe('/new');
  });
});

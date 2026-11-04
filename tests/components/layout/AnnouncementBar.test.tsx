import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { AnnouncementBar } from '../../../app/components/layout/AnnouncementBar';
import { dismissKey, DISMISSED_CLASS } from '../../../app/lib/announcement';

const theme = vi.hoisted(() => ({ settings: {} as Record<string, unknown> }));
vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({ useTwilight: () => ({ theme }) }));
vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale: 'ar' }),
}));

beforeEach(() => {
  theme.settings = { announcement_text: 'شحن مجاني فوق ٣٠٠ ريال' };
  localStorage.clear();
});
afterEach(() => document.documentElement.classList.remove(DISMISSED_CLASS));

describe('AnnouncementBar', () => {
  it('renders nothing without text, or when switched off', () => {
    theme.settings = {};
    expect(renderToString(<AnnouncementBar />)).toBe('');
    theme.settings = { announcement_enabled: false, announcement_text: 'x' };
    expect(renderToString(<AnnouncementBar />)).toBe('');
  });

  it('reads the sentence once: the loop copy is aria-hidden', () => {
    const { container } = render(<AnnouncementBar />);
    const texts = container.querySelectorAll('.announcement-bar__text');
    expect(texts).toHaveLength(2);
    expect(texts[0].getAttribute('aria-hidden')).toBeNull();
    expect(texts[1].getAttribute('aria-hidden')).toBe('true');
  });

  it('makes the text itself the link: one tab stop', () => {
    theme.settings = { announcement_text: 'العروض', announcement_url: 'https://am1als.com/offers' };
    const { container } = render(<AnnouncementBar />);
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('https://am1als.com/offers');
  });

  it('reads a per-language value', () => {
    theme.settings = { announcement_text: { ar: 'مرحبا', en: 'Hello' } };
    expect(render(<AnnouncementBar />).container.textContent).toContain('مرحبا');
  });

  it('closing hides it, remembers this text, and moves focus to the content', () => {
    theme.settings = { announcement_text: 'خصم', announcement_dismissible: true };
    const main = document.createElement('main');
    main.id = 'main-content';
    document.body.append(main);
    const { getByLabelText } = render(<AnnouncementBar />);
    fireEvent.click(getByLabelText('Close the announcement'));
    expect(document.documentElement.classList.contains(DISMISSED_CLASS)).toBe(true);
    expect(localStorage.getItem(dismissKey('خصم'))).toBe('1');
    expect(document.activeElement).toBe(main);
    main.remove();
  });

  it('ships the before-paint check only when the bar can be closed', () => {
    expect(renderToString(<AnnouncementBar />)).not.toContain('<script');
    theme.settings = { announcement_text: 'خصم', announcement_dismissible: true };
    expect(renderToString(<AnnouncementBar />)).toContain(dismissKey('خصم'));
  });

  it('a new text gets a new key, so it shows again', () => {
    expect(dismissKey('أ')).not.toBe(dismissKey('ب'));
  });
});

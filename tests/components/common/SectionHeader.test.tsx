import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SectionHeader } from '../../../app/components/common/SectionHeader';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));
vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Link: ({ to, className, children }: { to: string; className?: string; children?: React.ReactNode }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

describe('SectionHeader', () => {
  it('renders the title as the section heading, with the Twig-era class apps look for', () => {
    const { container } = render(<SectionHeader title="وصل حديثًا" />);
    const root = container.querySelector('.section-header');
    expect(root?.classList.contains('s-block__title')).toBe(true);
    expect(container.querySelector('h2.section-header__title')?.textContent).toBe('وصل حديثًا');
  });

  it('adds the subtitle under the title', () => {
    const { container } = render(<SectionHeader title="العروض" subtitle="لفترة محدودة" />);
    expect(container.querySelector('.section-header__subtitle')?.textContent).toBe('لفترة محدودة');
  });

  it('links «عرض الكل» with an arrow hidden from screen readers', () => {
    const { container } = render(<SectionHeader title="العروض" displayAllUrl="/offers" />);
    const link = container.querySelector('a.section-header__all');
    expect(link?.getAttribute('href')).toBe('/offers');
    expect(link?.classList.contains('s-block__display-all')).toBe(true);
    expect(link?.textContent).toContain('View All');
    expect(link?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('takes a custom link label', () => {
    const { container } = render(
      <SectionHeader title="العلامات" displayAllUrl="/brands" displayAllLabel="كل العلامات" />
    );
    expect(container.querySelector('a')?.textContent).toBe('كل العلامات');
  });

  it('renders nothing with neither a title nor a link', () => {
    expect(render(<SectionHeader />).container.innerHTML).toBe('');
  });
});

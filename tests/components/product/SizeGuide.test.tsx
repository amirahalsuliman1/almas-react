import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { SizeGuide, parseSizeGuide, showsSizeGuide } from '../../../app/components/product/SizeGuide';

const theme = vi.hoisted(() => ({ settings: {} as Record<string, unknown> }));
vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({ useTwilight: () => ({ theme }) }));
vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale: 'ar' }),
}));
vi.mock('../../../app/components/common', () => ({
  BottomSheet: ({ open, title, children }: { open: boolean; title?: string; children: React.ReactNode }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

const product = { id: 1, tags: [{ name: 'ملابس', url: '/t' }] } as never;

beforeEach(() => {
  theme.settings = {};
});

describe('SizeGuide', () => {
  it('reads «|» lines as the chart, its first line the header, the rest as notes', () => {
    expect(parseSizeGuide('المقاس | الصدر\nS | 86\r\nM | 90\nالقياس بالسنتيمتر')).toEqual({
      rows: [
        ['المقاس', 'الصدر'],
        ['S', '86'],
        ['M', '90'],
      ],
      notes: ['القياس بالسنتيمتر'],
    });
  });

  it('shows only with content, and only for the tagged products when a tag is named', () => {
    expect(showsSizeGuide({}, { tags: [] })).toBe(false);
    expect(showsSizeGuide({ size_guide_text: 'x' }, { tags: [] })).toBe(true);
    expect(showsSizeGuide({ size_guide_text: 'x', size_guide_tag: 'ملابس' }, { tags: [] })).toBe(false);
    expect(showsSizeGuide({ size_guide_text: 'x', size_guide_tag: 'ملابس' }, product)).toBe(true);
  });

  it('opens the chart in a sheet from its link, the merchant title on both', () => {
    theme.settings = { size_guide_text: 'المقاس | الصدر\nS | 86\nملاحظة', size_guide_title: 'جدول المقاسات' };
    const { getByRole, container } = render(<SizeGuide product={product} />);
    fireEvent.click(getByRole('button', { name: 'جدول المقاسات' }));
    const sheet = getByRole('dialog', { name: 'جدول المقاسات' });
    expect(sheet.querySelectorAll('thead th')).toHaveLength(2);
    expect(sheet.querySelector('tbody th')?.getAttribute('scope')).toBe('row');
    expect(container.querySelector('.size-guide__text')?.textContent).toBe('ملاحظة');
  });

  it('falls back to the translated title', () => {
    theme.settings = { size_guide_text: 'x' };
    const { getByRole } = render(<SizeGuide product={product} />);
    expect(getByRole('button').textContent).toBe('Size guide');
  });
});

import { useState } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { BottomSheet } from '../common';
import { safeImageUrl, textValue } from '../../lib/settings';

interface SizeGuideSettings {
  size_guide_image?: unknown;
  size_guide_text?: unknown;
  size_guide_title?: unknown;
  size_guide_tag?: unknown;
}

/** «|» lines are the chart (the first its header); every other line a note. */
export function parseSizeGuide(text: string): { rows: string[][]; notes: string[] } {
  const rows: string[][] = [];
  const notes: string[] = [];
  for (const line of text.replace(/\r/g, '').split('\n')) {
    if (line.includes('|')) rows.push(line.split('|').map((cell) => cell.trim()));
    else if (line.trim()) notes.push(line.trim());
  }
  return { rows, notes };
}

/** Whether the guide shows for this product: content set, and the product carries the tag when one is named. */
export function showsSizeGuide(settings: SizeGuideSettings, product: Pick<Product, 'tags'>, locale?: string): boolean {
  const hasContent = !!safeImageUrl(settings.size_guide_image) || !!textValue(settings.size_guide_text, locale);
  if (!hasContent) return false;
  const tag = textValue(settings.size_guide_tag, locale);
  return !tag || (product.tags ?? []).some((t) => t.name?.trim() === tag);
}

/**
 * Twig's size guide (R-19): a «دليل المقاسات» link under the options that opens
 * the shared sheet with the merchant's chart image and/or a table written in
 * the setting's text, one row a line with «|» between cells, any other line a
 * note. Shown for every product, or only those carrying `size_guide_tag`.
 * Salla's own per-product size guide (`has_size_guide`) is kept beside it.
 */
export function SizeGuide({ product }: { product: Product }) {
  const { t, locale } = useTranslation();
  const { theme } = useTwilight();
  const [open, setOpen] = useState(false);
  const settings = (theme?.settings ?? {}) as SizeGuideSettings;
  if (!showsSizeGuide(settings, product, locale)) return null;

  const title = textValue(settings.size_guide_title, locale) || t('theme.size_guide.title', 'Size guide');
  const image = safeImageUrl(settings.size_guide_image);
  const { rows, notes } = parseSizeGuide(textValue(settings.size_guide_text, locale));
  const [head, ...body] = rows;

  return (
    <>
      <button type="button" className="size-guide__trigger" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <i className="sicon-pencil-ruler" aria-hidden="true" />
        <span>{title}</span>
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={title} className="size-guide">
        {image && <img className="size-guide__image" src={image} alt={title} loading="lazy" decoding="async" />}
        {head && (
          <div className="size-guide__table-wrap">
            <table className="size-guide__table">
              <thead>
                <tr>
                  {head.map((cell, i) => (
                    <th key={i} scope="col">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, i) =>
                      i === 0 ? (
                        <th key={i} scope="row">
                          {cell}
                        </th>
                      ) : (
                        <td key={i}>{cell}</td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {notes.map((note, i) => (
          <p key={i} className="size-guide__text">
            {note}
          </p>
        ))}
      </BottomSheet>
    </>
  );
}

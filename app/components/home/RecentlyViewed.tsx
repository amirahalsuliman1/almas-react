import { useEffect, useState } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { ProductsSlider } from './ProductsSlider';
import { clampedInteger, textValue } from '../../lib/settings';
import { readRecentlyViewed } from '../../lib/recentlyViewed';

export interface RecentlyViewedProps {
  data: { title?: unknown; count?: unknown; [key: string]: unknown };
  /** A product to leave out — the one on screen, on the product page. */
  exclude?: unknown;
}

/**
 * `home.recently-viewed` — «شاهدته مؤخراً» (R-18), Twig's: the products this
 * visitor opened, newest first, in the same panelled product row as the rest
 * of Home (Twig's card, title and arrows). The list lives in the visitor's own
 * browser (lib/recentlyViewed.ts), so it is read after hydration and the
 * server renders nothing; with no history, or none the store still has, the
 * section does not appear at all.
 */
export function RecentlyViewed({ data, exclude }: RecentlyViewedProps) {
  const { locale } = useTranslation();
  const [ids, setIds] = useState<number[] | null>(null);
  const count = clampedInteger(data.count, 1, 20, 8);

  useEffect(() => {
    const skip = exclude == null ? null : String(exclude);
    setIds(
      readRecentlyViewed()
        .filter((id) => id !== skip)
        .slice(0, count)
        .map(Number)
        .filter((id) => Number.isFinite(id))
    );
  }, [count, exclude]);

  if (!ids?.length) return null;

  return (
    <div className="recently-viewed">
      <ProductsSlider
        data={{
          title: textValue(data.title, locale),
          products: { source: 'selected', source_value: ids },
          limit: count,
        }}
      />
    </div>
  );
}

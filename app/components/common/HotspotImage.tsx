import { useId, useRef, useState } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { getCdnImageSrcSet, getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { ProductPill, useProducts } from './ProductPill';

export interface HotspotPoint {
  /** Percent of the image's width from its inline start, 0–100. Never pixels. */
  x: number;
  /** Percent of the image's height from its top, 0–100. */
  y: number;
  productId: string | null;
}

export interface HotspotImageProps {
  image: string;
  alt?: string;
  /** A small label laid over the photograph's corner. */
  caption?: string;
  /** `overlay`: the product cards over the photograph's foot. `list`: under it. */
  layout?: 'overlay' | 'list';
  points: HotspotPoint[];
  className?: string;
}

const clampPercent = (n: unknown) => Math.min(100, Math.max(0, Number(n) || 0));

/** Hotspot points from a collection whose items carry `x`, `y` and a product picker value. */
export function toHotspotPoints(
  items: { x?: unknown; y?: unknown; product?: unknown; product_id?: unknown }[] | undefined,
  pick: (raw: unknown) => string | null
): HotspotPoint[] {
  return (items ?? []).map((item) => ({
    x: clampPercent(item.x),
    y: clampPercent(item.y),
    productId: pick(item.product) ?? pick(item.product_id),
  }));
}

/**
 * THE shoppable image (R-11). One component for every shoppable photograph —
 * the Home lookbook, the stories and the product page; a second implementation
 * is a defect (CLAUDE.md, B6). A marker per point, placed by percentage so it
 * stays on its spot at every width, and a card per product with its name, price
 * in the accent and an add-to-cart button. A point whose product cannot be found
 * loses both its marker and its card. The cards are the non-visual equivalent:
 * each marker is named by its product and moves focus to its card.
 */
export function HotspotImage({ image, alt = '', caption, layout = 'overlay', points, className }: HotspotImageProps) {
  const { t } = useTranslation();
  const base = useId();
  const products = useProducts(points.map((p) => p.productId));
  const [current, setCurrent] = useState<number | null>(null);
  const pills = useRef<(HTMLLIElement | null)[]>([]);

  const shown = points
    .map((point, index) => ({ point, index, product: point.productId ? products[point.productId] : null }))
    .filter((p): p is { point: HotspotPoint; index: number; product: Product } => !!p.product);

  const pillId = (index: number) => `${base}-pill-${index}`;

  const focusPill = (index: number) => {
    setCurrent(index);
    const pill = pills.current[index];
    pill?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    pill?.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true });
  };

  return (
    <div className={`hotspot hotspot--${layout}${className ? ` ${className}` : ''}`}>
      <figure className="hotspot__figure">
        <img
          className="hotspot__image"
          src={getCdnImageUrl(image, { width: 900 })}
          srcSet={getCdnImageSrcSet(image, [450, 900, 1350])}
          sizes="(min-width: 1024px) 60vw, calc(100vw - 2 * var(--page-gutter, 16px))"
          alt={alt}
          width={900}
          height={1200}
          loading="lazy"
          decoding="async"
        />
        {shown.map(({ point, index, product }) => (
          <button
            key={index}
            type="button"
            className="hotspot__marker"
            style={{ '--x': `${point.x}%`, '--y': `${point.y}%` } as React.CSSProperties}
            aria-controls={pillId(index)}
            aria-label={t('theme.hotspot.marker_named', 'Show product: :name').replace(':name', product.name)}
            onClick={() => focusPill(index)}
          >
            <span className="hotspot__marker-dot" aria-hidden="true" />
          </button>
        ))}
        {caption && (
          <p className="hotspot__caption">
            <span dir="auto">{caption}</span>
          </p>
        )}
      </figure>

      {shown.length > 0 && (
        <ul className="hotspot__pills">
          {shown.map(({ index, product }) => (
            <ProductPill
              key={index}
              id={pillId(index)}
              className="hotspot__pill"
              product={product}
              current={current === index}
              itemRef={(el) => {
                pills.current[index] = el;
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

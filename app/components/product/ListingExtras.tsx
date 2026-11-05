import type { ReactNode } from 'react';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { getCdnImageSrcSet, getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { pickedUrl } from '../../lib/pickers';
import { safeImageUrl, textValue } from '../../lib/settings';

/**
 * The offers page's cover (R-20), Twig's: the merchant's `offer_banner`
 * edge to edge, fading to white at its foot, with the breadcrumb and the page
 * title over it. Without the setting the page keeps its plain title.
 */
export function ListingCover({ image, title, breadcrumb }: { image: string; title: ReactNode; breadcrumb?: ReactNode }) {
  return (
    <div className="listing-cover">
      <img
        className="listing-cover__image"
        src={getCdnImageUrl(image, { width: 1350 })}
        srcSet={getCdnImageSrcSet(image, [450, 900, 1350, 1920])}
        sizes="100vw"
        alt=""
        width={1920}
        height={900}
        fetchPriority="high"
        decoding="async"
      />
      <div className="listing-cover__overlay">
        <div className="container">
          {breadcrumb && <div className="listing-cover__breadcrumbs">{breadcrumb}</div>}
          <h1 className="listing-cover__title" id="page-main-title">
            {title}
          </h1>
        </div>
      </div>
    </div>
  );
}

/**
 * The merchant's listing banner (R-20), Twig's promo banner: one image, a 3:1
 * strip with rounded corners, linking where the merchant points it. On
 * category and other listings; never on offers (its own cover) or search.
 */
export function ListingBanner({
  settings,
  locale,
  fallbackLabel,
}: {
  settings: Record<string, unknown>;
  locale?: string;
  /** Names a linked banner whose image has no alt text, so the link is never unnamed. */
  fallbackLabel: string;
}) {
  const image = safeImageUrl(settings.listing_banner_image);
  if (!image) return null;
  const url = pickedUrl(settings.listing_banner_url);
  const alt = textValue(settings.listing_banner_alt, locale);
  const img = (
    <img
      className="promo-banner__image"
      src={getCdnImageUrl(image, { width: 1280 })}
      srcSet={getCdnImageSrcSet(image, [640, 1280, 1920])}
      sizes="(min-width: 1280px) 1248px, calc(100vw - 2 * var(--page-gutter, 16px))"
      alt={alt}
      width={1200}
      height={400}
      loading="lazy"
      decoding="async"
    />
  );
  return (
    <div className="promo-banner">
      {url ? (
        <Link to={url} className="promo-banner__link" aria-label={alt ? undefined : fallbackLabel}>
          {img}
        </Link>
      ) : (
        img
      )}
    </div>
  );
}

/**
 * How many filters the visitor has applied, as Twig counted its chips: every
 * ticked value of a list is one, a range (price) is one, a single value is one.
 */
export function appliedFilterCount(filters: unknown): number {
  if (!filters || typeof filters !== 'object') return 0;
  let count = 0;
  for (const value of Object.values(filters as Record<string, unknown>)) {
    if (Array.isArray(value)) count += value.filter((v) => v !== '' && v != null).length;
    else if (value && typeof value === 'object')
      count += Object.values(value).some((v) => v !== '' && v != null) ? 1 : 0;
    else if (value !== '' && value != null) count += 1;
  }
  return count;
}

/** Clears `<salla-filters id={id}>` through the component's own method. */
export function resetFilters(id: string) {
  const el = document.getElementById(id) as (HTMLElement & { resetFilters?: () => unknown }) | null;
  el?.resetFilters?.();
}

/**
 * The filters' heading, Twig's: «تصفية النتائج (3)» with a «إعادة تعيين» text
 * button beside it while anything is applied. The desktop column and the
 * phone sheet share it.
 */
export function FiltersHeading({
  title,
  countLabel,
  resetLabel,
  count,
  onReset,
  headingId,
}: {
  title: string;
  countLabel: string;
  resetLabel: string;
  count: number;
  onReset: () => void;
  headingId?: string;
}) {
  return (
    <div className="filters-heading">
      <h2 className="filters-heading__title" id={headingId}>
        {title}
        {count > 0 && <span className="filters-heading__count"> {countLabel}</span>}
      </h2>
      {count > 0 && (
        <button type="button" className="filters-reset" onClick={onReset}>
          {resetLabel}
        </button>
      )}
    </div>
  );
}

/**
 * The empty result, Twig's empty state: the platform's placeholder (icon and
 * sentence) on a card, with a way onward, so a search or a filter that finds
 * nothing is never a dead end.
 */
export function ListingEmpty({ message, actionLabel }: { message: string; actionLabel: string }) {
  return (
    <div className="empty-state listing-empty" data-testid="store-products-empty">
      <div className="no-content-placeholder">
        <span className="icon">
          <i className="sicon-shopping-bag" aria-hidden="true" />
        </span>
        <p>{message}</p>
        <Link to="/" className="empty-state__action">
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}

/**
 * `ItemList` for the products on screen (Twig's T-8.04 node). Twig built it in
 * the browser because its page had no products; here the route loads them, so
 * it is rendered with the page. Nothing when the list is empty, and every
 * entry has a name and a link. `<` is escaped so a name cannot close the tag.
 */
export function itemListJsonLd(products: { name?: unknown; url?: unknown }[]): string | null {
  const items = products
    .map((p) => ({ name: typeof p.name === 'string' ? p.name.trim() : '', url: typeof p.url === 'string' ? p.url : '' }))
    .filter((p) => p.name && p.url)
    .map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: p.url, name: p.name }));
  if (items.length === 0) return null;
  return JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: items }).replace(
    /</g,
    '\\u003c'
  );
}

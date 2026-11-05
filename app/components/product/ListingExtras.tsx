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

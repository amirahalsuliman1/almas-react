import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { createPortal } from 'react-dom';
import { ProductCard as EngineProductCard } from '@salla.sa/twilight-theme-engine/product';
import { useWishlist } from '@salla.sa/twilight-theme-engine/hooks/useWishlist';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { registerNativeBookingHook } from '../../lib/nativeBooking';
import { withImageFallback } from '../../lib/productImage';
import { WishlistHeartButton } from './WishlistHeartButton';

type ProductCardProps = ComponentProps<typeof EngineProductCard>;

/**
 * Thin wrapper over the engine `ProductCard`.
 *
 * After mount (and whenever the lazily-hydrated bits appear):
 *  - sets `display: none` inline on a vertical card's own image-corner
 *    wishlist button (a plain style mutation on an existing node — safe,
 *    unlike moving it; see below), and portals a theme-owned wishlist button
 *    into `.s-product-card-content-footer` instead. Hiding it inline rather
 *    than only through `04-components/product.scss` keeps this component
 *    correct on its own — that stylesheet's rule hides it too, from the
 *    first paint.
 *  - The engine's button is a React-owned node; physically moving it there
 *    with `appendChild` (the previous approach) left React still tracking it
 *    as a child of the image container, so on unmount (e.g. navigating away)
 *    React tried to `removeChild` it from a parent it was no longer inside,
 *    throwing `NotFoundError`. A portal keeps this button fully React-managed
 *    at its real DOM location instead.
 *  - sets `loader-position="center"` on the add-to-cart button (grid + list).
 * Portals a «وفّر ٪» badge onto the image of a product on sale.
 * A product with no photo shows the theme's placeholder, as the Twig card does
 * (the engine `Image` renders nothing without a `src`).
 * Inside the Salla app, a booking product's "Book now" fires `mobile::booking.open`
 * instead of opening the booking page (`lib/nativeBooking.ts`).
 * Styling: `04-components/product.scss`.
 */
export function ProductCard(props: ProductCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [footerEl, setFooterEl] = useState<HTMLElement | null>(null);
  const [imageEl, setImageEl] = useState<HTMLElement | null>(null);
  const saving = savingPercent(props.product);
  const { product, isPlaceholder } = useMemo(
    () => withImageFallback(props.product),
    [props.product]
  );

  useEffect(() => {
    registerNativeBookingHook();
    const root = ref.current;
    if (!root) return;

    const sync = () => {
      root.querySelectorAll<HTMLElement>('salla-add-product-button').forEach((el) => {
        // engine ships the card button fill="outline"; make it solid + centre its spinner
        el.setAttribute('fill', 'solid');
        el.setAttribute('loader-position', 'center');
      });

      const vertical = root.querySelector<HTMLElement>('.s-product-card-vertical');
      if (!vertical) return;

      const originalWishlistBtn = vertical.querySelector<HTMLElement>(
        '.s-product-card-image .s-product-card-wishlist-btn'
      );
      if (originalWishlistBtn) originalWishlistBtn.style.display = 'none';

      setFooterEl(vertical.querySelector<HTMLElement>('.s-product-card-content-footer'));
      setImageEl(vertical.querySelector<HTMLElement>('.s-product-card-image'));
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ display: 'contents' }}
      data-image-placeholder={isPlaceholder ? 'true' : undefined}
    >
      <EngineProductCard {...props} product={product} />
      {imageEl && saving !== null && createPortal(<SavingBadge percent={saving} />, imageEl)}
      {footerEl &&
        createPortal(
          // List responses send the id as a numeric string; the wishlist holds numbers.
          <FooterWishlistButton productId={Number(props.product.id)} />,
          footerEl
        )}
    </div>
  );
}

/**
 * The saving on a product on sale, as a whole percentage of its regular price,
 * or null when it is not on sale. The API never sends `discount_percentage`, so
 * it is computed (engine types, `Product.discount_percentage`).
 */
export function savingPercent(product: {
  is_on_sale?: boolean;
  regular_price?: unknown;
  sale_price?: unknown;
  price?: unknown;
}): number | null {
  if (!product?.is_on_sale) return null;
  const regular = Number(product.regular_price);
  const now = Number(product.sale_price ?? product.price);
  if (!(regular > 0) || !(now > 0) || now >= regular) return null;
  const percent = Math.round(((regular - now) / regular) * 100);
  return percent >= 1 ? percent : null;
}

/** «وفّر ٢٠٪» on the image's end corner (product.scss `.product-card__saving`). */
function SavingBadge({ percent }: { percent: number }) {
  const { t, locale } = useTranslation();
  // Arabic-Indic digits in Arabic, as the store prints its prices.
  const numberLocale = (locale || 'ar').startsWith('ar') ? 'ar-SA-u-nu-arab' : locale;
  const formatted = new Intl.NumberFormat(numberLocale, { style: 'percent' }).format(
    percent / 100
  );
  return (
    <span className="product-card__saving">
      {t('theme.product.save', 'Save')} {formatted}
    </span>
  );
}

/** Same button the engine renders for `horizontal`/`fullImage` layouts
 * (`ProductCardContent`, theme-engine) — reused here for `vertical`, which
 * the engine only ever places in the image corner. */
function FooterWishlistButton({ productId }: { productId: number }) {
  const { t } = useTranslation();
  const wishlist = useWishlist();
  const inWishlist = wishlist.has(productId);

  return (
    <WishlistHeartButton
      productId={productId}
      ariaLabel={t('pages.wishlist.toggle', 'Add or remove to wishlist')}
      pressed={inWishlist}
      className={`s-product-card-wishlist-btn animated ${inWishlist ? 's-product-card-wishlist-added pulse-anime' : 'not-added un-favorited'}`}
      onClick={() => wishlist.toggle(productId)}
    />
  );
}

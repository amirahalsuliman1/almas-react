import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { createPortal } from 'react-dom';
import { ProductCard as EngineProductCard } from '@salla.sa/twilight-theme-engine/product';
import { useWishlist } from '@salla.sa/twilight-theme-engine/hooks/useWishlist';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { registerNativeBookingHook } from '../../lib/nativeBooking';
import { stepCartLine, useCartQuantity } from '../../lib/cartLines';
import { canHover, hoverLookFrom, type HoverLook as HoverLookData } from '../../lib/hoverLook';
import { useQueryClient } from '@tanstack/react-query';
import { product as productApi } from '@salla.sa/twilight-theme-engine/api/product';
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
 *    onto the same corner instead (Twig's card, owner 2026-11-05), leaving
 *    the footer to the add-to-cart button alone. Hiding it inline rather
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
 * A product already in the cart shows Twig's «+ 1 −» stepper where its add
 * button was (R-05b), portalled into the card's footer; the engine's button
 * is hidden by product.scss while the stepper is there.
 * A product with no photo shows the theme's placeholder, as the Twig card does
 * (the engine `Image` renders nothing without a `src`).
 * Inside the Salla app, a booking product's "Book now" fires `mobile::booking.open`
 * instead of opening the booking page (`lib/nativeBooking.ts`).
 * Styling: `04-components/product.scss`.
 */
export function ProductCard(props: ProductCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [imageEl, setImageEl] = useState<HTMLElement | null>(null);
  const [footerEl, setFooterEl] = useState<HTMLElement | null>(null);
  const saving = savingPercent(props.product);
  const steppable = canStep(props.product, props.withoutAddButton);
  const inCart = useCartQuantity(props.product.id, steppable);
  // Read after mount: the server renders no hover look, and a phone never loads it.
  const [hoverable, setHoverable] = useState(false);
  useEffect(() => setHoverable(canHover()), []);
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

      setFooterEl(root.querySelector<HTMLElement>('.s-product-card-content-footer'));

      const vertical = root.querySelector<HTMLElement>('.s-product-card-vertical');
      if (!vertical) return;

      const originalWishlistBtn = vertical.querySelector<HTMLElement>(
        '.s-product-card-image .s-product-card-wishlist-btn'
      );
      if (originalWishlistBtn) originalWishlistBtn.style.display = 'none';

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
      {hoverable && imageEl && !props.product.donation && (
        <HoverLook
          productId={props.product.id}
          mainUrl={product.image?.url ?? null}
          imageEl={imageEl}
        />
      )}
      {imageEl &&
        createPortal(
          // List responses send the id as a numeric string; the wishlist holds numbers.
          <CornerWishlistButton productId={Number(props.product.id)} />,
          imageEl
        )}
      {footerEl &&
        inCart > 0 &&
        createPortal(
          <CardStepper productId={props.product.id} name={props.product.name} quantity={inCart} footer={footerEl} />,
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

/** The heart on the image's corner, as Twig's card has it (owner, 2026-11-05):
 * the theme's own button, so it is fully React-managed and keeps `data-id` for
 * wishlist apps, in place of the engine's (hidden in product.scss). */
function CornerWishlistButton({ productId }: { productId: number }) {
  const { t } = useTranslation();
  const wishlist = useWishlist();
  const inWishlist = wishlist.has(productId);

  return (
    <div className="product-card__heart">
      <WishlistHeartButton
        productId={productId}
      ariaLabel={t('pages.wishlist.toggle', 'Add or remove to wishlist')}
      pressed={inWishlist}
      className={`s-product-card-wishlist-btn animated ${inWishlist ? 's-product-card-wishlist-added pulse-anime' : 'not-added un-favorited'}`}
        onClick={() => wishlist.toggle(productId)}
      />
    </div>
  );
}

/**
 * Whether the card can show the in-cart stepper. Donations, bookings and
 * anything not for sale keep their own button: a stepper would step a line
 * that needs an amount or a date, or cannot be bought (Twig's `canStep`).
 */
export function canStep(
  product: { status?: unknown; type?: unknown; donation?: unknown },
  withoutAddButton?: boolean
): boolean {
  return (
    !withoutAddButton &&
    product?.status === 'sale' &&
    !product?.donation &&
    !['booking', 'donating', 'financial_support'].includes(String(product?.type))
  );
}

/**
 * «+ 1 −», Twig's in-cart state (owner, 2026-10-15): a product already in the
 * cart is stepped, not added again. Each step goes through Salla's own cart
 * actions; at one, «−» removes the line and the add button returns. The count
 * is a live region, so a step is announced. While a step is in flight the
 * buttons are `aria-disabled` rather than disabled, so focus stays on them.
 */
export function CardStepper({
  productId,
  name,
  quantity,
  footer,
}: {
  productId: unknown;
  name?: string;
  quantity: number;
  footer?: HTMLElement | null;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const step = (delta: number) => {
    if (busy) return;
    setBusy(true);
    const removing = quantity + delta < 1;
    stepCartLine(productId, delta).finally(() => {
      setBusy(false);
      // The stepper is gone once the line is: hand focus to the add button.
      if (removing)
        requestAnimationFrame(() =>
          footer?.querySelector<HTMLElement>('salla-add-product-button button, salla-add-product-button .s-button-element')?.focus()
        );
    });
  };

  return (
    <div
      className="product-card__stepper"
      role="group"
      aria-label={t('theme.product.cart_quantity_of', 'Quantity of :name in the cart').replace(':name', name ?? '')}
      aria-busy={busy || undefined}
    >
      <button
        type="button"
        className="product-card__step"
        aria-label={t('theme.product.cart_increase', 'Increase quantity')}
        aria-disabled={busy || undefined}
        onClick={() => step(1)}
      >
        <i className="sicon-add" aria-hidden="true" />
      </button>
      <span className="product-card__step-count" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        className="product-card__step"
        aria-label={
          quantity > 1
            ? t('theme.product.cart_decrease', 'Decrease quantity')
            : t('theme.cart.remove_item', 'Remove the product from the cart')
        }
        aria-disabled={busy || undefined}
        onClick={() => step(-1)}
      >
        <i className="sicon-minus" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * The hover look (R-05b part B), Twig's: from 1024px, on a pointer that
 * hovers, the product's second photo fades in over the first while the card is
 * hovered, and each colour with its own photo gets a swatch that previews it.
 * The details are fetched on the first hover through the engine's own product
 * query (cached, so opening the product is quicker too), once per product.
 *
 * Pointer-only polish: nothing here is focusable or in the accessibility tree,
 * and a phone or a keyboard sees the card exactly as before. The swatches sit
 * over the photo's foot rather than under the title (Twig's place), so the
 * row's height never changes on hover (zero layout shift).
 */
function HoverLook({
  productId,
  mainUrl,
  imageEl,
}: {
  productId: unknown;
  mainUrl: string | null;
  imageEl: HTMLElement;
}) {
  const queryClient = useQueryClient();
  const [look, setLook] = useState<HoverLookData | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const card = imageEl.closest<HTMLElement>('.s-product-card-entry') ?? imageEl;
    let cancelled = false;
    const load = () => {
      queryClient
        .fetchQuery(productApi.queries.detail(String(productId)))
        .then((details) => {
          if (!cancelled) setLook(hoverLookFrom(details as never, mainUrl));
        })
        .catch(() => {});
    };
    card.addEventListener('pointerenter', load, { once: true });
    return () => {
      cancelled = true;
      card.removeEventListener('pointerenter', load);
    };
  }, [imageEl, productId, mainUrl, queryClient]);

  if (!look || (!look.second && look.swatches.length === 0)) return null;
  const shown = preview ?? look.second;

  return createPortal(
    <>
      {shown && (
        <img
          className={`product-card__image-alt${preview ? ' is-previewing' : ''}`}
          src={shown}
          alt=""
          aria-hidden="true"
          decoding="async"
        />
      )}
      {look.swatches.length > 0 && (
        <ul className="product-card__swatches" aria-hidden="true">
          {look.swatches.map((swatch) => (
            <li
              key={`${swatch.color}-${swatch.image}`}
              className="product-card__swatch"
              style={{ ['--swatch' as string]: swatch.color }}
              title={swatch.name}
              onPointerEnter={() => setPreview(swatch.image)}
              onPointerLeave={() => setPreview(null)}
            />
          ))}
        </ul>
      )}
    </>,
    imageEl
  );
}

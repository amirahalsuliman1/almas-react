import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import { ProductCard, savingPercent } from '../../../app/components/product/ProductCard';
import { PRODUCT_IMAGE_PLACEHOLDER } from '../../../app/lib/productImage';

const wishlistState = { ids: [] as number[] };

// Mirrors the real engine's conditional: the image-corner wishlist button only
// renders for `!isHorizontal && !isFullImage` (theme-engine ProductCard.tsx) —
// a `layout` change on an already-mounted card unmounts just that button while
// its siblings (and the whole card) stay mounted.
vi.mock('@salla.sa/twilight-theme-engine/product', () => ({
  ProductCard: ({
    product,
    layout = 'vertical',
  }: {
    product: { id: number; name: string; image?: { url?: string } };
    layout?: string;
  }) => (
    <div
      className="s-product-card-vertical"
      data-testid="engine-card"
      data-image={product.image?.url}
    >
      <div className="s-product-card-image" data-testid="image">
        {layout !== 'horizontal' && (
          <button
            type="button"
            className="s-product-card-wishlist-btn"
            aria-label="engine wishlist"
          >
            {product.name}
          </button>
        )}
      </div>
      <div className="s-product-card-content-footer" data-testid="footer">
        <salla-add-product-button fill="outline" />
      </div>
    </div>
  ),
}));

vi.mock('@salla.sa/twilight-theme-engine/hooks/useWishlist', () => ({
  useWishlist: () => ({
    has: (id: number) => wishlistState.ids.includes(id),
    toggle: vi.fn((id: number) => {
      wishlistState.ids = wishlistState.ids.includes(id)
        ? wishlistState.ids.filter((x) => x !== id)
        : [...wishlistState.ids, id];
    }),
  }),
}));

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fallback?: string) => fallback ?? _k }),
}));

const product = { id: 42, name: 'Test product' } as never;

/** The theme's heart, portalled onto the image corner. */
const heartBtn = (getByTestId: (id: string) => HTMLElement) =>
  getByTestId('image').querySelector<HTMLButtonElement>('.product-card__heart button');

beforeEach(() => {
  wishlistState.ids = [];
  cleanup();
});

describe('ProductCard', () => {
  it('shows the placeholder, whole, for a product with no photo', () => {
    const { getByTestId } = render(<ProductCard product={product} />);
    const card = getByTestId('engine-card');
    expect(card.getAttribute('data-image')).toBe(PRODUCT_IMAGE_PLACEHOLDER);
    expect(card.parentElement?.hasAttribute('data-image-placeholder')).toBe(true);
  });

  it('leaves a product with a photo as it is', () => {
    const photo = { id: 1, name: 'Photo', image: { url: 'https://example.com/a.jpg' } } as never;
    const { getByTestId } = render(<ProductCard product={photo} />);
    const card = getByTestId('engine-card');
    expect(card.getAttribute('data-image')).toBe('https://example.com/a.jpg');
    expect(card.parentElement?.hasAttribute('data-image-placeholder')).toBe(false);
  });

  it("portals the theme's heart onto the image corner (Twig), leaving the footer to the add button", async () => {
    const { getByTestId, getByLabelText } = render(<ProductCard product={product} />);

    await waitFor(() => {
      expect(
        getByTestId('image').querySelector('.product-card__heart [aria-label="Add or remove to wishlist"]')
      ).toBeTruthy();
    });

    // The engine's own image-corner button is untouched — still inside the image container,
    // not moved (i.e. this is a style hide, not the old appendChild reparenting).
    expect(getByLabelText('engine wishlist').closest('.s-product-card-image')).toBeTruthy();
    expect(getByTestId('footer').querySelector('button')).toBeNull();
  });

  it('hides the engine image-corner button so only one wishlist control is visible', async () => {
    const { getByTestId, getByLabelText } = render(<ProductCard product={product} />);

    await waitFor(() => expect(getByLabelText('engine wishlist').style.display).toBe('none'));
    // The theme's portaled heart stays visible (no inline hide applied to it).
    expect(heartBtn(getByTestId)?.style.display).not.toBe('none');
  });

  it('toggles the wishlist through the portaled button without touching the engine node', async () => {
    const { getByTestId } = render(<ProductCard product={product} />);

    await waitFor(() => expect(heartBtn(getByTestId)).toBeTruthy());
    const footerBtn = heartBtn(getByTestId)!;
    footerBtn.click();

    expect(wishlistState.ids).toContain(42);
  });

  it('shows a saved product as added when the list sends its id as a string', async () => {
    wishlistState.ids = [42];
    const { getByTestId } = render(<ProductCard product={{ id: '42', name: 'Listed' } as never} />);

    await waitFor(() =>
      expect(heartBtn(getByTestId)?.className).toContain(
        's-product-card-wishlist-added'
      )
    );
    expect(heartBtn(getByTestId)?.getAttribute('aria-pressed')).toBe('true');
  });

  it('reports an unsaved product as not pressed', async () => {
    const { getByTestId } = render(<ProductCard product={product} />);

    await waitFor(() =>
      expect(heartBtn(getByTestId)?.getAttribute('aria-pressed')).toBe(
        'false'
      )
    );
  });

  it('marks the heart with the product id, as Twig does, so wishlist apps can find it', async () => {
    const { getByTestId } = render(<ProductCard product={product} />);

    await waitFor(() =>
      expect(heartBtn(getByTestId)?.getAttribute('data-id')).toBe('42')
    );
  });

  it('unmounts cleanly — no DOM-reparenting removeChild errors', async () => {
    const { getByTestId, unmount } = render(<ProductCard product={product} />);
    await waitFor(() => expect(heartBtn(getByTestId)).toBeTruthy());

    expect(() => unmount()).not.toThrow();
  });

  it('survives the engine unmounting its own conditional wishlist button on a layout change', async () => {
    // The old implementation physically moved the engine's image-corner button into the
    // footer with `appendChild`. React still believed it lived under `.s-product-card-image`,
    // so when a `layout` change made the engine stop rendering it there, React's reconciler
    // tried to `removeChild` it from that (no-longer-actual) parent and threw `NotFoundError`.
    const { getByTestId, rerender } = render(<ProductCard product={product} layout="vertical" />);
    await waitFor(() => expect(heartBtn(getByTestId)).toBeTruthy());

    expect(() => rerender(<ProductCard product={product} layout="horizontal" />)).not.toThrow();
  });

  it('puts a saving badge on the image of a product on sale', async () => {
    const { container } = render(
      <ProductCard
        product={{ id: 42, name: "Sale", is_on_sale: true, regular_price: 450, sale_price: 360, price: 360 } as never}
      />
    );
    await waitFor(() =>
      expect(container.querySelector('.s-product-card-image .product-card__saving')).toBeTruthy()
    );
    expect(container.querySelector('.product-card__saving')?.textContent).toMatch(/20|٢٠/);
  });

  it('shows no badge for a product at full price', async () => {
    const { container } = render(<ProductCard product={{ id: 42, name: "Sale", is_on_sale: false } as never} />);
    await waitFor(() => expect(container.querySelector('.s-product-card-image')).toBeTruthy());
    expect(container.querySelector('.product-card__saving')).toBeNull();
  });
});

describe('savingPercent', () => {
  it('is the whole-percent saving off the regular price', () => {
    expect(savingPercent({ is_on_sale: true, regular_price: 450, sale_price: 360 })).toBe(20);
    expect(savingPercent({ is_on_sale: true, regular_price: 600, price: 480 })).toBe(20);
  });

  it('is null off sale, without a regular price, or when nothing is saved', () => {
    expect(savingPercent({ is_on_sale: false, regular_price: 450, sale_price: 360 })).toBeNull();
    expect(savingPercent({ is_on_sale: true, regular_price: 0, sale_price: 10 })).toBeNull();
    expect(savingPercent({ is_on_sale: true, regular_price: 100, sale_price: 100 })).toBeNull();
    expect(savingPercent({ is_on_sale: true, regular_price: 1000, sale_price: 999 })).toBeNull();
  });
});


import { useEffect, useState } from 'react';
import type { Ref } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useMoney } from '@salla.sa/twilight-theme-engine/hooks/useMoney';
import { product as productApi } from '@salla.sa/twilight-theme-engine/api/product';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { SallaAddProductButton } from '@salla.sa/twilight-components-react/add-product-button';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { ShoppingBagIcon } from '../icons';

/**
 * Loads products by id, for the blocks that pick a product per point or per
 * slide (shoppable images, videos). A product that cannot be found maps to
 * null, so its point or slide can drop its product row.
 */
export function useProducts(ids: (string | null)[]): Record<string, Product | null> {
  const unique = [...new Set(ids.filter((id): id is string => !!id))];
  const key = unique.join(',');
  const [products, setProducts] = useState<Record<string, Product | null>>({});

  useEffect(() => {
    let live = true;
    Promise.allSettled(unique.map((id) => productApi.find(id))).then((results) => {
      if (!live) return;
      const found: Record<string, Product | null> = {};
      results.forEach((r, i) => {
        found[unique[i]] = r.status === 'fulfilled' && r.value?.name ? r.value : null;
      });
      setProducts(found);
    });
    return () => {
      live = false;
    };
    // `key` stands for `unique`, which is rebuilt every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return products;
}

function Prices({ product }: { product: Product }) {
  const { t } = useTranslation();
  const { format } = useMoney();
  // `price` may be either the regular or the sale price depending on the
  // response; the sale is decided by `is_on_sale` and a lower `sale_price`.
  const sale = Number(product.sale_price);
  const onSale = Boolean(product.is_on_sale && sale > 0 && sale < Number(product.regular_price));
  const now = onSale ? sale : Number(product.price);
  return (
    <span className="product-pill__prices">
      <span className="product-pill__price">{format(now)}</span>
      {onSale && (
        <span className="product-pill__price-was">
          <span className="sr-only">{t('theme.common.was_price', 'Was')} </span>
          {format(product.regular_price)}
        </span>
      )}
    </span>
  );
}

export interface ProductPillProps {
  product: Product;
  id?: string;
  current?: boolean;
  className?: string;
  itemRef?: Ref<HTMLLIElement>;
}

/**
 * A product in one row: thumbnail, name, price in the accent (sale and struck
 * regular price), and a 44px accent add button labelled with the product. The
 * one product row the shoppable images and the videos share.
 */
export function ProductPill({ product, id, current, className, itemRef }: ProductPillProps) {
  const { t } = useTranslation();
  return (
    <li
      ref={itemRef}
      id={id}
      className={`product-pill${className ? ` ${className}` : ''}`}
      aria-current={current ? 'true' : undefined}
    >
      <a className="product-pill__link" href={product.url}>
        <img
          className="product-pill__thumb"
          src={getCdnImageUrl(product.image?.url, { width: 160 }) ?? product.image?.url}
          alt=""
          width={72}
          height={72}
          loading="lazy"
          decoding="async"
        />
        <span className="product-pill__body">
          <span className="product-pill__name">{product.name}</span>
          <Prices product={product} />
        </span>
      </a>
      <SallaAddProductButton
        className="product-pill__buy"
        productId={product.id}
        productStatus={product.status}
        productType={product.type}
      >
        <span className="sr-only">
          {t('pages.products.add_to_cart', 'Add to cart')} — {product.name}
        </span>
        <ShoppingBagIcon aria-hidden="true" />
      </SallaAddProductButton>
    </li>
  );
}

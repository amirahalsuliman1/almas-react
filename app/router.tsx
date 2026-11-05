import { lazy } from 'react';
import { createRouter } from '@salla.sa/twilight-theme-engine/tanstack';
import { registry } from '@salla.sa/twilight-theme-engine';
import {
  registerHomeComponents,
  registerHomeComponentConfig,
  DefaultHomeComponents,
} from '@salla.sa/twilight-theme-engine/routes/home';
import { SliderSkeleton } from '@salla.sa/twilight-components-react';
import { routeTree } from './routeTree.gen';
import {
  Brands,
  CustomTestimonials,
  EnhancedSlider,
  FeaturedProducts,
  featuredProductsConfig,
  FixedProducts,
  Hero,
  Highlights,
  LatestProducts,
  Lookbook,
  MainLinks,
  Marquee,
  PhotosSlider,
  ProductsSlider,
  SliderProductsWithHeader,
  VideoCarousel,
  EnhancedSquareBanners,
  Stories,
  PartnerBanner,
  StoreFeatures,
} from './components/home';
import { Blog } from './components/home/Blog';
import {
  FeaturedProductsSpecialOffer,
  FeaturedProductsWithSpecialProduct,
} from './components/home/FeaturedProducts';
import { PhotosSliderWithText } from './components/home/PhotosSliderWithText';
import { registerThemeHooks } from './hooks';
import { ProductListSkeleton } from './components/product/ProductListSkeleton';

const ProductListPage = lazy(() =>
  import('./components/product/ProductListPage').then((m) => ({ default: m.ProductListPage }))
);

// Register theme-level hooks (AddProductToast, DigitalFilesSettings, etc.)
registerThemeHooks();

registry.register('product:list-page', ProductListPage);
registry.register('product:list-skeleton', ProductListSkeleton);

registerHomeComponents({
  ...DefaultHomeComponents,
  hero: Hero,
  highlights: Highlights,
  marquee: Marquee,
  lookbook: Lookbook,
  'video-carousel': VideoCarousel,
  stories: Stories,
  'partner-banner': PartnerBanner,
  // Salla's own section, drawn as Twig drew it (R-16).
  'store-features': StoreFeatures,
  brands: Brands,
  'enhanced-slider': EnhancedSlider,
  'custom-testimonials': CustomTestimonials,
  'main-links': MainLinks,
  'square-links': MainLinks,
  // Replaces the engine Swiper with the theme's scroll carousel (home block +
  // the product page's "similar products" `best-offers-<n>-slider`).
  'products-slider': ProductsSlider,
  // Replaces the engine Swiper with the theme's scroll carousel — same
  // progress bar + arrows as testimonials/products, cards instead of a thin
  // full-width banner strip.
  'photos-slider': PhotosSlider,
  'photos-slider-with-text': PhotosSliderWithText,
  // The renderer checks `home:featured-products:<view_style>` before the bare
  // key (theme-engine `HomePageRenderer.getComponentByPath`), and
  // `...DefaultHomeComponents` above still has the engine's own component
  // registered under the three literal `styleN` variants — leaving those out
  // here would mean only view_style-less / unrecognised blocks ever reach
  // this component, and every `style1`/`style2`/`style3` block keeps
  // rendering the broken engine variants this fork exists to replace.
  'featured-products': FeaturedProducts,
  'featured-products:style1': FeaturedProducts,
  'featured-products:style2': FeaturedProducts,
  'featured-products:style3': FeaturedProducts,
  // The block's other two layouts, each its own block.
  'featured-products-special-offer': FeaturedProductsSpecialOffer,
  'featured-products-special-product': FeaturedProductsWithSpecialProduct,
  // Fork of the engine block so its grid renders the theme's ProductCard wrapper.
  'fixed-products': FixedProducts,
  // Fork of the engine's no-blocks fallback, for the same reason.
  'latest-products': LatestProducts,
  'slider-products-with-header': SliderProductsWithHeader,
  'enhanced-square-banners': EnhancedSquareBanners,
  blog: Blog,
});

// Wrapper `<section>` classes for `featured-products` — the engine only styles
// the literal `styleN` values; this covers the semantic `view_style`s too.
// `custom-testimonials` sits in Twig's section panel (section-panel.scss).
registerHomeComponentConfig({
  // Always the first block: rendered at once, no reservation needed.
  hero: { className: 's-block s-block--hero' },
  // One row of 76px circles and their names.
  highlights: { className: 's-block s-block--highlights', height: '7.5rem' },
  // One line of text at text-base with its padding.
  marquee: { className: 's-block s-block--marquee', height: '3.25rem' },
  // Usually below the fold, so it mounts on scroll: reserve a 4:5 photograph,
  // its header and about three product cards on a phone, capped at the
  // desktop row's height. Measured: 829px at 393 wide with three points.
  lookbook: { className: 's-block s-block--lookbook', height: 'min(calc(125vw + 18rem), 50rem)' },
  // A 9:14 frame plus its product row, at the phone width of one slide.
  'video-carousel': { className: 's-block s-block--video-carousel', height: 'min(calc(82vw * 14 / 9 + 10rem), 46rem)' },
  // Two rows of 3:4 photographs with their tags under the header on a phone;
  // from 1024px the feed is a 31rem window under its header.
  stories: { className: 's-block s-block--stories', height: 'min(calc(122vw + 9rem), 36rem)' },
  // A 4:5 photograph on a phone; 31:15 of the container from 768px (604px at 1440).
  'partner-banner': { className: 's-block s-block--partner-banner', height: 'min(calc(125vw - 2.5rem), 38rem)' },
  // Three features: a list of three rows on a phone, one row of columns from
  // 768px. Measured 298px at 393, 273px at 820, 263px at 1440.
  'store-features': { className: 's-block s-block--store-features', height: 'max(16.5rem, calc(18.75rem - 2.5vw))' },
  'featured-products': featuredProductsConfig,
  'featured-products-special-offer': featuredProductsConfig,
  'featured-products-special-product': featuredProductsConfig,
  // Gray band edge to edge; the height is a card plus the heading and controls.
  blog: {
    className: 's-block s-block--blog s-block--full-bg',
    height: 'clamp(480px, 45vw, 660px)',
  },
  // The band with its header and a row of cards: measured 394px at 393 wide
  // and 436px at 1440 (R-15); the text is clamped to five lines, so it holds.
  'custom-testimonials': {
    className: 's-block s-block--custom-testimonials',
    height: 'clamp(24.5rem, 30vw, 27.25rem)',
  },
  // Lazy placements (blocks 4+): reserve the loaded blocks' height and show the
  // same SliderSkeleton the SSR path shows (sized in home-blocks.scss), not the
  // engine's 400px/200px defaults with mismatched skeletons (CLS on scroll-in).
  'enhanced-slider': {
    height: 'calc(100vw / 2.4)', // the 12:5 slide ratio
    placeholder: <SliderSkeleton />,
    // The boxed variant (`in_container`) is capped at the container width, so
    // its skeleton must be too (home-blocks.scss) or the reservation oversizes.
    className: (data) =>
      `s-block s-block--enhanced-slider${data.in_container ? ' s-block--enhanced-slider-boxed' : ''}`,
  },
  'main-links': {
    height: '112px',
    placeholder: <SliderSkeleton />,
    // Keeps the engine entry's merge classes; theme config replaces, not merges.
    className: (data) => {
      const mergeWithTop = data.merge_links_with_top_component;
      return [
        's-block',
        's-block--main-links',
        mergeWithTop && data.position ? 'merge-with-top-component' : '',
        !data.title && mergeWithTop ? 'merged-has-no-title' : '',
      ]
        .filter(Boolean)
        .join(' ');
    },
  },
  'square-links': {
    height: '144px', // .slide--cat-entry h-36 cards (square-links keeps the card look)
    placeholder: <SliderSkeleton />,
  },
  // Twig's panel: its title and a row of 300:361 photographs (78% wide on a
  // phone, three to a row from 1024px), so the real row doesn't shift the page.
  'photos-slider': {
    height: 'min(calc(80vw + 5rem), 33rem)', // measured 396px at 393, 524px at 1440
    placeholder: <SliderSkeleton />,
    className: (data) =>
      `s-block s-block--photos-slider${data.is_repeated ? ' repeated-block' : ''}`,
  },
  'photos-slider-with-text': {
    height: 'clamp(300px, 36vw, 470px)', // a card plus the controls row
    placeholder: <SliderSkeleton />,
    className: (data) =>
      `s-block s-block--photos-slider-with-text${data.in_container ? ' s-block--photos-slider-with-text-boxed' : ''}`,
  },
});

// Singleton for client-side (preserves QueryClient cache across navigations)
// SSR creates fresh instances per request via getRouter()
let clientRouter: ReturnType<typeof createRouter> | null = null;

// TanStack Start expects getRouter() for SSR compatibility
export function getRouter() {
  // On client: reuse existing router to preserve QueryClient cache
  if (typeof window !== 'undefined' && clientRouter) {
    return clientRouter;
  }

  // On SSR or first client load: create new router
  const router = createRouter(routeTree);

  // Cache for client-side
  if (typeof window !== 'undefined') {
    clientRouter = router;
  }

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

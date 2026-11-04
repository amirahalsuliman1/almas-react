import { useState } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { getCdnImageSrcSet, getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { ScrollCarousel } from '../common';
import { textValue } from '../../lib/settings';

export interface HeroSlide {
  image?: string;
  image_desktop?: string;
  alt?: unknown;
  /** The headline. Kept as `quote`, its Twig id, so a store's slides carry over. */
  quote?: unknown;
  subtitle?: unknown;
  cta_label?: unknown;
  url?: string;
  strip_start?: unknown;
  strip_center?: unknown;
  strip_end?: unknown;
}

export interface HeroProps {
  data: {
    slides?: HeroSlide[];
    autoplay?: boolean;
    quote_hearts?: boolean;
  };
}

const MOBILE_WIDTHS = [450, 900, 1350] as const;
const DESKTOP_WIDTHS = [800, 1200, 1600] as const;

/** The two hand-drawn hearts around the headline (decoration, currentColor). */
function Hearts() {
  return (
    <>
      <svg className="hero__heart hero__heart--small" viewBox="0 0 44.8 35.8" aria-hidden="true" focusable="false">
        <path
          d="M11.74 2.99C20.99 3.47 20.25 16.85 20.7 17.12C21.15 17.4 32.95 8.76 37.62 14.32C42.29 19.88 14.85 33.27 13.78 31.49C9.49 24.33 2.5 2.5 11.74 2.99Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      <svg className="hero__heart hero__heart--large" viewBox="0 0 96.8 73.2" aria-hidden="true" focusable="false">
        <path
          d="M20.08 24.03C35.65 12.24 52.65 34.82 53.76 34.66C54.86 34.49 62.15 4.5 77.25 7.13C92.34 9.75 66.28 68.67 62.13 67.25C45.46 61.54 4.5 35.81 20.08 24.03Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
    </>
  );
}

function Slide({
  slide,
  first,
  hearts,
  locale,
  shopNow,
}: {
  slide: HeroSlide;
  first: boolean;
  hearts: boolean;
  locale?: string;
  shopNow: string;
}) {
  const headline = textValue(slide.quote, locale);
  const subtitle = textValue(slide.subtitle, locale);
  const url = slide.url?.trim();
  const cta = url ? textValue(slide.cta_label, locale) || shopNow : '';
  const strip = [slide.strip_start, slide.strip_center, slide.strip_end].map((v) => textValue(v, locale));
  const hasStrip = strip.some(Boolean);
  const HeadlineTag = first ? 'h2' : 'p';

  return (
    <div className="hero__slide">
      <picture className="hero__media">
        {slide.image_desktop && (
          <source
            media="(min-width: 1024px)"
            srcSet={getCdnImageSrcSet(slide.image_desktop, DESKTOP_WIDTHS)}
            sizes="(min-width: 1280px) 720px, 58vw"
            width={1240}
            height={800}
          />
        )}
        <img
          className="hero__image"
          src={getCdnImageUrl(slide.image, { width: 900 })}
          srcSet={getCdnImageSrcSet(slide.image, MOBILE_WIDTHS)}
          sizes="(min-width: 1024px) 58vw, calc(100vw - 2 * var(--page-gutter, 16px))"
          alt={textValue(slide.alt, locale)}
          width={900}
          height={1260}
          loading={first ? 'eager' : 'lazy'}
          fetchPriority={first ? 'high' : 'auto'}
          decoding="async"
        />
      </picture>
      <span className="hero__scrim" aria-hidden="true" />

      {(headline || subtitle || cta || hasStrip) && (
        <div className="hero__content">
          {headline && (
            <HeadlineTag className={`hero__headline${hearts ? ' hero__headline--hearts' : ''}`}>
              {headline}
              {hearts && <Hearts />}
            </HeadlineTag>
          )}
          {subtitle && <p className="hero__subtitle">{subtitle}</p>}
          {cta && url && (
            <a className="hero__cta" href={url}>
              {cta}
            </a>
          )}
          {hasStrip && (
            <ul className="hero__strip">
              {strip.map((item, i) => (
                <li key={i} className="hero__strip-item">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * `home.hero` — the first screen (R-07, REDESIGN-2026-11.md). Each slide has a
 * headline, a subline and a filled accent «تسوق الآن» the merchant names and
 * links. On a phone the copy sits over the bottom of the photograph; from
 * 1024px the photograph and the copy share the row, so neither crowds the
 * other — Salla's review found the old hero all image, no headline, no CTA.
 *
 * Several slides scroll in the theme's ScrollCarousel. Autoplay is off by
 * default; when on, a pause button stops it (WCAG 2.2.2), and reduced motion
 * stops it too. The first slide's image is the page's LCP: eager, high priority.
 */
export function Hero({ data }: HeroProps) {
  const { t, locale } = useTranslation();
  const slides = (data.slides ?? []).filter((slide) => slide.image);
  const [paused, setPaused] = useState(false);
  if (!slides.length) return null;

  const hearts = data.quote_hearts !== false;
  const shopNow = t('theme.hero.shop_now', 'Shop now');
  const rendered = slides.map((slide, i) => (
    <Slide key={i} slide={slide} first={i === 0} hearts={hearts} locale={locale} shopNow={shopNow} />
  ));

  if (slides.length === 1) return <div className="hero">{rendered}</div>;

  const autoplay = data.autoplay === true;
  return (
    <div className="hero hero--carousel">
      <ScrollCarousel
        className="hero__track"
        prevLabel={t('theme.hero.previous', 'Previous slide')}
        nextLabel={t('theme.hero.next', 'Next slide')}
        autoPlay={autoplay && !paused}
      >
        {rendered}
      </ScrollCarousel>
      {autoplay && (
        <button
          type="button"
          className="hero__autoplay-toggle"
          aria-pressed={paused}
          aria-label={
            paused
              ? t('theme.common.play_autoplay', 'Play the slideshow')
              : t('theme.common.pause_autoplay', 'Pause the slideshow')
          }
          onClick={() => setPaused((p) => !p)}
        >
          <span aria-hidden="true">{paused ? '▶' : '❚❚'}</span>
        </button>
      )}
    </div>
  );
}

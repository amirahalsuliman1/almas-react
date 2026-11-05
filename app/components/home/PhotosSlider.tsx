import { memo, useState } from 'react';
import { Link, Image } from '@salla.sa/twilight-theme-engine/common';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { ScrollCarousel, SectionHeader } from '../common';
import { textValue } from '../../lib/settings';

interface PhotoItem {
  id?: string | number;
  url?: string;
  link_type?: string;
  /** A URL, or `{ url, alt }` as Twig's `items[].image` documents it. */
  image?: string | { url?: string; alt?: unknown };
  alt?: unknown;
}

export interface PhotosSliderProps {
  data: {
    items?: PhotoItem[];
    title?: unknown;
    position?: number;
    is_repeated?: boolean;
    /** Moving on by itself. On unless switched off; reduced motion stops it. */
    auto_play?: boolean;
    [key: string]: unknown;
  };
}

const imageUrl = (item: PhotoItem) => (typeof item.image === 'string' ? item.image : item.image?.url) ?? '';

/**
 * `photos-slider` — «تنسيقات جاهزة», Twig's photos carousel (owner,
 * 2026-11-05): the section panel, its title, and a row of rounded 300:361
 * photographs, three to a row from 1024px with Twig's frosted arrows, each one
 * linking where the merchant points it. The row moves on by itself unless the
 * block turns that off; a pause button stops it (WCAG 2.2.2), and so do hover,
 * focus and reduced motion (ScrollCarousel). A photo with no alt text is named
 * by the section and its place, so no link is left without a name.
 */
export const PhotosSlider = memo(function PhotosSlider({ data }: PhotosSliderProps) {
  const { t, locale } = useTranslation();
  const { theme } = useTwilight();
  const [paused, setPaused] = useState(false);
  const items = (data.items ?? []).filter((item) => imageUrl(item));
  if (!items.length) return null;

  // The platform owns this block's fields: its own title wins, else the theme's
  // `photos_slider_title` setting; neither, no heading.
  const settings = (theme?.settings ?? {}) as { photos_slider_title?: unknown };
  const title = textValue(data.title, locale) || textValue(settings.photos_slider_title, locale);
  const autoPlay = items.length > 1 && data.auto_play !== false;

  return (
    <div className="photos-carousel">
      <ScrollCarousel
        navPlacement="sides"
        className="photos-carousel__track"
        heading={title ? <SectionHeader title={title} /> : undefined}
        prevLabel={t('blocks.home.reviews_prev', 'Previous')}
        nextLabel={t('blocks.home.reviews_next', 'Next')}
        autoPlay={autoPlay && !paused}
      >
        {items.map((item, index) => {
          const alt = textValue(item.alt ?? (typeof item.image === 'object' ? item.image?.alt : undefined), locale);
          return (
            <Link
              // Positions in a static settings list, whose items may repeat or have no id.
              // react-doctor-disable-next-line react-doctor/no-array-index-as-key
              key={`${index}-${imageUrl(item)}`}
              to={item.url || '#'}
              className="photos-carousel__slide"
              aria-label={alt ? undefined : `${title || t('blocks.home.photos', 'Photos')} ${index + 1}`}
            >
              <Image
                src={imageUrl(item)}
                alt={alt}
                width={600}
                height={722}
                priority={index === 0}
                draggable={false}
              />
            </Link>
          );
        })}
      </ScrollCarousel>
      {autoPlay && (
        <button
          type="button"
          className="photos-carousel__autoplay-toggle"
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
});

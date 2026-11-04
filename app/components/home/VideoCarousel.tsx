import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { ScrollCarousel } from '../common';
import { SectionHeader } from '../common/SectionHeader';
import { ProductPill, useProducts } from '../common/ProductPill';
import { pickedProductId } from '../../lib/pickers';
import { textValue } from '../../lib/settings';
import { safeVideoUrl, toEmbed } from '../../lib/videoEmbed';

interface VideoItem {
  embed_url?: unknown;
  /** The publisher's name, shown over the video's top. Twig's id, kept. */
  poster?: unknown;
  product?: unknown;
}

export interface VideoCarouselProps {
  data: { title?: unknown; items?: VideoItem[] };
}

/** How far ahead of the screen a player is mounted. */
const MOUNT_MARGIN = '200px';

/**
 * One video. The player mounts as the slide nears the screen, so a page with
 * videos below the fold loads none of them up front; the frame's shape is set
 * in CSS, so nothing moves when it arrives. A direct file that fails to play
 * takes its slide away.
 */
function VideoFrame({ url, title, onFail }: { url: string; title: string; onFail: () => void }) {
  const frame = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: MOUNT_MARGIN }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const embed = toEmbed(url);
  return (
    <div ref={frame} className="video-carousel__frame">
      {near &&
        (embed ? (
          <iframe
            className="video-carousel__embed"
            src={embed}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <video
            className="video-carousel__embed"
            src={url}
            controls
            playsInline
            preload="metadata"
            aria-label={title}
            onError={onFail}
          />
        ))}
    </div>
  );
}

/**
 * `home.video-carousel` — shoppable videos (R-12). Each slide plays its video
 * in the page (the owner's ruling, 2026-10-12: no cover) with the publisher's
 * name over its top, and the product it shows underneath as the shared product
 * row. The section has a title, the merchant's.
 */
export function VideoCarousel({ data }: VideoCarouselProps) {
  const { t, locale } = useTranslation();
  const [failed, setFailed] = useState<number[]>([]);
  const items = (data.items ?? [])
    .map((item, index) => ({
      index,
      url: safeVideoUrl(item.embed_url),
      publisher: textValue(item.poster, locale),
      productId: pickedProductId(item.product),
    }))
    .filter((item): item is typeof item & { url: string } => !!item.url && !failed.includes(item.index));
  const products = useProducts(items.map((i) => i.productId));
  if (!items.length) return null;

  const slides = items.map((item) => {
    const product = item.productId ? products[item.productId] : null;
    const title = item.publisher
      ? t('theme.video.frame_title_named', 'Video :name').replace(':name', item.publisher)
      : t('theme.video.frame_title', 'Video');
    return (
      <div key={item.index} className="video-carousel__slide">
        <div className="video-carousel__media">
          <VideoFrame url={item.url} title={title} onFail={() => setFailed((f) => [...f, item.index])} />
          {item.publisher && (
            <p className="video-carousel__publisher">
              <bdi>{item.publisher}</bdi>
            </p>
          )}
        </div>
        {product && (
          <ul className="video-carousel__product">
            <ProductPill product={product} />
          </ul>
        )}
      </div>
    );
  });

  const title = textValue(data.title, locale);
  return (
    <div className={`video-carousel${items.length === 1 ? ' video-carousel--single' : ''}`}>
      {title && <SectionHeader title={title} />}
      {items.length === 1 ? (
        slides
      ) : (
        <ScrollCarousel
          className="video-carousel__track"
          prevLabel={t('blocks.home.reviews_prev', 'Previous')}
          nextLabel={t('blocks.home.reviews_next', 'Next')}
        >
          {slides}
        </ScrollCarousel>
      )}
    </div>
  );
}

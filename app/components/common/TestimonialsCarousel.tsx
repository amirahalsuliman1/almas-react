import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { QuoteIcon, StarIcon } from '../icons';
import { ScrollCarousel } from './ScrollCarousel';
import { SectionHeader } from './SectionHeader';

export interface TestimonialItem {
  avatar?: string;
  name?: string;
  text?: string;
  stars?: number;
}

const MAX_STARS = 5;
const STAR_POSITIONS = Array.from({ length: MAX_STARS }, (_, position) => position + 1);

function TestimonialCard({ item }: { item: TestimonialItem }) {
  const { t } = useTranslation();
  const name = item.name?.trim();
  const stars = Math.max(0, Math.min(MAX_STARS, Math.round(Number(item.stars ?? 0))));

  return (
    <figure className="testimonial-card">
      <div className="testimonial-card__head">
        <QuoteIcon className="testimonial-card__quote" aria-hidden="true" />
        {stars > 0 && (
          <span className="testimonial-card__stars">
            {/* One sentence for a screen reader; the row of stars is for the eye. */}
            <span className="sr-only">
              {t('theme.testimonials.rating', 'Rated :stars out of 5').replace(':stars', String(stars))}
            </span>
            {STAR_POSITIONS.map((position) => (
              <StarIcon key={position} className={position <= stars ? 'is-on' : undefined} aria-hidden="true" />
            ))}
          </span>
        )}
      </div>

      <blockquote className="testimonial-card__text">
        <p dir="auto">{item.text}</p>
      </blockquote>

      {(name || item.avatar) && (
        <figcaption className="testimonial-card__person">
          {item.avatar ? (
            // The name is written beside it, so the photo adds nothing to read out.
            <img
              className="testimonial-card__avatar"
              src={item.avatar}
              alt=""
              width={44}
              height={44}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          ) : (
            name && (
              <span className="testimonial-card__avatar is-initial" aria-hidden="true">
                {name.charAt(0)}
              </span>
            )
          )}
          {name && (
            <b className="testimonial-card__name">
              <bdi>{name}</bdi>
            </b>
          )}
        </figcaption>
      )}
    </figure>
  );
}

export interface TestimonialsCarouselProps {
  items: TestimonialItem[];
  /** Empty draws no header (the arrows still sit on their own line). */
  title?: string;
  description?: string;
}

/**
 * Customer reviews as whole cards in the shared {@link ScrollCarousel}: three in
 * the container on desktop, with the arrows beside the title and none at all when
 * every review fits. Used by the `custom-testimonials` home block
 * ({@link CustomTestimonials}), under the shared section header (R-15).
 * Styling: `04-components/home-blocks.scss` (`.s-testimonials` / `.testimonial-card`).
 */
export function TestimonialsCarousel({ items, title, description }: TestimonialsCarouselProps) {
  const { t } = useTranslation();

  if (!items.length) return null;

  return (
    <div className="s-testimonials container">
      <ScrollCarousel
        heading={(title || description) && <SectionHeader className="s-testimonials__head" title={title} subtitle={description} />}
        prevLabel={t('blocks.home.reviews_prev', 'Previous')}
        nextLabel={t('blocks.home.reviews_next', 'Next')}
      >
        {items.map((item, index) => (
          // A static settings list whose items have no id: see
          // .react-doctor/false-positives.md.
          // react-doctor-disable-next-line react-doctor/no-array-index-as-key
          <TestimonialCard key={`${index}-${item.name ?? ''}`} item={item} />
        ))}
      </ScrollCarousel>
    </div>
  );
}

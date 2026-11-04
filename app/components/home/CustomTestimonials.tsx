import { memo } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { TestimonialsCarousel, type TestimonialItem } from '../common';
import { textValue } from '../../lib/settings';

export interface CustomTestimonialsProps {
  data: {
    items: TestimonialItem[];
    title?: unknown;
    description?: unknown;
    position?: number;
    [key: string]: unknown;
  };
}

/**
 * `custom-testimonials` home block — merchant-authored reviews (R-15) in the
 * shared {@link TestimonialsCarousel}, on the section surface so the band reads
 * apart from its neighbours. The title and the line are the merchant's: a
 * cleared title hides the header, while a block saved before the title field
 * existed keeps the translated «آراء عملائنا» rather than going untitled.
 */
export const CustomTestimonials = memo(function CustomTestimonials({
  data,
}: CustomTestimonialsProps) {
  const { t, locale } = useTranslation();
  const { items } = data;

  if (!items?.length) return null;

  const title =
    data.title === undefined ? t('blocks.home.testimonials', 'Customer reviews') : textValue(data.title, locale);

  return (
    <TestimonialsCarousel items={items} title={title} description={textValue(data.description, locale)} />
  );
});

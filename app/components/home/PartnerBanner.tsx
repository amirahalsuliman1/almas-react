import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { getCdnImageSrcSet, getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { pickedUrl } from '../../lib/pickers';
import { textValue } from '../../lib/settings';

export interface PartnerBannerProps {
  data: {
    image?: unknown;
    alt?: unknown;
    title?: unknown;
    subtitle?: unknown;
    brand_label?: unknown;
    brand_url?: unknown;
    individual_label?: unknown;
    individual_url?: unknown;
  };
}

/**
 * `home.partner-banner` — «انضم كبراند / انضم كفرد» (R-14). One photograph with
 * a title, a line and two buttons centred over it on a veil that keeps white
 * text readable on a pale picture. Both destinations are the merchant's link
 * fields — a theme cannot know where the partner page or the WhatsApp chat is
 * (owner, 2026-10-14) — so a button with no link is not drawn, and a banner
 * with no image or no link at all draws nothing. No form here: Salla has no
 * path to carry one (OP-13).
 */
export function PartnerBanner({ data }: PartnerBannerProps) {
  const { t, locale } = useTranslation();
  const image = typeof data.image === 'string' ? data.image.trim() : '';
  const actions = [
    {
      kind: 'brand',
      url: pickedUrl(data.brand_url),
      label: textValue(data.brand_label, locale) || t('theme.partner.join_as_brand', 'Join as a brand'),
    },
    {
      kind: 'individual',
      url: pickedUrl(data.individual_url),
      label: textValue(data.individual_label, locale) || t('theme.partner.join_as_individual', 'Join as an individual'),
    },
  ].filter((a): a is { kind: string; url: string; label: string } => !!a.url);

  if (!image || actions.length === 0) return null;

  const title = textValue(data.title, locale);
  const subtitle = textValue(data.subtitle, locale);

  return (
    <div className="partner-banner">
      <img
        className="partner-banner__image"
        src={getCdnImageUrl(image, { width: 800 })}
        srcSet={getCdnImageSrcSet(image, [400, 800, 1200, 1920])}
        sizes="(min-width: 1280px) 1248px, calc(100vw - 2 * var(--page-gutter, 16px))"
        alt={textValue(data.alt, locale)}
        width={900}
        height={1125}
        loading="lazy"
        decoding="async"
      />
      <span className="partner-banner__veil" aria-hidden="true" />
      <div className="partner-banner__content">
        {title && <h2 className="partner-banner__title">{title}</h2>}
        {subtitle && <p className="partner-banner__subtitle">{subtitle}</p>}
        <div className="partner-banner__actions">
          {actions.map((action) => (
            <a key={action.kind} className={`partner-banner__cta partner-banner__cta--${action.kind}`} href={action.url}>
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

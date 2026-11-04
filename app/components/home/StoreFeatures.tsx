import type { CSSProperties } from 'react';
import { textValue } from '../../lib/settings';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';

interface RawFeature {
  icon?: unknown;
  title?: unknown;
  /** The API's name for the line under the title. */
  description?: unknown;
  /** Twig's name for the same line (`items[].text`). */
  text?: unknown;
}

export interface StoreFeaturesProps {
  data: { features?: RawFeature[]; items?: RawFeature[]; [key: string]: unknown };
}

interface Feature {
  icon: string;
  title: string;
  text: string;
}

const isUrl = (icon: string) => /^(https?:)?\/\//.test(icon);

/** The features the platform sends, read under either name, empty ones dropped. */
export function toFeatures(data: StoreFeaturesProps['data'], locale?: string): Feature[] {
  return (data.features ?? data.items ?? []).flatMap((raw) => {
    const title = textValue(raw.title, locale);
    if (!title) return [];
    return [
      {
        icon: typeof raw.icon === 'string' ? raw.icon.trim() : '',
        title,
        text: textValue(raw.description ?? raw.text, locale),
      },
    ];
  });
}

/**
 * «مميزات المتجر» — Salla's own section, drawn as Twig drew it (owner,
 * 2026-11-05): a warm panel holding the features as a list on a phone (icon,
 * title and line, a hairline between) and as centred columns from 768px, each
 * icon on a white disc ringed in the border tone. Salla's note that the strip
 * was small sets the sizes only: the title at text-lg, the line at text-base,
 * the glyph larger. The content is the merchant's, from the store's settings;
 * the icon is a `sicon-*` class or an image URL.
 */
export function StoreFeatures({ data }: StoreFeaturesProps) {
  const { locale } = useTranslation();
  const features = toFeatures(data, locale);
  if (features.length === 0) return null;

  return (
    <div className="features">
      <ul className="features__grid" style={{ '--features-count': Math.min(features.length, 4) } as CSSProperties}>
        {features.map((feature, i) => (
          <li key={`${feature.title}-${i}`} className="features__item">
            {feature.icon && (
              <span className="features__icon" aria-hidden="true">
                {isUrl(feature.icon) ? (
                  <img src={feature.icon} alt="" width={28} height={28} loading="lazy" decoding="async" />
                ) : (
                  <i className={feature.icon} />
                )}
              </span>
            )}
            <h2 className="features__title">{feature.title}</h2>
            {feature.text && <p className="features__text">{feature.text}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

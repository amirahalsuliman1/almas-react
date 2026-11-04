import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { normaliseHex } from '../../lib/accent';
import { pickedUrl } from '../../lib/pickers';
import { selectedValue, textValue } from '../../lib/settings';

interface MarqueeItem {
  text?: unknown;
  url?: unknown;
}

export interface MarqueeProps {
  data: {
    items?: MarqueeItem[];
    separator?: unknown;
    speed?: unknown;
    background_color?: unknown;
    text_color?: unknown;
  };
}

const SPEEDS = ['slow', 'normal', 'fast'] as const;
/** Copies of the phrase group in the track. Even, so the track's two halves match. */
const COPIES = 8;

/**
 * `home.marquee` — short phrases moving across the page between sections
 * (R-09). One copy is read by screen readers and holds the links; the copies
 * that fill the loop are `aria-hidden` and out of the tab order. It pauses on
 * hover and focus, and stands still and wraps under reduced motion
 * (marquee.scss). Colours, speed and separator are the merchant's.
 */
export function Marquee({ data }: MarqueeProps) {
  const { locale } = useTranslation();
  const items = (data.items ?? [])
    .map((item) => ({ text: textValue(item.text, locale), url: pickedUrl(item.url) }))
    .filter((item) => item.text);
  if (!items.length) return null;

  const separator = textValue(data.separator, locale) || '✦';
  const speed = selectedValue(data.speed, SPEEDS, 'normal');
  const bg = normaliseHex(data.background_color);
  const fg = normaliseHex(data.text_color);
  const style = {
    ...(bg ? { '--marquee-bg': bg } : {}),
    ...(fg ? { '--marquee-text': fg } : {}),
  } as React.CSSProperties;

  return (
    <div className={`marquee marquee--${speed}`} style={style}>
      <div className="marquee__track">
        {Array.from({ length: COPIES }, (_, copy) => {
          const read = copy === 0;
          return (
            <ul key={copy} className="marquee__group" aria-hidden={read ? undefined : true}>
              {items.map((item, i) => (
                <li key={i} className="marquee__pair">
                  <span className="marquee__item">
                    {item.url ? (
                      <a className="marquee__link" href={item.url} tabIndex={read ? undefined : -1}>
                        {item.text}
                      </a>
                    ) : (
                      item.text
                    )}
                  </span>
                  <span className="marquee__separator" aria-hidden="true">
                    {separator}
                  </span>
                </li>
              ))}
            </ul>
          );
        })}
      </div>
    </div>
  );
}

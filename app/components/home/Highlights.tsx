import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useMoney } from '@salla.sa/twilight-theme-engine/hooks/useMoney';
import { product as productApi } from '@salla.sa/twilight-theme-engine/api/product';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { SectionHeader } from '../common/SectionHeader';
import { CloseIcon } from '../icons';
import { textValue } from '../../lib/settings';
import { highlightId, markSeen, pickedProductId, pickedUrl, readSeen } from '../../lib/highlights';

interface HighlightItem {
  title?: unknown;
  cover?: string;
  slide_1?: string;
  slide_2?: string;
  slide_3?: string;
  slide_4?: string;
  slide_5?: string;
  slide_6?: string;
  product?: unknown;
  url?: unknown;
}

export interface HighlightsProps {
  data: { title?: unknown; items?: HighlightItem[] };
}

interface Highlight {
  id: string;
  title: string;
  cover: string;
  slides: string[];
  productId: string | null;
  url: string | null;
}

/** How long a slide stays before the viewer moves on. Matches highlights.scss. */
export const SLIDE_MS = 5000;

function toHighlights(items: HighlightItem[], locale?: string): Highlight[] {
  return items.flatMap((item) => {
    const slides = [item.slide_1, item.slide_2, item.slide_3, item.slide_4, item.slide_5, item.slide_6]
      .filter((s): s is string => typeof s === 'string' && s.trim() !== '')
      .map((s) => getCdnImageUrl(s, { width: 1080 }) ?? s);
    const title = textValue(item.title, locale);
    if (!title || !slides.length) return [];
    return [
      {
        id: highlightId(slides),
        title,
        cover: getCdnImageUrl(item.cover || item.slide_1, { width: 160 }) ?? slides[0],
        slides,
        productId: pickedProductId(item.product),
        url: pickedUrl(item.url),
      },
    ];
  });
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** «تسوّق» with the product's name and price, once the product has loaded. */
function ShopLink({ productId }: { productId: string }) {
  const { t } = useTranslation();
  const { format } = useMoney();
  const [found, setFound] = useState<{ url: string; name: string; price: number } | null>(null);

  useEffect(() => {
    let live = true;
    setFound(null);
    productApi
      .find(productId)
      .then((p) => {
        if (live && p?.url && p?.name) setFound({ url: p.url, name: p.name, price: Number(p.price) });
      })
      .catch(() => {
        // No product, no button: the story still plays.
      });
    return () => {
      live = false;
    };
  }, [productId]);

  if (!found) return null;
  return (
    <a className="highlights__shop" href={found.url}>
      <span>{t('theme.highlights.shop', 'Shop')}</span>
      <span className="highlights__shop-name">{found.name}</span>
      {Number.isFinite(found.price) && <span className="highlights__shop-price">{format(found.price)}</span>}
    </a>
  );
}

function Viewer({
  highlight,
  onClose,
}: {
  highlight: Highlight;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const still = reducedMotion();
  const last = highlight.slides.length - 1;

  const step = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => {
        const next = i + dir;
        if (next > last) {
          onClose();
          return i;
        }
        return Math.max(0, next);
      });
    },
    [last, onClose]
  );

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (typeof el.showModal === 'function' && !el.open) el.showModal();
    else el.setAttribute('open', '');
  }, []);

  useEffect(() => {
    if (still || held) return;
    const timer = window.setTimeout(() => step(1), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [index, held, still, step]);

  const onKey = (e: React.KeyboardEvent) => {
    const rtl = document.documentElement.dir === 'rtl';
    if (e.key === 'ArrowLeft') step(rtl ? 1 : -1);
    if (e.key === 'ArrowRight') step(rtl ? -1 : 1);
  };

  return (
    <dialog
      ref={dialog}
      className={`highlights__viewer${held ? ' highlights__viewer--held' : ''}`}
      aria-label={t('theme.highlights.viewer', 'Stories')}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={onKey}
    >
      <div className="highlights__progress" aria-hidden="true">
        {highlight.slides.map((_, i) => (
          <span
            key={i}
            className={`highlights__bar${i < index ? ' highlights__bar--done' : ''}${
              i === index ? (still ? ' highlights__bar--static' : ' highlights__bar--active') : ''
            }`}
          >
            <span key={i === index ? `active-${index}` : undefined} />
          </span>
        ))}
      </div>
      <div className="highlights__head">
        <p className="highlights__viewer-title">{highlight.title}</p>
        <button
          type="button"
          className="highlights__close"
          aria-label={t('blocks.header.close', 'Close')}
          onClick={onClose}
        >
          <CloseIcon aria-hidden="true" />
        </button>
      </div>
      <div
        className="highlights__stage"
        onPointerDown={() => setHeld(true)}
        onPointerUp={() => setHeld(false)}
        onPointerCancel={() => setHeld(false)}
        onPointerLeave={() => setHeld(false)}
      >
        <img
          className="highlights__slide"
          src={highlight.slides[index]}
          alt={`${highlight.title} — ${index + 1}/${highlight.slides.length}`}
          width={1080}
          height={1920}
          decoding="async"
        />
        <button
          type="button"
          className="highlights__nav highlights__nav--prev"
          aria-label={t('theme.highlights.previous', 'Previous story')}
          onClick={() => step(-1)}
        />
        <button
          type="button"
          className="highlights__nav highlights__nav--next"
          aria-label={t('theme.highlights.next', 'Next story')}
          onClick={() => step(1)}
        />
      </div>
      {(highlight.productId || highlight.url) && (
        <div className="highlights__foot">
          {highlight.productId && <ShopLink productId={highlight.productId} />}
          {highlight.url && (
            <a className="highlights__link" href={highlight.url}>
              {t('theme.highlights.more', 'More')}
            </a>
          )}
        </div>
      )}
    </dialog>
  );
}

/**
 * `home.highlights` — story circles under the hero (R-08). A circle opens its
 * slides in a full-screen viewer (a centred 9:16 panel from 768px): five seconds
 * a slide, a progress bar per slide, tap or arrow keys to move, press and hold
 * to pause, still under reduced motion. A highlight can carry a product
 * («تسوّق» with its name and price) and a link. Opened circles lose their
 * accent ring, remembered in this browser. The viewer is a native `<dialog>`:
 * focus stays inside, Escape closes it, and focus returns to the circle.
 */
export function Highlights({ data }: HighlightsProps): ReactNode {
  const { t, locale } = useTranslation();
  const highlights = toHighlights(data.items ?? [], locale);
  const [open, setOpen] = useState<Highlight | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const trigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => setSeen(readSeen()), []);

  if (!highlights.length) return null;

  const openHighlight = (h: Highlight, button: HTMLButtonElement) => {
    trigger.current = button;
    markSeen(h.id);
    setSeen(readSeen());
    setOpen(h);
  };

  // While the modal dialog is still open, everything outside it is inert and
  // cannot take focus; return focus to the circle once it has gone.
  const close = () => {
    setOpen(null);
    window.requestAnimationFrame(() => trigger.current?.focus());
  };

  const title = textValue(data.title, locale);

  return (
    <div className="highlights">
      {title && <SectionHeader title={title} />}
      <ul className="highlights__row">
        {highlights.map((h) => (
          <li key={h.id} className="highlights__item">
            <button
              type="button"
              className={`highlights__bubble${seen.includes(h.id) ? ' highlights__bubble--seen' : ''}`}
              aria-label={t('theme.highlights.open', 'Open :name').replace(':name', h.title)}
              aria-haspopup="dialog"
              onClick={(e) => openHighlight(h, e.currentTarget)}
            >
              <span className="highlights__ring" aria-hidden="true">
                <img className="highlights__cover" src={h.cover} alt="" width={76} height={76} loading="lazy" decoding="async" />
              </span>
              <span className="highlights__name" aria-hidden="true">
                {h.title}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open && <Viewer highlight={open} onClose={close} />}
    </div>
  );
}

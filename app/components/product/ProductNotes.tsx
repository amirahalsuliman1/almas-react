import { useId, useState } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { textValue } from '../../lib/settings';

interface Note {
  title: string;
  text: string;
}

/** The two notes the merchant wrote, in order; one without text is left out. */
export function productNotes(
  settings: Record<string, unknown>,
  defaults: { shipping: string; notice: string },
  locale?: string
): Note[] {
  const notes: Note[] = [];
  const shipping = textValue(settings.pdp_shipping_text, locale);
  if (shipping) {
    notes.push({
      title: textValue(settings.pdp_shipping_title, locale) || defaults.shipping,
      text: shipping,
    });
  }
  const notice = textValue(settings.pdp_notice_text, locale);
  if (notice) {
    notes.push({
      title: textValue(settings.pdp_notice_title, locale) || defaults.notice,
      text: notice,
    });
  }
  return notes;
}

/** Every line its own line; an empty line is a gap between paragraphs (Twig's). */
function NoteText({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n');
  if (lines.length === 1) return <p>{text}</p>;
  return (
    <ul>
      {lines.map((line, i) => (
        <li key={i}>{line.trim()}</li>
      ))}
    </ul>
  );
}

/**
 * «خيارات الشحن والاستلام» and «تنويه هام» under the product (R-19 part C),
 * Twig's: the merchant's two notes, the same on every product, on the section
 * panel as two open accordions, side by side from 1024px. A note without text
 * is not drawn, and with neither there is no panel. The accordion is the FAQ's
 * (faq.scss), as in Twig.
 */
export function ProductNotes() {
  const { t, locale } = useTranslation();
  const { theme } = useTwilight();
  const base = useId();
  const [closed, setClosed] = useState<Set<number>>(() => new Set());
  const notes = productNotes(
    (theme?.settings ?? {}) as Record<string, unknown>,
    {
      shipping: t('theme.product.shipping_title', 'Shipping & pickup options'),
      notice: t('theme.product.notice_title', 'Important notice'),
    },
    locale
  );
  if (notes.length === 0) return null;

  const toggle = (i: number) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <section className="product-notes">
      <div className="product-notes__grid">
        {notes.map((note, i) => {
          const open = !closed.has(i);
          const id = `${base}-${i}`;
          return (
            <div key={note.title} className={`faq__item product-notes__item${open ? ' is-open' : ''}`}>
              <h2 className="faq__question">
                <button
                  type="button"
                  className="faq__trigger"
                  id={`${id}-trigger`}
                  aria-expanded={open}
                  aria-controls={id}
                  onClick={() => toggle(i)}
                >
                  <span className="faq__text">{note.title}</span>
                  <span className="disclosure-mark" aria-hidden="true" />
                </button>
              </h2>
              <div className="faq__answer" id={id} role="region" aria-labelledby={`${id}-trigger`} inert={!open}>
                <div className="faq__answer-inner">
                  <NoteText text={note.text} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

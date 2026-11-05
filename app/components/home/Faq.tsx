import { useId, useState } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { SectionHeader } from '../common';
import { textValue } from '../../lib/settings';

interface FaqItemData {
  question?: unknown;
  answer?: unknown;
}

export interface FaqProps {
  data: { title?: unknown; intro?: unknown; items?: FaqItemData[] };
}

interface FaqEntry {
  question: string;
  answer: string;
}

/** The merchant's questions; one without a question is dropped. */
export function toFaq(items: FaqItemData[] | undefined, locale?: string): FaqEntry[] {
  return (items ?? []).flatMap((item) => {
    const question = textValue(item.question, locale);
    return question ? [{ question, answer: textValue(item.answer, locale).replace(/\r/g, '') }] : [];
  });
}

/** schema.org `FAQPage`, safe to put inside a `<script>`. */
export function faqSchema(entries: FaqEntry[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((e) => ({
      '@type': 'Question',
      name: e.question,
      acceptedAnswer: { '@type': 'Answer', text: e.answer },
    })),
  }).replace(/</g, '\\u003c');
}

/** A multi-line answer is a list, one line to an item, as Twig drew it. */
function Answer({ text }: { text: string }) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    return (
      <ul>
        {lines.map((line, i) => (
          <li key={`${i}-${line}`}>{line}</li>
        ))}
      </ul>
    );
  }
  return <p>{text}</p>;
}

/**
 * `home.faq` — «الأسئلة الشائعة» (R-17), Twig's (owner, 2026-11-05): a warm
 * panel with the title and intro, then numbered questions, each a button in a
 * heading that opens its answer under a +/− mark, a hairline between. Placed on
 * a custom page it becomes the FAQ page, with Twig's outline. Salla's notes set
 * only the sizes and the ink: the title at the section-title size, questions
 * and answers at text-base, questions in the main text colour. `FAQPage`
 * structured data is written only when there are questions.
 */
export function Faq({ data }: FaqProps) {
  const { locale } = useTranslation();
  const base = useId();
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const entries = toFaq(data.items, locale);
  if (entries.length === 0) return null;

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="faq">
      <SectionHeader title={textValue(data.title, locale)} subtitle={textValue(data.intro, locale)} align="start" />
      <div className="faq__list">
        {entries.map((entry, i) => {
          const isOpen = open.has(i);
          const id = `${base}-${i}`;
          return (
            <div key={`${i}-${entry.question}`} className={`faq__item${isOpen ? ' is-open' : ''}`}>
              <h3 className="faq__question">
                <button
                  type="button"
                  className="faq__trigger"
                  id={`${id}-trigger`}
                  aria-expanded={isOpen}
                  aria-controls={id}
                  onClick={() => toggle(i)}
                >
                  <span className="faq__number" aria-hidden="true">
                    {i + 1}/
                  </span>
                  <span className="faq__text">{entry.question}</span>
                  <span className="disclosure-mark" aria-hidden="true" />
                </button>
              </h3>
              <div className="faq__answer" id={id} role="region" aria-labelledby={`${id}-trigger`} inert={!isOpen}>
                <div className="faq__answer-inner">
                  <Answer text={entry.answer} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchema(entries) }} />
    </div>
  );
}

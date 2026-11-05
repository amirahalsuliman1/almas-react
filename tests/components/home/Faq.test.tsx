import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { Faq, faqSchema, toFaq } from '../../../app/components/home/Faq';
import manifest from '../../../twilight.json';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale: 'ar' }),
}));
vi.mock('../../../app/components/common', () => ({
  SectionHeader: ({ title, subtitle }: { title?: string; subtitle?: string }) => (
    <div>
      {title && <h2>{title}</h2>}
      {subtitle && <p className="intro">{subtitle}</p>}
    </div>
  ),
}));

const items = [
  { question: 'هل منتجاتكم أصلية؟', answer: 'نعم، من الوكيل مباشرة.' },
  { question: 'كم مدة الشحن؟', answer: 'الرياض: يومين\nباقي المدن: ٣–٥ أيام\n' },
  { question: '', answer: 'بلا سؤال' },
];

describe('Faq', () => {
  it('draws nothing, and writes no schema, without a question', () => {
    expect(renderToString(<Faq data={{ items: [{ question: '', answer: 'x' }] }} />)).toBe('');
  });

  it('numbers the questions, drops one without a question, and shows the title and intro', () => {
    const { container } = render(<Faq data={{ title: 'الأسئلة الشائعة', intro: 'إجاباتنا', items }} />);
    expect(container.querySelector('h2')?.textContent).toBe('الأسئلة الشائعة');
    expect(container.querySelector('.intro')?.textContent).toBe('إجاباتنا');
    const questions = container.querySelectorAll('h3.faq__question button');
    expect(questions).toHaveLength(2);
    expect(questions[1].textContent).toContain('2/');
  });

  it('opens and closes each answer, and a closed one is inert', () => {
    const { container } = render(<Faq data={{ items }} />);
    const button = container.querySelector<HTMLButtonElement>('.faq__trigger')!;
    const answer = document.getElementById(button.getAttribute('aria-controls')!)!;
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(answer.hasAttribute('inert')).toBe(true);
    expect(answer.getAttribute('aria-labelledby')).toBe(button.id);
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(answer.hasAttribute('inert')).toBe(false);
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('lists a multi-line answer, one line to an item', () => {
    const { container } = render(<Faq data={{ items }} />);
    const lists = container.querySelectorAll('.faq__answer-inner ul li');
    expect([...lists].map((li) => li.textContent)).toEqual(['الرياض: يومين', 'باقي المدن: ٣–٥ أيام']);
  });

  it('writes FAQPage structured data for the questions it shows, safe inside a script', () => {
    const { container } = render(<Faq data={{ items }} />);
    const json = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(json['@type']).toBe('FAQPage');
    expect(json.mainEntity).toHaveLength(2);
    expect(json.mainEntity[0].acceptedAnswer.text).toBe('نعم، من الوكيل مباشرة.');
    expect(faqSchema(toFaq([{ question: '</script><b>', answer: 'x' }]))).not.toContain('</script>');
  });

  it('declares the block with Twig fields in twilight.json', () => {
    const comp = (manifest.components as { path: string; fields: { id: string }[] }[]).find((c) => c.path === 'home.faq');
    expect(comp?.fields.map((f) => f.id)).toEqual(['title', 'intro', 'items']);
  });
});

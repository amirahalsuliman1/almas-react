import { useMemo, useRef, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { getCdnImageSrcSet, getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { SectionHeader } from '../common';
import { PAGE_ROUTE_ID } from '../../lib/routeIds';
import { textValue } from '../../lib/settings';
import {
  STORY_SHAPES,
  brandsOf,
  filterStories,
  isStoriesPage,
  tagsOf,
  toStories,
  type Story,
  type StoryItemData,
} from '../../lib/stories';
import { StoryModal } from './StoryModal';
import { StoryTags } from './StoryTags';

export interface StoriesProps {
  data: {
    title?: unknown;
    cta_label?: unknown;
    cta_url?: unknown;
    items?: StoryItemData[];
  };
}

/** A link the merchant typed: http(s) or a path on the store. */
function safeLink(raw: unknown): string | null {
  const url = typeof raw === 'string' ? raw.trim() : '';
  return /^(https?:\/\/|\/(?!\/))\S+$/i.test(url) ? url : null;
}

/**
 * `home.stories` — «تجارب عملائنا» (R-13). Customers' photographs in a masonry
 * feed, each reserving its shape's box so nothing moves as they load; a card
 * opens the story over the feed (StoryModal — a dialog, not a page, and no
 * Article schema: B6). Placed on the custom page the merchant names in
 * `stories_page_id`, the feed gains category chips and a brand list, built
 * from the stories themselves.
 */
export function Stories({ data }: StoriesProps) {
  const { t, locale } = useTranslation();
  const { theme } = useTwilight();
  const pageId = useRouterState({
    select: (state) => state.matches.find((m) => m.routeId === PAGE_ROUTE_ID)?.params as { id?: string } | undefined,
  })?.id;
  const onStoriesPage = isStoriesPage(pageId, theme?.settings?.stories_page_id);

  const stories = useMemo(() => toStories(data.items, locale), [data.items, locale]);
  const [tag, setTag] = useState('');
  const [brand, setBrand] = useState('');
  const [position, setPosition] = useState<number | null>(null);
  const cards = useRef(new Map<number, HTMLButtonElement>());

  if (stories.length === 0) return null;

  const shown = onStoriesPage ? filterStories(stories, tag, brand) : stories;
  const tags = onStoriesPage ? tagsOf(stories) : [];
  const brands = onStoriesPage ? brandsOf(stories) : [];
  const ctaUrl = safeLink(data.cta_url);

  // The dialog hands focus back to the card that opened it; after stepping,
  // the card of the story last shown takes it instead, once the dialog is gone.
  const close = () => {
    const story = position == null ? null : shown[position];
    setPosition(null);
    if (story) {
      requestAnimationFrame(() => requestAnimationFrame(() => cards.current.get(story.index)?.focus()));
    }
  };

  return (
    <div className={`stories${onStoriesPage ? ' stories--page' : ''}`}>
      <SectionHeader title={textValue(data.title, locale)} align="start" />

      {onStoriesPage && (tags.length > 0 || brands.length > 0) && (
        <div className="stories__controls">
          {tags.length > 0 && (
            <div className="stories-filter" role="group" aria-label={t('theme.stories.filter_label', 'Filter by category')}>
              {['', ...tags].map((value) => (
                <button
                  key={value || '*'}
                  type="button"
                  className="stories-filter__chip"
                  aria-pressed={tag === value}
                  onClick={() => setTag(value)}
                >
                  <span dir="auto">{value || t('theme.stories.filter_all', 'All')}</span>
                </button>
              ))}
            </div>
          )}
          {brands.length > 0 && (
            <label className="stories-filter__brands">
              <span className="sr-only">{t('theme.stories.brand_label', 'Filter by brand')}</span>
              <select className="stories-filter__select" value={brand} onChange={(e) => setBrand(e.target.value)}>
                <option value="">{t('theme.stories.brand_all', 'All brands')}</option>
                {brands.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="sr-only" aria-live="polite">
            {t('theme.stories.count', ':count stories').replace(':count', String(shown.length))}
          </p>
        </div>
      )}

      <ul className="stories__grid">
        {shown.map((story, i) => (
          <StoryCard
            key={story.index}
            story={story}
            buttonRef={(el) => {
              if (el) cards.current.set(story.index, el);
              else cards.current.delete(story.index);
            }}
            onOpen={() => setPosition(i)}
          />
        ))}
      </ul>

      {ctaUrl && (
        <div className="stories__cta">
          <a className="stories__cta-link" href={ctaUrl}>
            {textValue(data.cta_label, locale) || t('theme.stories.follow_cta', 'Follow us on social media')}
          </a>
        </div>
      )}

      <StoryModal stories={shown} position={position} onStep={setPosition} onClose={close} />
    </div>
  );
}

interface StoryCardProps {
  story: Story;
  buttonRef: (el: HTMLButtonElement | null) => void;
  onOpen: () => void;
}

/** The photograph is the button that opens the story; the tags stay outside it. */
function StoryCard({ story, buttonRef, onOpen }: StoryCardProps) {
  const { t } = useTranslation();
  const shape = STORY_SHAPES[story.shape];
  const label = story.brand
    ? t('theme.stories.open_story_named', 'View the :name story').replace(':name', story.brand)
    : t('theme.stories.open_story', 'View story');

  return (
    <li className="story-card">
      <button ref={buttonRef} type="button" className="story-card__trigger" aria-haspopup="dialog" aria-label={label} onClick={onOpen}>
        <span className="story-card__media" style={{ '--story-ratio': shape.ratio } as React.CSSProperties}>
          <img
            src={getCdnImageUrl(story.image, { width: 400 })}
            srcSet={getCdnImageSrcSet(story.image, [200, 400, 600])}
            sizes="(min-width: 1536px) 18vw, (min-width: 1024px) 22vw, (min-width: 768px) 30vw, 46vw"
            alt={story.alt}
            width={shape.width}
            height={shape.height}
            loading="lazy"
            decoding="async"
          />
        </span>
      </button>
      <StoryTags story={story} />
    </li>
  );
}

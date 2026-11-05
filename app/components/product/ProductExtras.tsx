import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { home } from '@salla.sa/twilight-theme-engine/api/home';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import type { HomeComponentData } from '@salla.sa/twilight-theme-engine/types';
import { SectionHeader } from '../common';
import { Lookbook, StoryCard, StoryModal, type LookbookProps } from '../home';
import { pickedProductId, pickedUrl } from '../../lib/pickers';
import { clampedInteger } from '../../lib/settings';
import { toStories, type StoryItemData } from '../../lib/stories';

/** A block's name without the `home.` the list endpoint may keep on it. */
const blockName = (block: HomeComponentData) => String(block.path ?? '').replace(/^home\./, '');

/** Home's sections, from the engine's own (cached, scope-aware) query. */
function useHomeBlocks(): HomeComponentData[] {
  const { data } = useQuery(home.queries.components());
  return data ?? [];
}

/** The first Home shoppable image that allows it and has a point on this product. */
export function lookFor(blocks: HomeComponentData[], productId: unknown): LookbookProps['data'] | null {
  const id = String(productId);
  for (const block of blocks) {
    if (blockName(block) !== 'lookbook') continue;
    const data = block as unknown as LookbookProps['data'] & { show_on_products?: boolean };
    if (data.show_on_products === false || !data.image) continue;
    if ((data.hotspots ?? []).some((h) => pickedProductId(h.product) === id)) return data;
  }
  return null;
}

/**
 * «نسّقيه مع» (R-19 part D) — Twig's: the first Home lookbook with a point on
 * this product, when that section allows it, drawn with the same lookbook
 * component (image, points, product cards) under the product.
 */
export function ProductLook({ productId }: { productId: number | string }) {
  const { t } = useTranslation();
  const look = lookFor(useHomeBlocks(), productId);
  if (!look) return null;
  return (
    <section className="product-look">
      <Lookbook
        headerAlign="start"
        data={{ ...look, title: t('theme.product.complete_look_title', 'Complete the look'), hint: '', hide_on_home: false }}
      />
    </section>
  );
}

/**
 * «تجارب عملائنا» under the product (R-19 part D) — Twig's: the latest stories
 * from Home's section, in Home's order, in a row that scrolls sideways, each
 * opening the same story dialog; a link under the row when the merchant sets
 * `pdp_stories_url`. Off with `pdp_stories_enabled`, and nothing at all when
 * Home has no stories.
 */
export function ProductStories({
  enabledSetting = 'pdp_stories_enabled',
  tag,
  withLink = true,
  className = '',
}: {
  /** The switch that turns the row off: the product page's, or the category page's. */
  enabledSetting?: 'pdp_stories_enabled' | 'category_stories_enabled';
  /** Only the stories carrying this tag (the category page: the category's name). */
  tag?: string;
  /** The `pdp_stories_url` link under the row (the product page's only). */
  withLink?: boolean;
  className?: string;
} = {}) {
  const { t, locale } = useTranslation();
  const { theme } = useTwilight();
  const settings = (theme?.settings ?? {}) as Record<string, unknown>;
  const blocks = useHomeBlocks();
  const [position, setPosition] = useState<number | null>(null);
  const cards = useRef(new Map<number, HTMLButtonElement>());

  if (settings[enabledSetting] === false) return null;
  const block = blocks.find((b) => blockName(b) === 'stories') as { items?: StoryItemData[] } | undefined;
  const count = clampedInteger(settings.pdp_stories_count, 3, 20, 8);
  const wanted = tag?.trim();
  const stories = toStories(block?.items, locale)
    .filter((story) => !wanted || story.tags.includes(wanted))
    .slice(0, count);
  if (stories.length === 0) return null;
  const url = withLink ? pickedUrl(settings.pdp_stories_url) : null;

  const close = () => {
    const story = position == null ? null : stories[position];
    setPosition(null);
    if (story) requestAnimationFrame(() => requestAnimationFrame(() => cards.current.get(story.index)?.focus()));
  };

  return (
    <section className={`product-stories${className ? ` ${className}` : ''}`}>
      <SectionHeader title={t('theme.product.stories_title', 'Customer stories')} align="start" />
      <ul className="product-stories__track">
        {stories.map((story, i) => (
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
      {url && (
        <div className="product-stories__cta">
          <a className="stories__cta-link" href={url}>
            {t('theme.product.stories_cta', 'View customer stories')}
          </a>
        </div>
      )}
      <StoryModal stories={stories} position={position} onStep={setPosition} onClose={close} />
    </section>
  );
}

/** The first Home lookbook whose `category` names this category. */
export function lookForCategory(blocks: HomeComponentData[], categoryId: unknown): LookbookProps['data'] | null {
  const id = String(categoryId);
  for (const block of blocks) {
    if (blockName(block) !== 'lookbook') continue;
    const data = block as unknown as LookbookProps['data'] & { category?: unknown };
    if (data.image && pickedProductId(data.category) === id) return data;
  }
  return null;
}

/**
 * The category's interactive cover (R-20), Twig's: the Home lookbook whose
 * `category` field names this category, with its points and product cards, at
 * the top of the category page. Nothing when no lookbook names it.
 */
export function CategoryLook({ categoryId }: { categoryId: unknown }) {
  const look = lookForCategory(useHomeBlocks(), categoryId);
  if (!look) return null;
  return (
    <section className="category-look">
      <Lookbook headerAlign="start" data={{ ...look, title: '', hint: '', hide_on_home: false }} />
    </section>
  );
}


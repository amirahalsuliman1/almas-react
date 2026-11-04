import { pickedProductId } from './pickers';
import { selectedValue, textValue } from './settings';
import type { HotspotPoint } from '../components/common/HotspotImage';

/** The shapes a story's photograph can take, and the box each reserves. */
export const STORY_SHAPES = {
  portrait: { ratio: '3 / 4', value: 3 / 4, width: 600, height: 800 },
  square: { ratio: '1 / 1', value: 1, width: 600, height: 600 },
  tall: { ratio: '2 / 3', value: 2 / 3, width: 600, height: 900 },
} as const;

export type StoryShape = keyof typeof STORY_SHAPES;

/** One item of the `home.stories` collection, as twilight.json sends it. */
export interface StoryItemData {
  image?: unknown;
  shape?: unknown;
  alt?: unknown;
  brand?: unknown;
  tags?: unknown;
  hotspot_x?: unknown;
  hotspot_y?: unknown;
  product?: unknown;
}

export interface Story {
  /** The item's place in the merchant's list; stable for keys and focus. */
  index: number;
  image: string;
  shape: StoryShape;
  alt: string;
  brand: string;
  tags: string[];
  /** At most one point: the story's product, at the merchant's x% / y%. */
  points: HotspotPoint[];
}

const clampPercent = (raw: unknown, fallback: number) => {
  const n = raw === '' || raw == null ? fallback : Number(raw);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : fallback;
};

/** «هدايا، عروض, ميكاب» → three tags. Arabic and Latin commas both split. */
export function splitTags(raw: string): string[] {
  return raw
    .split(/[,،]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/** The merchant's items as stories; an item with no image is skipped. */
export function toStories(items: StoryItemData[] | undefined, locale?: string): Story[] {
  return (items ?? []).flatMap((item, index) => {
    const image = typeof item.image === 'string' ? item.image.trim() : '';
    if (!image) return [];
    const productId = pickedProductId(item.product);
    return [
      {
        index,
        image,
        shape: selectedValue(item.shape, ['portrait', 'square', 'tall'] as const, 'portrait'),
        alt: textValue(item.alt, locale),
        brand: typeof item.brand === 'string' ? item.brand.trim() : '',
        tags: splitTags(textValue(item.tags, locale)),
        points: productId
          ? [{ x: clampPercent(item.hotspot_x, 50), y: clampPercent(item.hotspot_y, 50), productId }]
          : [],
      },
    ];
  });
}

/** Each distinct value once, in the order the stories first carry it. */
const distinct = (values: string[]) => [...new Set(values)];

export const tagsOf = (stories: Story[]) => distinct(stories.flatMap((s) => s.tags));
export const brandsOf = (stories: Story[]) => distinct(stories.map((s) => s.brand).filter(Boolean));

/** The stories a tag and a brand leave; an empty choice keeps everything. */
export function filterStories(stories: Story[], tag: string, brand: string): Story[] {
  return stories.filter((s) => (!tag || s.tags.includes(tag)) && (!brand || s.brand === brand));
}

/** Whether the custom page being shown is the one the merchant named in `stories_page_id`. */
export function isStoriesPage(pageId: unknown, setting: unknown): boolean {
  const wanted = String(setting ?? '').trim();
  return wanted !== '' && pageId != null && String(pageId) === wanted;
}

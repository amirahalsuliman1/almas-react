import { safeImageUrl } from './settings';

export interface Swatch {
  name: string;
  color: string;
  image: string;
}

export interface HoverLook {
  /** The product's next photo, shown over the first while the card is hovered. */
  second: string | null;
  /** Colours that carry their own photo, each previewed on its swatch. */
  swatches: Swatch[];
}

const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * What a card shows on hover (R-05b part B), from the product's detail
 * response, as Twig's card read it: the first photo that is not the card's own
 * and not a video, and the colour option's values that have both a colour and
 * a photo. On a colour value the API's `image` may hold the hex instead of a
 * URL, so only an http(s) URL counts; a colour must be a hex, so nothing
 * else reaches the `background-color` it is drawn with.
 */
export function hoverLookFrom(
  details: {
    images?: { url?: unknown; type?: unknown; video_url?: unknown }[];
    options?: { type?: unknown; details?: { name?: unknown; color?: unknown; image?: unknown }[] }[];
  } | null | undefined,
  mainUrl?: string | null
): HoverLook {
  const second =
    (details?.images ?? [])
      .filter((image) => image?.type !== 'video' && !image?.video_url)
      .map((image) => safeImageUrl(image?.url))
      .find((url): url is string => !!url && url !== mainUrl) ?? null;

  const colour = (details?.options ?? []).find((option) => option?.type === 'color');
  const swatches = (colour?.details ?? []).flatMap((detail) => {
    const color = typeof detail?.color === 'string' ? detail.color.trim() : '';
    const image = safeImageUrl(detail?.image);
    if (!HEX.test(color) || !image) return [];
    return [{ name: typeof detail?.name === 'string' ? detail.name : '', color, image }];
  });

  return { second, swatches };
}

/** Twig's test: a pointer that hovers, on a screen 1024px or wider. */
export const canHover = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: hover) and (min-width: 1024px)').matches;

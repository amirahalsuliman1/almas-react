import { useEffect, useEffectEvent } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useWishlist } from '@salla.sa/twilight-theme-engine/hooks/useWishlist';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { BottomSheet, HotspotImage } from '../common';
import { ArrowLeftIcon, ArrowRightIcon } from '../icons';
import { STORY_SHAPES, type Story } from '../../lib/stories';
import { StoryTags } from './StoryTags';

export interface StoryModalProps {
  stories: Story[];
  /** Position of the open story in `stories`, or null when closed. */
  position: number | null;
  onStep: (position: number) => void;
  onClose: () => void;
}

/** The neighbours shown either side of the desktop dialog, nearest to the dialog first in reading order. */
const PEEKS = { prev: [-2, -1], next: [1, 2] } as const;

/**
 * One story, opened over the feed (R-13, B6): the photograph on the shared
 * HotspotImage with its product's point and card, the story's tags, and a
 * close and a wishlist button. On the BottomSheet primitive — a sheet on a
 * phone, a centred dialog from 1024px, where arrows and the neighbouring
 * stories stand either side. The arrows are the keyboard and screen-reader
 * route between stories; the neighbours are pictures for a pointer and are
 * hidden from both. ← and → step too, in the direction they point.
 */
export function StoryModal({ stories, position, onStep, onClose }: StoryModalProps) {
  const { t } = useTranslation();
  const story = position == null ? null : stories[position];
  const open = story != null;

  const step = useEffectEvent((offset: number) => {
    if (position == null) return;
    const next = position + offset;
    if (next >= 0 && next < stories.length) onStep(next);
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      const rtl = document.documentElement.dir !== 'ltr';
      e.preventDefault();
      step((e.key === 'ArrowLeft') === rtl ? 1 : -1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const title = story?.brand
    ? t('theme.stories.story_of', 'Customer story — :name').replace(':name', story.brand)
    : t('theme.stories.story', 'Customer story');

  const at = (offset: number) => (position == null ? undefined : stories[position + offset]);

  const aside = story && (
    <>
      {(['prev', 'next'] as const).map((side) => (
        <div key={side} className={`story-modal__peek story-modal__peek--${side}`} aria-hidden="true">
          {PEEKS[side].map((offset) => {
            const neighbour = at(offset);
            return (
              neighbour && (
                <button
                  key={neighbour.index}
                  type="button"
                  tabIndex={-1}
                  className="story-modal__peek-item"
                  data-story-step={offset}
                  onClick={() => step(offset)}
                >
                  <img src={getCdnImageUrl(neighbour.image, { width: 200 })} alt="" width={200} height={356} loading="lazy" decoding="async" />
                </button>
              )
            );
          })}
        </div>
      ))}
      <button
        type="button"
        className="story-modal__nav story-modal__nav--prev"
        aria-label={t('theme.stories.previous', 'Previous story')}
        hidden={!at(-1)}
        onClick={() => step(-1)}
      >
        <ArrowRightIcon aria-hidden="true" />
      </button>
      <button
        type="button"
        className="story-modal__nav story-modal__nav--next"
        aria-label={t('theme.stories.next', 'Next story')}
        hidden={!at(1)}
        onClick={() => step(1)}
      >
        <ArrowLeftIcon aria-hidden="true" />
      </button>
    </>
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      header={<h3 className="sr-only">{title}</h3>}
      className="story-modal"
      aside={aside}
    >
      {story && (
        <div
          className="story-modal__stage"
          style={{ '--story-ratio': STORY_SHAPES[story.shape].ratio, '--story-ratio-value': STORY_SHAPES[story.shape].value } as React.CSSProperties}
        >
          {/* Keyed by the story so a step starts the image and its cards afresh. */}
          <HotspotImage key={story.index} image={story.image} alt={story.alt} layout="overlay" points={story.points} />
          <StoryTags story={story} />
          <div className="story-modal__actions">
            <button type="button" className="story-modal__action story-modal__action--close" onClick={onClose}>
              {t('blocks.header.close', 'Close')}
            </button>
            {story.points[0]?.productId && <StoryWishlistButton productId={Number(story.points[0].productId)} />}
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

function StoryWishlistButton({ productId }: { productId: number }) {
  const { t } = useTranslation();
  const wishlist = useWishlist();
  const added = wishlist.has(productId);
  return (
    <button
      type="button"
      className="story-modal__action story-modal__action--wishlist"
      // Wishlist apps find a heart by its product id, as on the card.
      data-id={productId}
      aria-pressed={added}
      onClick={() => wishlist.toggle(productId)}
    >
      <i className="sicon-heart" aria-hidden="true" />
      {added
        ? t('theme.product.remove_from_wishlist', 'Remove from wishlist')
        : t('theme.product.add_to_wishlist', 'Add to wishlist')}
    </button>
  );
}

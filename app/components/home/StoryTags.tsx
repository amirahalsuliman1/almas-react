import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import type { Story } from '../../lib/stories';

/**
 * A story's brand, then its category tags — on the card and in the dialog. The
 * brand is in `<bdi>`: a Latin name inside Arabic text must not reorder it.
 */
export function StoryTags({ story }: { story: Story }) {
  const { t } = useTranslation();
  if (!story.brand && story.tags.length === 0) return null;
  return (
    <ul className="story-tags" aria-label={t('theme.stories.tags_label', 'Story tags')}>
      {story.brand && (
        <li className="story-tags__tag story-tags__tag--brand">
          <bdi>{story.brand}</bdi>
        </li>
      )}
      {story.tags.map((tag, i) => (
        <li key={`${tag}-${i}`} className="story-tags__tag">
          <span dir="auto">{tag}</span>
        </li>
      ))}
    </ul>
  );
}

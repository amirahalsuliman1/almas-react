import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { HotspotImage, toHotspotPoints } from '../common/HotspotImage';
import { SectionHeader } from '../common/SectionHeader';
import { pickedProductId } from '../../lib/pickers';
import { selectedValue, textValue } from '../../lib/settings';

export interface LookbookProps {
  /** The section title's alignment: centred on Home, start on the product page (Twig). */
  headerAlign?: 'center' | 'start';
  data: {
    title?: unknown;
    hint?: unknown;
    image?: string;
    alt?: unknown;
    caption?: unknown;
    layout?: unknown;
    desktop_side?: unknown;
    hide_on_home?: boolean;
    hotspots?: { x?: unknown; y?: unknown; product?: unknown }[];
  };
}

/**
 * `home.lookbook` — a shoppable photograph (R-11) on the shared HotspotImage.
 * Salla's reviewer found the old section untitled and its points unexplained,
 * so it carries a title and a one-line hint, both the merchant's. From 1024px
 * the photograph and the product cards share the row, the photograph on the
 * side the merchant picks.
 */
export function Lookbook({ data, headerAlign = 'center' }: LookbookProps) {
  const { locale } = useTranslation();
  if (!data.image || data.hide_on_home) return null;

  const points = toHotspotPoints(data.hotspots, pickedProductId);
  const side = selectedValue(data.desktop_side, ['right', 'left'] as const, 'right');

  return (
    <div className={`lookbook lookbook--image-${side}`}>
      <SectionHeader title={textValue(data.title, locale)} subtitle={textValue(data.hint, locale)} align={headerAlign} />
      <HotspotImage
        image={data.image}
        alt={textValue(data.alt, locale)}
        caption={textValue(data.caption, locale)}
        layout={selectedValue(data.layout, ['overlay', 'list'] as const, 'overlay')}
        points={points}
      />
    </div>
  );
}

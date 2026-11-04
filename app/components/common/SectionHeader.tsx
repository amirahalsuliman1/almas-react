import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { ArrowLeftIcon } from '../icons';

export interface SectionHeaderProps {
  title?: string;
  /** One line under the title, in the secondary colour. */
  subtitle?: string;
  /** «عرض الكل» goes here when set. */
  displayAllUrl?: string | null;
  /** Overrides the «عرض الكل» label. */
  displayAllLabel?: string;
  className?: string;
}

/**
 * The one header every section uses (R-06, REDESIGN-2026-11.md): the title at
 * text-2xl / text-3xl bold, an optional subtitle, and «عرض الكل» in the accent
 * with an arrow. Keeps the Twig-era `s-block__title` / `s-block__display-all`
 * classes, which installed apps look for. Renders nothing with neither a title
 * nor a link.
 */
export function SectionHeader({
  title,
  subtitle,
  displayAllUrl,
  displayAllLabel,
  className,
}: SectionHeaderProps) {
  const { t } = useTranslation();
  if (!title && !displayAllUrl) return null;

  return (
    <div className={`section-header s-block__title${className ? ` ${className}` : ''}`}>
      {(title || subtitle) && (
        <div className="section-header__text">
          {title && <h2 className="section-header__title">{title}</h2>}
          {subtitle && <p className="section-header__subtitle">{subtitle}</p>}
        </div>
      )}
      {displayAllUrl && (
        <Link to={displayAllUrl} className="section-header__all s-block__display-all">
          {displayAllLabel ?? t('blocks.home.display_all', 'View All')}
          <ArrowLeftIcon className="section-header__arrow" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

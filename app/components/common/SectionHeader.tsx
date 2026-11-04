import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { Link } from '@salla.sa/twilight-theme-engine/common';

export interface SectionHeaderProps {
  title?: string;
  /** One line under the title, in the secondary colour. */
  subtitle?: string;
  /** «عرض الكل» goes here when set. */
  displayAllUrl?: string | null;
  /** Overrides the «عرض الكل» label. */
  displayAllLabel?: string;
  /** `center` (Twig's default) or `start` (Twig's «تجارب عملائنا»). */
  align?: 'center' | 'start';
  className?: string;
}

/**
 * The one header every section uses — Twig's (owner, 2026-11-05): the title
 * centred and «عرض الكل» under it, underlined in the text colour. Salla's note
 * on small type sets the sizes: the title at text-2xl / text-3xl bold, the
 * link at text-base. The link's accessible name carries the section title
 * after the visible label (WCAG 2.4.4, and 2.5.3 still matches the label), as
 * Twig's did. Keeps the Twig-era `s-block__title` / `s-block__display-all`
 * classes, which installed apps look for. Renders nothing with neither a title
 * nor a link.
 */
export function SectionHeader({
  title,
  subtitle,
  displayAllUrl,
  displayAllLabel,
  align = 'center',
  className,
}: SectionHeaderProps) {
  const { t } = useTranslation();
  if (!title && !displayAllUrl) return null;

  return (
    <div className={`section-header section-header--${align} s-block__title${className ? ` ${className}` : ''}`}>
      {title && <h2 className="section-header__title">{title}</h2>}
      {subtitle && <p className="section-header__subtitle">{subtitle}</p>}
      {displayAllUrl && (
        <Link to={displayAllUrl} className="section-header__all s-block__display-all">
          {displayAllLabel ?? t('blocks.home.display_all', 'View All')}
          {title && <span className="sr-only"> {title}</span>}
        </Link>
      )}
    </div>
  );
}

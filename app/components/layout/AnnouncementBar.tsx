import { useTwilight } from '@salla.sa/twilight-theme-engine/providers';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { DISMISSED_CLASS, dismissKey, dismissedScript } from '../../lib/announcement';
import { textValue } from '../../lib/settings';
import { CloseIcon } from '../icons';

interface AnnouncementSettings {
  announcement_enabled?: boolean;
  announcement_bottom_enabled?: boolean;
  announcement_text?: unknown;
  announcement_url?: string;
  announcement_sticky?: boolean;
  announcement_dismissible?: boolean;
}

/**
 * The merchant's announcement, above the header (`top`) or above the footer
 * (`bottom`): one sentence, scrolling, a link when `announcement_url` is set.
 * One text for both, so they cannot drift apart; each has its own switch. The sentence is read once — the copy that
 * fills the loop is `aria-hidden` — and the link is the text itself, so there
 * is one tab stop. The loop pauses on hover and focus and stands still under
 * reduced motion (announcement.scss).
 */
export function AnnouncementBar({ position = 'top' }: { position?: 'top' | 'bottom' }) {
  const { theme } = useTwilight();
  const { t, locale } = useTranslation();
  const settings = (theme?.settings ?? {}) as AnnouncementSettings;
  const text = textValue(settings.announcement_text, locale);
  const topOn = settings.announcement_enabled !== false;
  const on = position === 'top' ? topOn : settings.announcement_bottom_enabled !== false;
  if (!on || !text) return null;
  // With both bars on, the lower one is decoration: one sentence is read once
  // per page, and nothing hidden from screen readers stays in the tab order.
  const silent = position === 'bottom' && topOn;

  const url = settings.announcement_url?.trim();
  const key = dismissKey(text);

  const dismiss = () => {
    document.documentElement.classList.add(DISMISSED_CLASS);
    try {
      window.localStorage.setItem(key, '1');
    } catch {
      // The bar is hidden for this page view; it returns on the next one.
    }
    // The pressed button is gone: put focus where the page's content starts.
    const main = document.getElementById('main-content');
    main?.setAttribute('tabindex', '-1');
    main?.focus();
  };

  return (
    <>
      {settings.announcement_dismissible && !silent && (
        <script dangerouslySetInnerHTML={{ __html: dismissedScript(key) }} />
      )}
      <div
        className={`announcement-bar announcement-bar--${position}${
          settings.announcement_sticky && position === 'top' ? ' announcement-bar--sticky' : ''
        }`}
        data-testid={`announcement-bar-${position}`}
        aria-hidden={silent || undefined}
      >
        <div className="announcement-bar__track">
          {url ? (
            <a
              className="announcement-bar__text announcement-bar__link"
              href={url}
              tabIndex={silent ? -1 : undefined}
            >
              {text}
            </a>
          ) : (
            <span className="announcement-bar__text">{text}</span>
          )}
          <span className="announcement-bar__text" aria-hidden="true">
            {text}
          </span>
        </div>
        {settings.announcement_dismissible && (
          <button
            type="button"
            className="announcement-bar__dismiss"
            tabIndex={silent ? -1 : undefined}
            aria-label={t('theme.common.dismiss_announcement', 'Close the announcement')}
            onClick={dismiss}
          >
            <CloseIcon aria-hidden="true" />
          </button>
        )}
      </div>
    </>
  );
}

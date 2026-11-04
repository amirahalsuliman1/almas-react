import { useSyncExternalStore } from 'react';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { setVisitorMode } from '../../lib/colorModeStore';
import { MoonIcon, SunIcon } from '../icons';

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
};
const isDarkNow = () => document.documentElement.classList.contains('dark');

/**
 * The visitor's light/dark switch (`dark_mode_toggle`). It reads the page's
 * current mode from `<html>` and stores the opposite as the visitor's choice,
 * which `useColorMode` then applies. The label names the action, not the state.
 */
export function ColorModeToggle() {
  const { t } = useTranslation();
  // The server renders the light label; the client corrects it after hydration.
  const dark = useSyncExternalStore(subscribe, isDarkNow, () => false);
  const label = dark
    ? t('theme.color_mode.to_light', 'Switch to light mode')
    : t('theme.color_mode.to_dark', 'Switch to dark mode');

  return (
    <button
      type="button"
      className="header-action site-header__color-mode"
      aria-label={label}
      title={label}
      onClick={() => setVisitorMode(dark ? 'light' : 'dark')}
      suppressHydrationWarning
    >
      {dark ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
    </button>
  );
}

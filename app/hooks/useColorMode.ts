import { useEffect, useState, useSyncExternalStore } from 'react';
import { DARK_CLASS, isDark, type ColorMode } from '../lib/colorMode';
import { getVisitorMode, subscribeVisitorMode } from '../lib/colorModeStore';

const QUERY = '(prefers-color-scheme: dark)';

/**
 * Keeps the `dark` class on `<html>` equal to the colour mode after hydration:
 * when the merchant changes the mode in the editor, when the store flag changes,
 * in `auto`, when the device switches, and when a visitor uses the toggle. The before-paint script set the
 * first value; this owns it from then on. `<html>` sits outside the React tree,
 * so the class is set directly.
 */
export function useColorMode(mode: ColorMode, storeIsDark: boolean, visitorToggle = false): boolean {
  const visitor = useSyncExternalStore(subscribeVisitorMode, getVisitorMode, () => null);
  const [deviceIsDark, setDeviceIsDark] = useState(false);

  useEffect(() => {
    if (mode !== 'auto' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(QUERY);
    const update = () => setDeviceIsDark(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, [mode]);

  const chosen = visitorToggle ? visitor : null;
  const dark = chosen ? chosen === 'dark' : isDark(mode, storeIsDark, deviceIsDark);
  useEffect(() => {
    document.documentElement.classList.toggle(DARK_CLASS, dark);
  }, [dark]);
  return dark;
}

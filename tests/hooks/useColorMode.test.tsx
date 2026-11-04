import { describe, it, expect, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useColorMode } from '../../app/hooks/useColorMode';
import type { ColorMode } from '../../app/lib/colorMode';

const html = document.documentElement;
afterEach(() => html.classList.remove('dark'));

describe('useColorMode', () => {
  it('removes a dark class left by the before-paint script when the mode turns light', () => {
    html.classList.add('dark');
    const { rerender } = renderHook(({ mode }) => useColorMode(mode, true), {
      initialProps: { mode: 'store' as ColorMode },
    });
    expect(html.classList.contains('dark')).toBe(true);
    rerender({ mode: 'light' });
    expect(html.classList.contains('dark')).toBe(false);
  });

  it('adds it for a fixed dark mode', () => {
    renderHook(() => useColorMode('dark', false));
    expect(html.classList.contains('dark')).toBe(true);
  });

  it('auto follows the device (the test setup reports dark)', () => {
    renderHook(() => useColorMode('auto', false));
    expect(html.classList.contains('dark')).toBe(true);
  });
});

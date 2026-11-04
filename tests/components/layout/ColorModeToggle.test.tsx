import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { ColorModeToggle } from '../../../app/components/layout/ColorModeToggle';
import { getVisitorMode, resetVisitorModeCache, VISITOR_MODE_KEY } from '../../../app/lib/colorModeStore';

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

beforeEach(() => {
  localStorage.clear();
  resetVisitorModeCache();
  document.documentElement.classList.remove('dark');
});

describe('ColorModeToggle', () => {
  it('names the action, and stores the opposite of the current mode', () => {
    const { getByRole } = render(<ColorModeToggle />);
    const button = getByRole('button');
    expect(button.getAttribute('aria-label')).toBe('Switch to dark mode');
    fireEvent.click(button);
    expect(getVisitorMode()).toBe('dark');
    expect(localStorage.getItem(VISITOR_MODE_KEY)).toBe('dark');
  });

  it('follows <html> when the page turns dark', async () => {
    const { getByRole } = render(<ColorModeToggle />);
    await act(async () => {
      document.documentElement.classList.add('dark');
      await Promise.resolve();
    });
    expect(getByRole('button').getAttribute('aria-label')).toBe('Switch to light mode');
  });
});

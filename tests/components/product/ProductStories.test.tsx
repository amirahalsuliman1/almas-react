import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ProductStories } from '../../../app/components/product/ProductExtras';

const state = vi.hoisted(() => ({ blocks: [] as unknown[], settings: {} as Record<string, unknown> }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ data: state.blocks }) }));
vi.mock('@salla.sa/twilight-theme-engine/api/home', () => ({ home: { queries: { components: () => ({}) } } }));
vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({ useTwilight: () => ({ theme: { settings: state.settings } }) }));
vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k, locale: 'ar' }),
}));
vi.mock('../../../app/components/home', () => ({
  Lookbook: () => null,
  StoryModal: () => null,
  StoryCard: ({ story }: { story: { image: string } }) => <li className="story-card" data-image={story.image} />,
}));
vi.mock('../../../app/components/common', () => ({
  SectionHeader: ({ title }: { title?: string }) => <h2>{title}</h2>,
}));

const items = Array.from({ length: 10 }, (_, i) => ({ image: `/s${i}.jpg` }));

beforeEach(() => {
  state.blocks = [{ path: 'stories', items }];
  state.settings = {};
});

describe('ProductStories', () => {
  it("shows Home's latest stories, in Home's order, up to the count (8 by default)", () => {
    const { container } = render(<ProductStories />);
    const cards = container.querySelectorAll('.story-card');
    expect(cards).toHaveLength(8);
    expect(cards[0].getAttribute('data-image')).toBe('/s0.jpg');
    state.settings = { pdp_stories_count: 4 };
    expect(render(<ProductStories />).container.querySelectorAll('.story-card')).toHaveLength(4);
  });

  it('is off with the setting, and absent when Home has no stories', () => {
    state.settings = { pdp_stories_enabled: false };
    expect(render(<ProductStories />).container.innerHTML).toBe('');
    state.settings = {};
    state.blocks = [{ path: 'hero' }];
    expect(render(<ProductStories />).container.innerHTML).toBe('');
  });

  it('adds the link under the row only when the merchant sets one', () => {
    expect(render(<ProductStories />).container.querySelector('.product-stories__cta')).toBeNull();
    state.settings = { pdp_stories_url: 'https://example.com/stories' };
    const link = render(<ProductStories />).container.querySelector('.product-stories__cta a');
    expect(link?.getAttribute('href')).toBe('https://example.com/stories');
  });
});

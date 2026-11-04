import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { Header } from '../../../app/components/layout/Header';
import { HOME_ROUTE_ID } from '../../../app/lib/routeIds';

const state = {
  store: {
    url: '/',
    name: 'Acme',
    logo: 'logo.png',
    description: '<p>Handmade goods</p>',
    social: { twitter: 'https://x.com/acme' },
  } as Record<string, unknown>,
  theme: { settings: {} } as Record<string, unknown>,
  isHome: true,
  routeIds: [] as string[],
};

type RouterStateStub = {
  matches: { routeId: string }[];
};

vi.mock('@tanstack/react-router', () => ({
  useRouterState: ({ select }: { select: (s: RouterStateStub) => unknown }) =>
    select({
      matches: state.routeIds.map((routeId) => ({ routeId })),
    }),
}));

vi.mock('@salla.sa/twilight-theme-engine/providers', () => ({
  useTwilight: () => ({ store: state.store, theme: state.theme }),
  useIsHome: () => state.isHome,
}));

vi.mock('@salla.sa/twilight-theme-engine/i18n', () => ({
  useTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? _k }),
}));

vi.mock('@salla.sa/twilight-theme-engine/hooks', () => ({
  HookSlot: ({ name }: { name: string }) => <div data-hook-slot={name} />,
}));

vi.mock('@salla.sa/twilight-theme-engine/common', () => ({
  Image: (props: Record<string, unknown>) => (
    <img
      alt={String(props.alt ?? '')}
      src={String(props.src ?? '')}
      className={props.className as string | undefined}
    />
  ),
}));

vi.mock('../../../app/components/layout/HeaderMainMenu', () => ({
  HeaderMainMenu: () => <div data-testid="header-main-menu" />,
}));
vi.mock('../../../app/components/layout/HeaderNav', () => ({
  HeaderNav: ({ open }: { open: boolean }) => <nav data-testid="header-nav" data-open={open} />,
}));

const nav = { hasContent: true };
vi.mock('../../../app/hooks/useNavHasContent', () => ({
  useNavHasContent: () => nav.hasContent,
}));

vi.mock('../../../app/components/layout/PageAdvertisements', () => ({
  PageAdvertisements: () => <div data-testid="advertisement-bar-render" />,
}));
vi.mock('@salla.sa/twilight-components-react/search', () => ({
  SallaSearch: () => <salla-search />,
}));
vi.mock('@salla.sa/twilight-components-react/social', () => ({
  SallaSocial: () => <salla-social />,
}));
vi.mock('@salla.sa/twilight-components-react/user-menu', () => ({
  SallaUserMenu: () => <salla-user-menu />,
}));
vi.mock('@salla.sa/twilight-components-react/cart-summary', () => ({
  SallaCartSummary: ({ children }: { children?: React.ReactNode }) => (
    <salla-cart-summary>{children}</salla-cart-summary>
  ),
}));

// The pin observer: tests flip the sentinel out of view through `observers`.
const observers: { cb: (entries: { isIntersecting: boolean }[]) => void }[] = [];
class FakeIntersectionObserver {
  cb: (entries: { isIntersecting: boolean }[]) => void;
  constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
    this.cb = cb;
    observers.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
const scrollPastSentinel = () =>
  act(() => {
    observers.forEach((o) => o.cb([{ isIntersecting: false }]));
  });

beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  state.store = {
    url: '/',
    name: 'Acme',
    logo: 'logo.png',
    description: '<p>Handmade goods</p>',
    social: { twitter: 'https://x.com/acme' },
  };
  state.theme = { settings: { header_show_store_info: true } };
  state.isHome = true;
  state.routeIds = [];
  nav.hasContent = true;
});

afterEach(() => {
  document.documentElement.style.removeProperty('--app-safe-area-top');
  vi.unstubAllGlobals();
});

describe('Header', () => {
  it('renders the shell: logo, actions, search modal, cart, and the hook slots', () => {
    const { container, getAllByLabelText } = render(<Header />);
    expect(container.querySelector('header.site-header')).toBeTruthy();
    expect(container.querySelector('.site-header__brand img')).toBeTruthy();
    expect(container.querySelector('salla-user-menu')).toBeTruthy();
    expect(container.querySelector('salla-cart-summary')).toBeTruthy();
    expect(container.querySelector('salla-search')).toBeTruthy();
    // One search trigger, in the actions group opposite the menu button.
    expect(getAllByLabelText('Search')).toHaveLength(1);
    expect(container.querySelector('[data-hook-slot="header:start"]')).toBeTruthy();
    expect(container.querySelector('[data-hook-slot="header:end"]')).toBeTruthy();
  });

  it("uses the theme's logo_main over the store logo, and the store logo when it is empty", () => {
    state.theme = { settings: { logo_main: 'https://cdn.salla.sa/am1als.svg' } };
    const { container, unmount } = render(<Header />);
    expect(container.querySelector('.brand-logo--main')?.getAttribute('src')).toBe(
      'https://cdn.salla.sa/am1als.svg'
    );
    unmount();
    state.theme = { settings: {} };
    const second = render(<Header />);
    expect(second.container.querySelector('.brand-logo--main')?.getAttribute('src')).toBe(
      (state.store as { logo?: string }).logo
    );
  });

  it('adds the dark logo only when dark_logo is set', () => {
    state.theme = { settings: {} };
    const { container, unmount } = render(<Header />);
    expect(container.querySelector('.brand-logo--dark')).toBeNull();
    unmount();
    state.theme = { settings: { dark_logo: 'https://cdn.salla.sa/am1als-light.svg' } };
    const second = render(<Header />);
    expect(second.container.querySelector('.brand-logo--dark')?.getAttribute('src')).toBe(
      'https://cdn.salla.sa/am1als-light.svg'
    );
  });

  it('names the logo link by the store name once', () => {
    const { container } = render(<Header />);
    const brand = container.querySelector('.site-header__brand')!;
    // The sr-only name is the link's name; the logo adds nothing (no "Acme logo").
    expect(brand.querySelector('img')?.getAttribute('alt')).toBe('');
    expect(brand.querySelector('.sr-only')?.textContent).toBe('Acme');
  });

  it('drops the menu button when the menu would open empty', () => {
    nav.hasContent = false;
    const { container, queryByLabelText } = render(<Header />);
    expect(queryByLabelText('Menu')).toBeNull();
    // The cell stays, so the logo keeps its place.
    expect(container.querySelector('.site-header__nav-toggle')).toBeTruthy();
  });

  it('renders the store name, description and social links in the intro row', () => {
    state.routeIds = [HOME_ROUTE_ID];
    const { container } = render(<Header />);
    const intro = container.querySelector('.site-header__intro-inner');
    expect(intro?.querySelector('.site-header__intro-title')?.textContent).toBe('Acme');
    expect(container.querySelector('.site-header__intro-text')?.innerHTML).toContain(
      'Handmade goods'
    );
    expect(container.querySelector('.site-header__intro salla-social')).toBeTruthy();
  });

  it('hides the store info row when header_show_store_info is off', () => {
    state.routeIds = [HOME_ROUTE_ID];
    state.theme = { settings: { header_show_store_info: false } };
    const { container } = render(<Header />);
    expect(container.querySelector('.site-header__intro')).toBeNull();
    expect(container.querySelector('header.site-header')).toBeTruthy();
  });

  it('hides the store info row when header_show_store_info is unset', () => {
    state.routeIds = [HOME_ROUTE_ID];
    state.theme = { settings: {} };
    const { container } = render(<Header />);
    expect(container.querySelector('.site-header__intro')).toBeNull();
  });

  it('leaves the store contacts to the footer, out of the intro row', () => {
    state.routeIds = [HOME_ROUTE_ID];
    state.store = { ...state.store, contacts: { phone: '+971500000000', email: 'hi@acme.test' } };
    const { container } = render(<Header />);
    const intro = container.querySelector('.site-header__intro');
    expect(intro).toBeTruthy();
    expect(intro?.querySelector('a[href^="tel:"], a[href^="mailto:"]')).toBeNull();
  });

  it('draws one bar, with no top bar above it (Twig), in either layout', () => {
    state.theme = { settings: { header_layout: 'default' } };
    const { container } = render(<Header />);
    expect(container.querySelector('.site-header__topnav')).toBeNull();
    expect(container.querySelectorAll('.site-header__bar')).toHaveLength(1);
  });

  it('puts the search icon at the start, with the menu button', () => {
    const { container } = render(<Header />);
    const start = container.querySelector('.site-header__nav-toggle')!;
    expect(start.querySelector('.site-header__search')).toBeTruthy();
    expect(container.querySelector('.site-header__actions .site-header__search')).toBeNull();
  });

  it('keeps the account at the outer edge, after the cart, as Twig does', () => {
    const { container } = render(<Header />);
    const tags = [...container.querySelector('.site-header__actions')!.children].map((el) => el.tagName.toLowerCase());
    expect(tags.indexOf('salla-cart-summary')).toBeLessThan(tags.indexOf('salla-user-menu'));
  });

  it('puts the category row after the actions in the default layout, and none in lite', () => {
    state.theme = { settings: { header_layout: 'default' } };
    const { container, unmount } = render(<Header />);
    const inner = container.querySelector('.site-header__bar-inner')!;
    const order = [...inner.children].map((el) => el.className);
    expect(order.indexOf('site-header__mainmenu')).toBeGreaterThan(order.indexOf('site-header__actions'));
    unmount();
    state.theme = { settings: { header_layout: 'lite' } };
    expect(render(<Header />).container.querySelector('.site-header__mainmenu')).toBeNull();
  });

  it('adds the white logo over the hero on Home: logo_light, else the dark logo', () => {
    state.routeIds = [HOME_ROUTE_ID];
    state.theme = { settings: { logo_light: 'white.png', dark_logo: 'dark.png' } };
    const first = render(<Header />);
    expect(first.container.querySelector('.brand-logo--overlay')?.getAttribute('src')).toBe('white.png');
    expect(first.container.querySelector('.site-header')?.className).toContain('has-overlay-logo');
    first.unmount();

    state.theme = { settings: { dark_logo: 'dark.png' } };
    const second = render(<Header />);
    expect(second.container.querySelector('.brand-logo--overlay')?.getAttribute('src')).toBe('dark.png');
    second.unmount();

    state.routeIds = [];
    state.theme = { settings: { logo_light: 'white.png' } };
    expect(render(<Header />).container.querySelector('.brand-logo--overlay')).toBeNull();
  });

  it('omits the description block when the store has none', () => {
    state.routeIds = [HOME_ROUTE_ID];
    state.store.description = '';
    const { container } = render(<Header />);
    expect(container.querySelector('.site-header__intro-text')).toBeNull();
  });

  it('uses <h1> for the intro title on the homepage', () => {
    state.routeIds = [HOME_ROUTE_ID];
    const { container } = render(<Header />);
    expect(container.querySelector('h1.site-header__intro-title')?.textContent).toBe('Acme');
  });

  it('server-renders one <h1> on the homepage: the intro title when the row shows', () => {
    state.routeIds = [HOME_ROUTE_ID];
    const html = renderToString(<Header />);

    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toMatch(/<h1 class="site-header__intro-title">Acme<\/h1>/);
  });

  it('server-renders one <h1> on the homepage: the store name in the logo link when the intro row is off', () => {
    state.theme = { settings: {} };
    state.routeIds = [HOME_ROUTE_ID];
    const html = renderToString(<Header />);

    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toMatch(/site-header__brand[^]*<h1 class="sr-only">Acme<\/h1>/);
  });

  it('leaves the <h1> to the page everywhere but the homepage', () => {
    state.theme = { settings: { header_show_store_info: true, header_store_info_home_only: false } };
    state.routeIds = ['/{-$locale}/cart'];
    state.isHome = false;
    const html = renderToString(<Header />);

    expect(html).not.toMatch(/<h1\b/);
    expect(html).toContain('<span class="sr-only">Acme</span>');
  });

  it('shows the store info row on the homepage only by default', () => {
    state.routeIds = [HOME_ROUTE_ID];
    const { container, rerender } = render(<Header />);
    expect(container.querySelector('.site-header__intro')).toBeTruthy();

    state.routeIds = ['/{-$locale}/$slug/p{$id}'];
    state.isHome = false;
    rerender(<Header />);
    expect(container.querySelector('.site-header__intro')).toBeNull();
  });

  it('shows the store info row on every page when home-only is off', () => {
    state.theme = { settings: { header_show_store_info: true, header_store_info_home_only: false } };
    state.routeIds = ['/{-$locale}/$slug/p{$id}'];
    state.isHome = false;
    const { container } = render(<Header />);
    expect(container.querySelector('.site-header__intro')).toBeTruthy();
  });

  it('never shows the store info row in the default header layout', () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    state.theme = { settings: { header_layout: 'default', header_store_info_home_only: false } };
    state.routeIds = [HOME_ROUTE_ID];
    const { container } = render(<Header />);
    expect(container.querySelector('.site-header__intro')).toBeNull();
  });

  it('opens the nav drawer when the menu button is clicked', () => {
    const { getByLabelText, getByTestId } = render(<Header />);
    const button = getByLabelText('Menu');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(getByTestId('header-nav').getAttribute('data-open')).toBe('true');
  });

  it('dispatches the search event when the search button is clicked', () => {
    const dispatch = vi.fn();
    (window as unknown as { salla: unknown }).salla = { event: { dispatch } };
    const { getByLabelText } = render(<Header />);
    fireEvent.click(getByLabelText('Search'));
    expect(dispatch).toHaveBeenCalledWith('search::open');
  });

  it('pins the bar once its sentinel leaves the screen, in either layout (header_is_sticky unset)', () => {
    for (const layout of ['lite', 'default']) {
      state.theme = { settings: { header_layout: layout } };
      const { container, unmount } = render(<Header />);
      expect(container.querySelector('.site-header__bar.is-scrolled')).toBeNull();
      scrollPastSentinel();
      expect(container.querySelector('.site-header__bar.is-scrolled')).toBeTruthy();
      unmount();
    }
  });

  it("pins the default layout at the Salla app's status bar line, and follows the inset", async () => {
    const margins: string[] = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(_cb: unknown, options: { rootMargin?: string }) {
          margins.push(options.rootMargin ?? '');
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    // Only the header's pin observer sets a top margin; other observers on the page don't.
    const pinMargins = () => margins.filter((m) => m.startsWith('-'));
    state.theme = { settings: { header_layout: 'default' } };
    document.documentElement.style.setProperty('--app-safe-area-top', '62px');
    render(<Header />);
    expect(pinMargins().at(-1)).toBe('-62px 0px 0px 0px');

    // The app reports a new inset: the engine rewrites the variable.
    await act(async () => {
      document.documentElement.style.setProperty('--app-safe-area-top', '47px');
    });
    expect(pinMargins().at(-1)).toBe('-47px 0px 0px 0px');
  });

  it("opens with the status-bar strip, before anything else in the header, hidden from screen readers", () => {
    const { container } = render(<Header />);
    const strip = container.querySelector('header')!.firstElementChild!;
    expect(strip.className).toBe('site-header__safe-area');
    expect(strip.getAttribute('aria-hidden')).toBe('true');
  });

  it('a pinned announcement bar takes over from the header: the header never pins', () => {
    state.theme = {
      settings: { announcement_sticky: true, announcement_text: 'خصم' },
    };
    const { container } = render(<Header />);
    scrollPastSentinel();
    expect(container.querySelector('.site-header__bar.is-scrolled')).toBeNull();
  });

  it('draws no colour toggle while dark mode is switched off, even if the old setting is on', () => {
    state.theme = { settings: { dark_mode_toggle: true } };
    expect(render(<Header />).container.querySelector('.site-header__color-mode')).toBeNull();
  });

  it('shows the band text on inner pages only', () => {
    state.theme = { settings: { header_band_text: 'أصالة مضمونة' } };
    state.isHome = false;
    const inner = render(<Header />);
    expect(inner.container.querySelector('.site-header__band')?.textContent).toBe('أصالة مضمونة');
  });

  it('never pins the bar when header_is_sticky is disabled', () => {
    state.theme = { settings: { header_is_sticky: false } };
    const { container } = render(<Header />);
    scrollPastSentinel();
    expect(container.querySelector('.site-header__bar.is-scrolled')).toBeNull();
  });

  it('adds the product-page modifier from route match state, not the body class', () => {
    state.routeIds = ['/{-$locale}/$slug/p{$id}'];
    const { container } = render(<Header />);
    expect(container.querySelector('header.site-header--product')).toBeTruthy();
  });

  it('omits the product-page modifier on other routes', () => {
    state.routeIds = ['/{-$locale}/cart'];
    const { container } = render(<Header />);
    expect(container.querySelector('header.site-header--product')).toBeNull();
  });

  it('adds the home modifier from route match state, so it is in the SSR markup', () => {
    state.routeIds = ['/{-$locale}/'];
    const { container } = render(<Header />);
    expect(container.querySelector('header.site-header--home')).toBeTruthy();
  });

  it('omits the home modifier on other routes', () => {
    state.routeIds = ['/{-$locale}/cart'];
    const { container } = render(<Header />);
    expect(container.querySelector('header.site-header--home')).toBeNull();
  });

  it('reserves the social row when the store has social links', () => {
    state.routeIds = [HOME_ROUTE_ID];
    const { container } = render(<Header />);
    expect(container.querySelector('.site-header__social-slot.has-links')).toBeTruthy();
  });

  it('does not reserve the social row when the store has no social links', () => {
    state.routeIds = [HOME_ROUTE_ID];
    state.store = { ...state.store, social: { twitter: '' } };
    const { container } = render(<Header />);
    expect(container.querySelector('.site-header__social-slot')).toBeTruthy();
    expect(container.querySelector('.site-header__social-slot.has-links')).toBeNull();
  });

  it('does not reserve the social row for WhatsApp alone, which <salla-social> skips', () => {
    state.store = { ...state.store, social: { whatsapp: '966500000000' } };
    const { container } = render(<Header />);
    expect(container.querySelector('.site-header__social-slot.has-links')).toBeNull();
  });

  it("renders the engine's ad bar in the header's ad slot", () => {
    const { getByTestId } = render(<Header />);

    expect(getByTestId('advertisement-bar-render').closest('.site-header__ad')).not.toBeNull();
  });
});

import '@salla.sa/twilight-theme-engine/types';

/** The theme's own settings in `twilight.json`, added to the engine's type. */
declare module '@salla.sa/twilight-theme-engine/types' {
  interface ThemeSettings {
    /** Accent colour override; empty means the store's primary colour. */
    accent_color?: string;
    color_mode?: string | { value?: string }[];
    secondary_color?: string;
    color_page_background?: string;
    color_text_primary?: string;
    color_header_background?: string;
    color_header_text?: string;
    color_footer_background?: string;
    color_footer_text?: string;
    color_icons?: string;
    button_style?: string | { value?: string }[];
    page_gutter?: number | string;
    store_background_image?: string;
    dark_color_page?: string;
    dark_color_section?: string;
    dark_color_card?: string;
    dark_color_text?: string;
    dark_background_image?: string;
    logo_main?: string;
    dark_logo?: string;
    header_logo_height?: number | string;
    dark_mode_toggle?: boolean;
    announcement_enabled?: boolean;
    announcement_text?: string | Record<string, string>;
    announcement_url?: string;
    announcement_bg?: string;
    announcement_text_color?: string;
    announcement_sticky?: boolean;
    announcement_dismissible?: boolean;
    header_band_text?: string | Record<string, string>;
    announcement_bottom_enabled?: boolean;
    footer_logo_height?: number | string;
    photos_slider_title?: string | Record<string, string>;
    gradient_color_start?: string;
    gradient_color_end?: string;
    gradient_on_bars?: boolean;
    gradient_on_buttons?: boolean;
    gradient_on_quantity?: boolean;
  }
}

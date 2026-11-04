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
  }
}

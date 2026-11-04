import '@salla.sa/twilight-theme-engine/types';

/** The theme's own settings in `twilight.json`, added to the engine's type. */
declare module '@salla.sa/twilight-theme-engine/types' {
  interface ThemeSettings {
    /** Accent colour override; empty means the store's primary colour. */
    accent_color?: string;
  }
}

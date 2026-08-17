/**
 * Centralized internationalization configuration.
 *
 * This is the single source of truth for the project's locales. All future
 * phases (content, pages, SEO, forms) should import from here rather than
 * duplicating locale definitions.
 */

export const locales = ["en", "fa", "ru", "vi"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export type Direction = "ltr" | "rtl";

export type FontFamily = "inter" | "vazirmatn";

export interface LocaleConfig {
  /** Human-readable language name (used in the locale switcher). */
  label: string;
  /*
   * No `flag` field: the switcher renders flags as inline SVG via
   * `components/layout/LocaleFlag`. Flag emoji have no glyph on Chrome for
   * Windows (and most Linux builds) and fall back to tofu/letter boxes.
   */
  /** BCP-47 language tag for the `<html lang>` attribute. */
  language: string;
  /** Text direction applied to `<html dir>`. */
  direction: Direction;
  /** Font family applied to this locale (see the project typography spec). */
  font: FontFamily;
}

export const localeConfig: Record<Locale, LocaleConfig> = {
  en: {
    label: "English",
    language: "en",
    direction: "ltr",
    font: "inter",
  },
  fa: {
    label: "فارسی",
    language: "fa",
    direction: "rtl",
    font: "vazirmatn",
  },
  ru: {
    label: "Русский",
    language: "ru",
    direction: "ltr",
    font: "inter",
  },
  vi: {
    label: "Tiếng Việt",
    language: "vi",
    direction: "ltr",
    font: "inter",
  },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

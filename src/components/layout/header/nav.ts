import { localeConfig, locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

/**
 * Pure navigation data for the header (Roadmap Task 6.1).
 *
 * Building the nav items and locale-switch links is pure (dictionary + pathname
 * → data), so it lives outside the client component: it is independently
 * testable and never re-created as an effect.
 */

export interface NavItem {
  label: string;
  href: string;
}

export interface LocaleLink {
  code: Locale;
  label: string;
  href: string;
}

/** Home is exact-match only; every other item also matches nested routes. */
export function isActivePath(pathname: string, href: string, isHome: boolean): boolean {
  if (isHome) return pathname === href || pathname === `${href}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Localized nav items shared by the desktop bar and the mobile modal. */
export function buildNavItems(dictionary: Dictionary): NavItem[] {
  return [
    { label: dictionary.nav.home, href: "/" },
    { label: dictionary.nav.products, href: "/products" },
    { label: dictionary.nav.markets, href: "/markets" },
    { label: dictionary.nav.supplyChain, href: "/supply-chain" },
    { label: dictionary.nav.blog, href: "/blog" },
    { label: dictionary.nav.about, href: "/about" },
    { label: dictionary.nav.contact, href: "/contact" },
  ];
}

/**
 * Locale-switch links that preserve the current route. The path suffix after
 * the active locale prefix is re-prefixed with each target locale
 * (e.g. /en/products → /fa/products).
 */
export function buildLocaleLinks(locale: Locale, pathname: string): LocaleLink[] {
  const pathSuffix =
    pathname === `/${locale}` ? "" : pathname.replace(`/${locale}`, "");
  return locales.map((code) => ({
    code,
    label: localeConfig[code].label,
    href: `/${code}${pathSuffix}`,
  }));
}

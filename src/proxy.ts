import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { defaultLocale, locales } from "@/lib/i18n/config";

/**
 * Locale-aware routing proxy.
 *
 * The URL is the source of truth for the active locale:
 *   - A valid locale prefix (/en, /fa, /ru, /vi) passes through untouched.
 *   - `/` redirects to the default locale (`/en`).
 *   - Any other non-locale path is normalized under the default locale so
 *     future routes (e.g. /products → /en/products) remain predictable.
 *
 * Static assets, image optimizations, API routes and public files are excluded
 * via the matcher so this never interferes with them.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const activeLocale = locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  // Already on an explicit locale URL — do not redirect. Stamp the resolved
  // locale so the global not-found (which bypasses layouts and route params)
  // can still render localized content.
  if (activeLocale) {
    const response = NextResponse.next();
    response.headers.set("x-locale", activeLocale);
    return response;
  }

  // Root request → default locale.
  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }

  // Any other non-locale path → default locale, preserving the path.
  return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url));
}

export const config = {
  matcher: [
    // Exclude API routes, the CMS admin entry, Next static/image assets, and
    // common static file extensions (images, fonts, css, js, etc.) so the proxy
    // only handles navigable page requests.
    "/((?!api|admin|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|css|js|mp4|webm)$).*)",
  ],
};

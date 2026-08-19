import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { defaultLocale, locales } from "@/lib/i18n/config";

/**
 * Locale-aware routing proxy.
 *
 * The URL is the source of truth for the active locale:
 *   - A valid locale prefix (/en, /fa, /ru, /vi) passes through untouched.
 *   - `/` redirects permanently (308) to the default locale (`/en`).
 *   - Any other non-locale path is normalized under the default locale so
 *     future routes (e.g. /products → /en/products) remain predictable.
 *
 * Redirects are **308 Permanent** (audit SEO-L1, Roadmap Task 5.6) and preserve
 * the query string, so structural normalization is a one-time permanent signal
 * rather than a recurring temporary hop, and link equity/share URLs that carry
 * query parameters (e.g. `?product=`) keep them.
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

  // Clone the request URL so the query string survives the redirect, then
  // rewrite only the pathname to the default-locale target.
  const target = request.nextUrl.clone();

  // Root request → default locale.
  if (pathname === "/") {
    target.pathname = `/${defaultLocale}`;
    return NextResponse.redirect(target, { status: 308 });
  }

  // Any other non-locale path → default locale, preserving the path.
  target.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(target, { status: 308 });
}

export const config = {
  matcher: [
    // Exclude API routes, the CMS admin entry, Next static/image assets, and
    // common static file extensions (images, fonts, css, js, etc.) so the proxy
    // only handles navigable page requests.
    "/((?!api|admin|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|css|js|mp4|webm)$).*)",
  ],
};

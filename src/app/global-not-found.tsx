import { localeConfig } from "@/lib/i18n/config";
import { statusStrings } from "@/lib/i18n/dictionaries/status";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { NotFoundContent } from "@/components/not-found/NotFoundContent";

import "./globals.css";

/**
 * Self-contained document: the global not-found bypasses all layouts, so it
 * provides its own html/body and styles. Locale is recovered from the
 * `x-locale` header stamped by the proxy.
 *
 * Fonts are self-hosted via @font-face in globals.css (Task 7.1): the body
 * picks Inter (LTR) or Vazirmatn (RTL) from `--font-sans`/`--font-fa`; only the
 * applied family is fetched; the active family is preloaded once.
 */
export default async function GlobalNotFound() {
  const locale = await getRequestLocale();
  const config = localeConfig[locale];
  const fontPreload =
    locale === "fa" ? "/fonts/Vazirmatn-Variable.woff2" : "/fonts/Inter-Variable.woff2";

  return (
    <html lang={config.language} dir={config.direction}>
      <body className="antialiased">
        <link
          rel="preload"
          href={fontPreload}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <NotFoundContent locale={locale} notFound={statusStrings[locale].notFound} />
      </body>
    </html>
  );
}

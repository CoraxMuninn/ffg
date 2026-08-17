import localFont from "next/font/local";

import { localeConfig } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { NotFoundContent } from "@/components/not-found/NotFoundContent";

import "./globals.css";

// Self-contained document: the global not-found bypasses all layouts, so it
// must provide its own html/body, fonts, and styles. Locale is recovered from
// the `x-locale` header stamped by the proxy.
const inter = localFont({
  src: [
    {
      path: "../../public/fonts/Inter-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

const vazirmatn = localFont({
  src: [
    {
      path: "../../public/fonts/Vazirmatn-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-fa",
  display: "swap",
});

export default async function GlobalNotFound() {
  const locale = await getRequestLocale();

  const config = localeConfig[locale];
  const dictionary = getDictionary(locale);

  return (
    <html
      lang={config.language}
      dir={config.direction}
      className={`${inter.variable} ${vazirmatn.variable}`}
    >
      <body className="antialiased">
        <NotFoundContent locale={locale} dictionary={dictionary} />
      </body>
    </html>
  );
}

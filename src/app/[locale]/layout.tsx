import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { isLocale, localeConfig, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { SITE_URL } from "@/lib/seo/config";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import "../globals.css";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#0a1628",
  colorScheme: "light",
};

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dictionary = getDictionary(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${dictionary.brand} | ${dictionary.meta.title}`,
      template: `%s | ${dictionary.brand}`,
    },
    description: dictionary.meta.description,
    applicationName: dictionary.brand,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const config = localeConfig[locale];
  const dictionary = getDictionary(locale);

  // Per-locale font loading (Roadmap Task 7.1 / PERF-M1): fonts are self-hosted
  // via @font-face in globals.css. A @font-face file is only fetched when its
  // family is applied to rendered text (Inter for LTR locales via
  // var(--font-sans); Vazirmatn for the Persian/RTL locale via var(--font-fa)).
  // A single conditional <link rel="preload"> (hoisted to <head>) prioritizes
  // the one family the page actually uses, so EN/RU/VI fetch Inter alone and FA
  // fetches Vazirmatn alone — eliminating the reported 463 KB forced dual-font
  // preload.
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:bg-cyan-brand focus:px-4 focus:py-2 focus:text-white"
        >
          {dictionary.header.skipToContent}
        </a>
        <Header locale={locale} dictionary={dictionary} />
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
        <Footer locale={locale} dictionary={dictionary} />
        <ScrollToTop label={dictionary.header.scrollToTop} />
      </body>
    </html>
  );
}

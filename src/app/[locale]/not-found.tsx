"use client";

import { useParams } from "next/navigation";

import { defaultLocale, isLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { NotFoundContent } from "@/components/not-found/NotFoundContent";

/**
 * In-context 404 for `notFound()` calls within the `[locale]` segment.
 * Client Component so `useParams` can read the locale without `headers()`,
 * which would opt the whole `[locale]` segment out of SSG.
 */
export default function NotFound() {
  const params = useParams<{ locale: string }>();
  const locale: Locale = isLocale(params?.locale) ? params.locale : defaultLocale;
  const dictionary = getDictionary(locale);

  return <NotFoundContent locale={locale} dictionary={dictionary} />;
}

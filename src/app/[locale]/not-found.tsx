"use client";

import { useParams } from "next/navigation";

import { defaultLocale, isLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { statusStrings } from "@/lib/i18n/dictionaries/status";
import { NotFoundContent } from "@/components/not-found/NotFoundContent";

/**
 * In-context 404 for `notFound()` calls within the `[locale]` segment.
 * Client Component so `useParams` can read the locale without `headers()`,
 * which would opt the whole `[locale]` segment out of SSG.
 *
 * Imports only the minimal `statusStrings` contract (not the full dictionary)
 * so this client chunk stays small (Roadmap Task 7.2 / PERF-M2).
 */
export default function NotFound() {
  const params = useParams<{ locale: string }>();
  const locale: Locale = isLocale(params?.locale) ? params.locale : defaultLocale;

  return <NotFoundContent locale={locale} notFound={statusStrings[locale].notFound} />;
}

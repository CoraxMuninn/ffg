"use client";

import { useParams } from "next/navigation";

import { defaultLocale, isLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { statusStrings } from "@/lib/i18n/dictionaries/status";

/**
 * Segment loading UI (audit UX-L3, Roadmap Task 4.9).
 *
 * Keeps the existing visual dots but gives the status one meaningful,
 * localized accessible name (screen-reader text) so assistive technology
 * announces "Loading…" once per navigation instead of a silent indicator.
 * Client Component so it can read the active locale from the route params
 * without opting the segment out of static rendering via headers().
 *
 * Imports only the minimal `statusStrings` contract (not the full dictionary)
 * so this client chunk stays tiny (Roadmap Task 7.2 / PERF-M2).
 */
export default function Loading() {
  const params = useParams<{ locale: string }>();
  const locale: Locale = isLocale(params?.locale) ? params.locale : defaultLocale;

  return (
    <section
      role="status"
      aria-live="polite"
      className="min-h-[70vh] flex flex-col items-center justify-center px-4"
    >
      <div className="flex items-center gap-2 mb-5" aria-hidden="true">
        <span className="w-3 h-3 rounded-full bg-cyan-brand animate-pulse" />
        <span
          className="w-3 h-3 rounded-full bg-cyan-brand/60 animate-pulse"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-3 h-3 rounded-full bg-cyan-brand/30 animate-pulse"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <p className="sr-only">{statusStrings[locale].loading.label}</p>
    </section>
  );
}

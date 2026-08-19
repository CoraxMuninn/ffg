import Link from "next/link";
import { Home, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import type { NotFoundStrings } from "@/lib/i18n/dictionaries/status";

interface NotFoundContentProps {
  locale: Locale;
  notFound: NotFoundStrings;
}

/**
 * Shared, localized 404 content.
 *
 * Rendered by both the in-context segment not-found (inside the `[locale]`
 * layout) and the self-contained global not-found (unmatched routes), so the
 * two 404 layers share a single visual implementation.
 *
 * Takes only the minimal `NotFoundStrings` contract (not the full dictionary),
 * so the client segment not-found does not pull the whole dictionary into its
 * chunk (Roadmap Task 7.2 / PERF-M2).
 */
export function NotFoundContent({ locale, notFound }: NotFoundContentProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-navy overflow-hidden">
      {/* Subtle background treatment */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        aria-hidden
        className="absolute -top-24 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 w-[560px] h-[560px] rounded-full bg-cyan-brand/10 blur-3xl"
      />

      <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-semibold tracking-[0.35em] text-cyan-light uppercase mb-6">
          {notFound.eyebrow}
        </p>

        <p
          aria-hidden
          className="mb-6 text-7xl font-black leading-none text-white sm:text-8xl lg:text-9xl"
        >
          404
        </p>

        <h1 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
          {notFound.title}
        </h1>

        <p className="text-silver text-base sm:text-lg leading-relaxed mb-10 max-w-md mx-auto">
          {notFound.message}
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href={`/${locale}`}>
              <Home className="h-5 w-5" />
              {notFound.home}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline-inverse">
            <Link href={`/${locale}/products`}>
              <Package className="h-5 w-5" />
              {notFound.secondary}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

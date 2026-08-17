import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { Market } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { marketPath } from "@/lib/i18n/routes";
import { cn } from "@/lib/utils";

interface MarketCardProps {
  market: Market;
  locale: Locale;
  dictionary: Dictionary;
}

/**
 * Homepage market card — image-led, country name only.
 *
 * The card carries no descriptive copy: at this point in the page the job is
 * recognition, not explanation. The per-market detail lives on the Markets
 * page, which this section links to.
 *
 * The primary market (Vietnam) is distinguished in two ways rather than one,
 * so the hierarchy survives both a colour-blind reading and a glance:
 * a glass status panel pinned to the TOP of the card, and a cyan ring around
 * the card itself. The panel sits at the top because that is the first thing
 * scanned, and because the bottom of the frame is already occupied by the
 * country name.
 *
 * The whole card is a single semantic <Link> to that market's detail page
 * (e.g. /en/markets/vietnam), locale-aware via `marketPath`. Using a real
 * anchor rather than an onClick handler keeps keyboard navigation, middle
 * click, and "open in new tab" working, and adds no client-side JavaScript.
 */
export function MarketCard({ market, locale, dictionary }: MarketCardProps) {
  return (
    <Link
      href={marketPath(locale, market.slug)}
      className={cn(
        "group relative block h-80 overflow-hidden rounded-2xl md:h-100",
        // Visible keyboard focus, matching the site's cyan focus treatment.
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-light focus-visible:ring-offset-2 focus-visible:ring-offset-navy",
        // Ring is drawn inside the radius so it never clips against the grid gap.
        market.primary && "ring-1 ring-cyan-brand/50 ring-inset",
      )}
    >
      {market.image ? (
        <Image
          src={market.image}
          alt={market.imageAlt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-navy-light text-silver">
          {market.title}
        </div>
      )}

      {/* Scrim. Weighted to the bottom for the country name, with a light top
          wash so the primary panel keeps contrast over bright skylines. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-navy/90 via-navy/20 to-navy/30"
      />

      {/* ── Primary market status (Vietnam) ── */}
      {market.primary && (
        <div className="absolute inset-x-3 top-3 sm:inset-x-4 sm:top-4">
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-cyan-500/40 px-3 py-2 shadow-[0_8px_28px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md sm:px-3.5">
            <span
              aria-hidden
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-light animate-bounce"
            />
            <span className="text-[10px] font-semibold uppercase leading-none tracking-[0.16em] text-white sm:text-[11px] sm:tracking-[0.18em]">
              {dictionary.homepage.primaryMarket}
            </span>
          </div>
        </div>
      )}

      {/* ── Country name ── */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3
            className={cn(
              "font-bold text-white",
              market.primary ? "text-xl sm:text-2xl" : "text-xl",
            )}
          >
            {market.title}
          </h3>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border backdrop-blur-sm transition-colors",
              market.primary
                ? "border-cyan-brand/60 bg-cyan-brand/25 group-hover:border-cyan-brand group-hover:bg-cyan-brand"
                : "border-white/20 bg-white/10 group-hover:border-cyan-brand group-hover:bg-cyan-brand",
            )}
          >
            <ArrowUpRight
              aria-hidden
              className="h-5 w-5 text-white rtl:-scale-x-100"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

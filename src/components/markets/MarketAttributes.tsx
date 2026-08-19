import { Check, FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Market } from "@/lib/content";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

/**
 * Market "focus" and "documents" subsections (Roadmap Task 6.3).
 *
 * These two attribute lists were inlined (and tone-branched) inside
 * `MarketPanel`. They are extracted here so the large panel module stays
 * reviewable and the tone→colour mapping lives in one place. The two supported
 * tones match the panel's surfaces exactly:
 *
 *  - `light` — secondary markets on a white card (cyan-brand accents, ink text).
 *  - `dark`  — the primary market on the midnight panel (cyan-light accents,
 *    silver text).
 *
 * No visual change: the class strings are the originals, just centralized.
 */
export type MarketTone = "light" | "dark";

const accentClass: Record<MarketTone, string> = {
  light: "text-cyan-brand",
  dark: "text-cyan-light",
};

const textClass: Record<MarketTone, string> = {
  light: "text-ink",
  dark: "text-silver",
};

const chipClass: Record<MarketTone, string> = {
  light: "border-navy/10 bg-smoke text-navy",
  dark: "border-white/15 bg-white/8 text-white/85",
};

const headingClass =
  "mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]";

export function MarketFocusList({
  market,
  dictionary,
  tone,
}: {
  market: Market;
  dictionary: Dictionary;
  tone: MarketTone;
}) {
  if (market.focus.length === 0) return null;
  return (
    <div>
      <h3 className={cn(headingClass, accentClass[tone])}>
        {dictionary.markets.focusHeading}
      </h3>
      <ul className="space-y-2">
        {market.focus.map((point) => (
          <li key={point} className="flex items-start gap-2.5">
            <Check
              aria-hidden
              className={cn("mt-0.5 h-4 w-4 shrink-0", accentClass[tone])}
            />
            <span className={cn("text-sm leading-relaxed", textClass[tone])}>
              {point}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketDocuments({
  market,
  dictionary,
  tone,
}: {
  market: Market;
  dictionary: Dictionary;
  tone: MarketTone;
}) {
  if (market.documents.length === 0) return null;
  return (
    <div>
      <h3 className={cn(headingClass, accentClass[tone])}>
        {dictionary.markets.documentsHeading}
      </h3>
      <ul className="flex flex-wrap gap-2">
        {market.documents.map((document) => (
          <li
            key={document}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium",
              chipClass[tone],
            )}
          >
            <FileText aria-hidden className="h-3.5 w-3.5 shrink-0 opacity-70" />
            {document}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Wrapper that renders the two attribute columns behind a divider when either
 * has content. Kept here so panels/detail pages share one grid + border rule.
 */
export function MarketAttributes({
  market,
  dictionary,
  tone,
  className,
}: {
  market: Market;
  dictionary: Dictionary;
  tone: MarketTone;
  className?: string;
}) {
  if (market.focus.length === 0 && market.documents.length === 0) return null;
  return (
    <div className={cn("mt-5 grid grid-cols-1 gap-5 border-t pt-5 sm:gap-6 md:grid-cols-2", className)}>
      <MarketFocusList market={market} dictionary={dictionary} tone={tone} />
      <MarketDocuments market={market} dictionary={dictionary} tone={tone} />
    </div>
  );
}

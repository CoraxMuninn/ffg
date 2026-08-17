import { Icon } from "@/components/shared/Icon";
import { Reveal } from "@/components/shared/Reveal";
import { cn } from "@/lib/utils";

interface RailStage {
  slug: string;
  title: string;
  icon: string;
}

interface SupplyChainRailProps {
  stages: RailStage[];
  className?: string;
}

/**
 * Icon-first supply-chain rail: a single horizontal run of stage tiles joined
 * by animated arrows, from origin through to destination delivery.
 *
 * Server Component with no client JavaScript. Hover states are CSS-only and
 * the arrow motion is a single keyframed stroke offset, so the whole section
 * costs one `Reveal` observer and nothing else at runtime.
 *
 * Labels are absolutely positioned beneath each tile so every list item
 * measures exactly one tile tall. That keeps the connecting arrows optically
 * centred on the icons regardless of how many lines a translated label wraps
 * to — important for the longer Russian and Vietnamese stage names.
 */
export function SupplyChainRail({ stages, className }: SupplyChainRailProps) {
  return (
    <Reveal>
      {/* Mobile keeps the single-row concept via an inner scroll area, so the
          page itself never overflows. A mask fades the trailing edge to signal
          that more stages continue off-screen; it is removed once the whole
          rail fits (xl and up). */}
      <div className={cn("supply-rail relative", className)}>
        <ol
          className={cn(
            "flex items-center overflow-x-auto pb-16 pt-2",
            // Padding only while the rail scrolls; at xl it fits exactly and
            // any extra inline padding would force a needless scrollbar.
            "px-1 xl:px-0",
            // hide the scrollbar chrome; the fades communicate scrollability
            "supply-rail-scroll",
          )}
        >
          {stages.map((stage, index) => {
            const isLast = index === stages.length - 1;

            return (
              <li
                key={stage.slug}
                className={cn("flex shrink-0 items-center", !isLast && "grow")}
              >
                {/* Stage tile + label */}
                <div className="group relative shrink-0">
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-2xl border bg-white",
                      "h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16",
                      "border-gray-200 shadow-[0_1px_2px_rgba(10,22,40,0.04)]",
                      "transition-all duration-300 ease-out",
                      "group-hover:-translate-y-1 group-hover:scale-110",
                      "group-hover:border-navy group-hover:bg-navy",
                      "group-hover:shadow-[0_14px_30px_-10px_rgba(8,145,178,0.55)]",
                    )}
                  >
                    <Icon
                      name={stage.icon}
                      className={cn(
                        "h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7",
                        "text-cyan-brand transition-all duration-300 ease-out",
                        "group-hover:scale-110 group-hover:text-cyan-light",
                      )}
                    />
                  </div>

                  {/* Ordinal, sits above the tile */}
                  <span
                    className="pointer-events-none absolute -top-1 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 font-mono text-[10px] font-semibold tabular-nums text-silver/60 transition-colors duration-300 group-hover:text-cyan-brand"
                    aria-hidden
                  ></span>

                  {/* Labels are centred on the tile and wider than it, so the
                      first and last would overhang the rail and create scroll
                      width. Clamping to the tile keeps the row exact; the text
                      is allowed to spill visually without affecting layout. */}
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-x-0 top-full mt-3",
                      "text-center text-[10px] sm:text-[11px] font-medium leading-tight",
                      "text-silver transition-colors duration-300 group-hover:text-navy",
                    )}
                  >
                    {stage.title}
                  </span>
                </div>

                {/* Connector */}
                {!isLast && (
                  <span
                    aria-hidden
                    className="supply-rail-connector mx-1.5 flex h-3 min-w-6 flex-1 items-center sm:mx-2 lg:mx-3"
                  >
                    <svg
                      viewBox="0 0 48 12"
                      className="supply-rail-arrow h-3 w-full text-cyan-brand/45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 6h36" strokeDasharray="3 4" />
                      <path d="M37 2.5 41.5 6 37 9.5" />
                    </svg>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </Reveal>
  );
}

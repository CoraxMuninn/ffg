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
  /** Localized, descriptive name + scroll instruction for the region (UX-M6). */
  ariaLabel: string;
  className?: string;
}

/**
 * Icon-first supply-chain rail: a single horizontal run of stage tiles joined
 * by animated arrows, from origin through to destination delivery.
 *
 * Accessibility (audit UX-M6, Roadmap Task 4.7): the horizontal scroll area is
 * a named, focusable region — but the region WRAPS the list rather than
 * replacing it, so the `<ol>` keeps its native list semantics (otherwise its
 * `<li>` children would fail `listitem`). The region is keyboard-operable (arrow
 * keys scroll once focused) and announced by its label. Labels sit in a
 * reserved-height row decoupled from the icon size, wrap within a fixed width,
 * and break long words so translated stage names never overlap or clip.
 *
 * Server Component with no client JavaScript.
 */
export function SupplyChainRail({ stages, ariaLabel, className }: SupplyChainRailProps) {
  return (
    <Reveal>
      <div className={cn("supply-rail relative", className)}>
        <div
          role="region"
          aria-label={ariaLabel}
          tabIndex={0}
          className={cn(
            "overflow-x-auto px-1 pb-20 pt-2 xl:px-0",
            "rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-brand/40",
            "supply-rail-scroll",
          )}
        >
          <ol className="flex items-center">
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

                    {/* Label: reserved-height row under the tile, decoupled from
                        icon size; fixed width + word-break so translated names
                        wrap cleanly without overlapping neighbours or clipping. */}
                    <span
                      className={cn(
                        "pointer-events-none absolute left-1/2 top-full mt-3 w-[5.5rem]",
                        "-translate-x-1/2 rtl:translate-x-1/2",
                        "text-center text-[10px] sm:text-[11px] font-medium leading-tight",
                        "text-ink-soft hyphens-auto break-words transition-colors duration-300",
                        "group-hover:text-navy",
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
      </div>
    </Reveal>
  );
}

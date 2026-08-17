import { Icon } from "@/components/shared/Icon";
import { Reveal } from "@/components/shared/Reveal";
import { cn } from "@/lib/utils";

interface FlowStep {
  slug: string;
  title: string;
  description: string;
  icon: string;
}

interface SupplyChainFlowProps {
  steps: FlowStep[];
  /**
   * "light" renders on white/smoke backgrounds (full Supply Chain page);
   * "dark" renders on the navy homepage section.
   */
  tone?: "light" | "dark";
  /** Steps per row on desktop. Compact previews use fewer, wider columns. */
  columns?: 3 | 4;
  className?: string;
}

/**
 * Step → arrow → step progression for the supply chain.
 *
 * Server Component. All motion is CSS-only (`group-hover` transitions plus a
 * keyframed arrow) and entrance uses the existing IntersectionObserver-based
 * `Reveal`, so this ships no additional client JavaScript and no animation
 * library.
 *
 * Layout: a compact 2-column grid on mobile (the full process fits without
 * a long stacked scroll) and a flex row that wraps on desktop. Connectors
 * are desktop-only flex items so they never occupy a mobile grid cell.
 */
export function SupplyChainFlow({
  steps,
  tone = "light",
  columns = 4,
  className,
}: SupplyChainFlowProps) {
  const isDark = tone === "dark";

  // Fixed basis so cards form even rows and the connectors sit between them.
  const basis =
    columns === 3
      ? "lg:basis-[calc((100%-2*3.5rem)/3)]"
      : "lg:basis-[calc((100%-3*2.5rem)/4)]";

  return (
    <ol
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-4",
        "lg:flex lg:flex-row lg:flex-wrap lg:items-stretch lg:gap-3",
        columns === 3 ? "lg:gap-y-10" : "lg:gap-y-8",
        className,
      )}
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        // On desktop the row wraps here, so the connector would point at empty
        // space. Hidden on mobile where order is conveyed by the step number.
        const isRowEnd = index % columns === columns - 1;
        // Stagger only within a row so later rows are not left waiting.
        const delay = (index % columns) * 90;

        return (
          <li
            key={step.slug}
            className={cn("lg:flex lg:flex-row lg:items-center", basis, "lg:grow")}
          >
            <Reveal delay={delay} className="w-full">
              <div
                className={cn(
                  "group relative flex h-full w-full flex-col rounded-2xl border p-3.5 sm:p-4 lg:p-6 transition-all duration-300 ease-out",
                  "hover:-translate-y-1",
                  isDark
                    ? "border-white/10 bg-white/[0.04] hover:border-cyan-light/40 hover:bg-white/[0.07] hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)]"
                    : "border-gray-200 bg-white hover:border-cyan-brand/40 hover:shadow-card-hover",
                )}
              >
                <span
                  className={cn(
                    "absolute end-3 top-3 font-mono text-[10px] font-semibold tabular-nums transition-colors duration-300 lg:end-5 lg:top-5 lg:text-xs",
                    isDark
                      ? "text-white/25 group-hover:text-cyan-light/70"
                      : "text-silver/50 group-hover:text-cyan-brand/70",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div
                  className={cn(
                    "mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ease-out lg:mb-5 lg:h-12 lg:w-12",
                    "group-hover:-translate-y-0.5 group-hover:scale-105",
                    isDark
                      ? "border-cyan-light/25 bg-cyan-light/10 group-hover:border-cyan-light/60 group-hover:bg-cyan-light/20"
                      : "border-cyan-brand/25 bg-cyan-brand/[0.07] group-hover:border-cyan-brand/60 group-hover:bg-cyan-brand/[0.12]",
                  )}
                >
                  <Icon
                    name={step.icon}
                    className={cn(
                      "h-5 w-5 transition-transform duration-300 ease-out group-hover:scale-110 lg:h-6 lg:w-6",
                      isDark ? "text-cyan-light" : "text-cyan-brand",
                    )}
                  />
                </div>

                <h3
                  className={cn(
                    "mb-1 pe-7 text-sm font-bold leading-snug lg:mb-1.5 lg:pe-8 lg:text-base",
                    isDark ? "text-white" : "text-navy",
                  )}
                >
                  {step.title}
                </h3>
                <p
                  className={cn(
                    "text-xs leading-relaxed lg:text-sm",
                    isDark ? "text-silver" : "text-ink",
                  )}
                >
                  {step.description}
                </p>

                <span
                  aria-hidden
                  className={cn(
                    "mt-auto block h-px w-0 origin-left transition-all duration-500 ease-out group-hover:w-full",
                    "pt-0",
                    isDark ? "bg-cyan-light/50" : "bg-cyan-brand/40",
                  )}
                />
              </div>
            </Reveal>

            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "flow-connector hidden shrink-0 items-center justify-center lg:flex",
                  isRowEnd ? "lg:hidden" : columns === 3 ? "lg:w-14" : "lg:w-10",
                )}
              >
                <svg
                  viewBox="0 0 44 12"
                  className={cn(
                    "flow-arrow h-3 w-full",
                    isDark ? "text-cyan-light/55" : "text-cyan-brand/50",
                  )}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 6h32" strokeDasharray="3 3.5" />
                  <path d="M33 2.5 37.5 6 33 9.5" />
                </svg>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

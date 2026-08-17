import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Reveal } from "@/components/shared/Reveal";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

interface MarketProcessProps {
  dictionary: Dictionary;
}

/**
 * The sequence a first order follows, identical in every market.
 *
 * Sits between the destination panels and the CTA to answer the question a
 * buyer has after reading the market copy — "so how does this actually start?"
 * — without repeating the supply-chain page, which covers physical movement
 * rather than the commercial sequence.
 */
export function MarketProcess({ dictionary }: MarketProcessProps) {
  const steps = dictionary.markets.workingSteps;
  if (steps.length === 0) return null;

  return (
    <section className="bg-navy py-16 sm:py-20 lg:py-28">
      <Container>
        <SectionHeading
          tone="dark"
          eyebrow={dictionary.nav.markets}
          title={dictionary.markets.workingHeading}
          intro={dictionary.markets.workingIntro}
          className="mb-10 sm:mb-14"
        />
        <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            // Reveal renders a <div>, so it sits inside the <li> rather than
            // wrapping it — a <div> is not valid as a direct child of <ol>.
            <li key={step.title} className="bg-navy">
              <Reveal from="up" delay={index * 70} className="h-full p-6 sm:p-7">
                <span className="text-xs font-semibold tabular-nums text-cyan-light">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-base font-bold text-white sm:text-lg">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-silver">
                  {step.text}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

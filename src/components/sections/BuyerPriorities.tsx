import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { CapabilityGrid } from "@/components/shared/CapabilityGrid";
import { getCapabilities } from "@/lib/content";

import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

interface BuyerPrioritiesProps {
  locale: Locale;
  dictionary: Dictionary;
}

export default function BuyerPriorities({ locale, dictionary }: BuyerPrioritiesProps) {
  const capabilities = getCapabilities(locale);

  return (
    <section className="bg-smoke py-16 lg:py-20">
      <Container>
        <SectionHeading
          title={dictionary.homepage.buyerPrioritiesHeading}
          intro={dictionary.homepage.buyerPrioritiesIntro}
          className="mb-8 lg:mb-10"
        />
        <CapabilityGrid capabilities={capabilities} />
      </Container>
    </section>
  );
}

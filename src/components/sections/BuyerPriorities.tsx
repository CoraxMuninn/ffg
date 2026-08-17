import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { CapabilityCard } from "@/components/shared/cards/CapabilityCard";
import { getCapabilities } from "@/lib/content";

import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

interface BuyerPrioritiesProps {
  locale: Locale;
  dictionary: Dictionary;
}

export default function BuyerPriorities({
  locale,
  dictionary,
}: BuyerPrioritiesProps) {
  const capabilities = getCapabilities(locale);

  return (
    <section className="bg-navy-glass/5 backdrop-blur-3xl py-20 lg:py-28">
      <Container>
        <SectionHeading
          title={dictionary.homepage.buyerPrioritiesHeading}
          intro={dictionary.homepage.buyerPrioritiesIntro}
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((capability) => (
            <CapabilityCard key={capability.slug} capability={capability} />
          ))}
        </div>
      </Container>
    </section>
  );
}

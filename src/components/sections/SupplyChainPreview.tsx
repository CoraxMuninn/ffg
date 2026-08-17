import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Reveal } from "@/components/shared/Reveal";
import { SupplyChainRail } from "@/components/supply-chain/SupplyChainRail";
import { localizedPath } from "@/lib/i18n/routes";
import { getSupplyChainSteps } from "@/lib/content";

import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

interface SupplyChainPreviewProps {
  locale: Locale;
  dictionary: Dictionary;
}

/**
 * Homepage supply-chain section.
 *
 * Deliberately reduced to an icon-first rail: the full stage descriptions live
 * on /supply-chain, so this acts as a visual process indicator rather than a
 * content block. Stages come from the same CMS collection as the full page.
 */
export default function SupplyChainPreview({
  locale,
  dictionary,
}: SupplyChainPreviewProps) {
  const stages = getSupplyChainSteps(locale);

  return (
    <section className="bg-navy-glass/10 py-20 backdrop-blur-3xl lg:py-28">
      <Container>
        <SectionHeading
          title={dictionary.homepage.supplyChainHeading}
          intro={dictionary.homepage.supplyChainIntro}
        />

        <SupplyChainRail stages={stages} className="mt-14" />

        <Reveal>
          <div className="mt-6 flex justify-center">
            <Button asChild>
              <Link href={localizedPath(locale, "/supply-chain")}>
                {dictionary.homepage.viewSupplyChain}
                <ArrowRight data-icon="end" className="h-5 w-5 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

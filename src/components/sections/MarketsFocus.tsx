import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { MarketCard } from "@/components/shared/cards/MarketCard";
import { localizedPath } from "@/lib/i18n/routes";
import { getMarkets } from "@/lib/content";

import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

interface MarketsFocusProps {
  locale: Locale;
  dictionary: Dictionary;
}

export default function MarketsFocus({ locale, dictionary }: MarketsFocusProps) {
  const markets = getMarkets(locale);

  return (
    <section className="bg-navy py-20 lg:py-28">
      <Container>
        <SectionHeading
          tone="dark"
          title={dictionary.homepage.marketsHeading}
          intro={dictionary.homepage.marketsIntro}
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {markets.map((market) => (
            <MarketCard
              key={market.slug}
              market={market}
              locale={locale}
              dictionary={dictionary}
            />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button asChild variant="outline-inverse">
            <Link href={localizedPath(locale, "/markets")}>
              {dictionary.cta.exploreAllMarkets}
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}

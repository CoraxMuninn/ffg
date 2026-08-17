import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { CertificationCard } from "@/components/shared/cards/CertificationCard";
import { localizedPath } from "@/lib/i18n/routes";
import { getCertifications } from "@/lib/content";

import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

interface CertificationsProps {
  locale: Locale;
  dictionary: Dictionary;
}

export default function Certifications({ locale, dictionary }: CertificationsProps) {
  const certifications = getCertifications(locale);

  return (
    <section className="bg-navy py-20 lg:py-28">
      <Container>
        <SectionHeading
          tone="dark"
          title={dictionary.homepage.certificationsHeading}
          intro={dictionary.homepage.certificationsIntro}
        />
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 lg:gap-8">
          {certifications.map((certification) => (
            <CertificationCard
              key={certification.slug}
              certification={certification}
            />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button asChild variant="outline-inverse">
            <Link href={localizedPath(locale, "/certifications")}>
              {dictionary.nav.certifications}
              <ArrowRight data-icon="end" className="h-5 w-5 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}

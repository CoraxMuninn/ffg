import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { CertificationGrid } from "@/components/shared/CertificationGrid";
import { localizedPath } from "@/lib/i18n/routes";
import { getCertifications } from "@/lib/content";

import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

interface CertificationsProps {
  locale: Locale;
  dictionary: Dictionary;
}

export default function Certifications({
  locale,
  dictionary,
}: CertificationsProps) {
  const certifications = getCertifications(locale);

  return (
    <section className="relative overflow-hidden bg-navy py-16 lg:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(8,145,178,0.14),transparent_55%)] "
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-light/30 to-transparent"
      />

      <Container className="relative ">
        <SectionHeading
          tone="dark"
          title={dictionary.homepage.certificationsHeading}
          intro={dictionary.homepage.certificationsIntro}
          className="mb-8 lg:mb-10"
        />
        <CertificationGrid certifications={certifications} tone="dark" />
        <div className="mt-8 text-center lg:mt-10">
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

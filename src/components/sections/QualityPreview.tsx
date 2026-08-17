import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { Icon } from "@/components/shared/Icon";
import { getQualityProcesses } from "@/lib/content";
import { localizedPath } from "@/lib/i18n/routes";

import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

interface QualityPreviewProps {
  locale: Locale;
  dictionary: Dictionary;
}

export default function QualityPreview({ locale, dictionary }: QualityPreviewProps) {
  const processes = getQualityProcesses(locale).slice(0, 6);

  return (
    <section className="bg-navy py-20 lg:py-28">
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              {dictionary.homepage.qualityHeading}
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-silver">
              {dictionary.homepage.qualityIntro}
            </p>

            <ul className="mb-8 space-y-3">
              {processes.map((process) => (
                <li key={process.slug} className="flex items-start gap-3">
                  <Icon
                    name={process.icon}
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-brand"
                  />
                  <span className="text-white">{process.title}</span>
                </li>
              ))}
            </ul>

            <Button asChild variant="outline-inverse">
              <Link href={localizedPath(locale, "/quality-control")}>
                {dictionary.homepage.viewProcess}
                <ArrowRight data-icon="end" className="h-5 w-5 rtl:rotate-180" />
              </Link>
            </Button>
          </div>

          <div className="relative h-96 overflow-hidden rounded-2xl shadow-card lg:h-[500px]">
            <Image
              src="/media/quality/poultry-quality-control-line.jpg"
              alt={dictionary.imageAlt.qualityPreview}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

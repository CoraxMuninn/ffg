import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { PageHeader } from "@/components/shared/PageHeader";
import { Prose } from "@/components/shared/Prose";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { contactPath, localizedPath } from "@/lib/i18n/routes";

interface LegalPageProps {
  locale: Locale;
  dictionary: Dictionary;
  title: string;
  intro?: string;
  body: string;
  /** ISO date (YYYY-MM-DD) shown as "last updated", when provided by the CMS. */
  updated?: string;
  /** Sibling legal pages, rendered as cross-links at the end of the document. */
  related: { label: string; href: string }[];
}

/**
 * Shared layout for legal/supporting documents.
 *
 * Server Component with no client-side JavaScript: these pages are pure
 * reading surfaces, so readability is prioritised over interaction. Measure is
 * capped near 70ch and the existing `Prose` renderer supplies the typography,
 * so the design system is reused rather than re-specified here.
 */
export function LegalPage({
  locale,
  dictionary,
  title,
  intro,
  body,
  updated,
  related,
}: LegalPageProps) {
  // Format the date in the active locale; fall back to the raw value.
  let updatedLabel: string | undefined;
  if (updated && !Number.isNaN(Date.parse(updated))) {
    const tag =
      locale === "fa" ? "fa-IR" : locale === "ru" ? "ru-RU" : locale === "vi" ? "vi-VN" : "en-GB";
    updatedLabel = new Intl.DateTimeFormat(tag, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(updated));
  }

  return (
    <>
      <PageHeader eyebrow={dictionary.legal.eyebrow} title={title} intro={intro} />

      <section className="bg-white py-16 lg:py-24">
        <Container>
          <div className="max-w-[70ch]">
            {updatedLabel && (
              <p className="mb-8 border-b border-gray-200 pb-6 text-sm text-label">
                <span className="font-medium text-navy">
                  {dictionary.legal.lastUpdated}:
                </span>{" "}
                <time dateTime={updated}>{updatedLabel}</time>
              </p>
            )}

            <Prose content={body} locale={locale} />

            {/* Cross-links to the sibling legal documents and contact. */}
            <nav
              aria-label={dictionary.legal.eyebrow}
              className="mt-14 border-t border-gray-200 pt-8"
            >
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-label">
                {dictionary.legal.relatedHeading}
              </h2>
              <ul className="flex flex-col gap-3">
                {related.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group/inline inline-flex min-h-11 items-center gap-2 text-sm font-medium text-cyan-link transition-colors duration-[var(--btn-duration)] ease-[var(--btn-ease)] hover:text-cyan-link-hover"
                    >
                      {item.label}
                      <ArrowRight
                        aria-hidden
                        className="h-4 w-4 transition-transform duration-[var(--btn-duration)] ease-[var(--btn-ease)] group-hover/inline:translate-x-0.5 rtl:rotate-180 rtl:group-hover/inline:-translate-x-0.5"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-12 border-t border-gray-200 pt-8">
              <p className="text-base font-semibold text-navy">
                {dictionary.legal.contactHeading}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink">
                {dictionary.legal.contactText}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={contactPath(locale)}>{dictionary.nav.contact}</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={localizedPath(locale, "/")}>
                    {dictionary.cta.backToHome}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

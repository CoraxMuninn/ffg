import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/shared/Container";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  intro?: string;
  /** Optional back-link, matching the product-detail header. */
  back?: { href: string; label: string };
}

/** Navy editorial header used on dedicated subpages. */
export function PageHeader({ eyebrow, title, intro, back }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden bg-navy">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      <Container className="relative py-16 lg:py-20">
        <div className="max-w-3xl">
          {back && (
            <Link
              href={back.href}
              className="group/back mb-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-light transition-colors duration-[var(--btn-duration)] ease-[var(--btn-ease)] hover:text-cyan-brand"
            >
              <ArrowRight className="h-4 w-4 rotate-180 transition-transform duration-[var(--btn-duration)] ease-[var(--btn-ease)] group-hover/back:-translate-x-0.5 rtl:rotate-0 rtl:group-hover/back:translate-x-0.5" />
              {back.label}
            </Link>
          )}
          {eyebrow && (
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-light">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {intro && (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-silver">
              {intro}
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}

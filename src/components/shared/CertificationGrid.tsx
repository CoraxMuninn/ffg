import { CertificationCard } from "@/components/shared/cards/CertificationCard";
import { cn } from "@/lib/utils";

import type { Certification } from "@/lib/content";

interface CertificationGridProps {
  certifications: Certification[];
  /** "dark" sits on navy; "light" sits on white/smoke. */
  tone?: "dark" | "light";
}

/** Shared six-seal tray used on the homepage, About, and Certifications page. */
export function CertificationGrid({
  certifications,
  tone = "dark",
}: CertificationGridProps) {
  return (
    <ul
      className={cn(
        "trust-tray cert-tray ",
        tone === "light" && "trust-tray--light",
      )}
    >
      {certifications.map((certification) => (
        <li key={certification.slug}>
          <CertificationCard certification={certification} tone={tone} />
        </li>
      ))}
    </ul>
  );
}

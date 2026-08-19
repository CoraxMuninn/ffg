import Image from "next/image";
import { BadgeCheck } from "lucide-react";

import type { Certification } from "@/lib/content";
import { cn } from "@/lib/utils";

interface CertificationCardProps {
  certification: Certification;
  /** "dark" is the navy-surface cell. "light" is the inner-page cell. */
  tone?: "dark" | "light";
}

export function CertificationCard({
  certification,
  tone = "dark",
}: CertificationCardProps) {
  const light = tone === "light";

  return (
    <article
      className={cn(
        "cert-card",
        light ? "cert-card--light" : "cert-card--dark",
      )}
    >
      <div className="cert-seal">
        {certification.image ? (
          <Image
            src={certification.image}
            alt={`${certification.title} logo`}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 28vw, (max-width: 1280px) 16vw, 140px"
          />
        ) : (
          <BadgeCheck
            className={cn(
              "h-10 w-10",
              light ? "text-cyan-brand/70" : "text-white/35",
            )}
          />
        )}
      </div>
      <h3 className="cert-card-title">{certification.title}</h3>
      {certification.description ? (
        <p className="cert-card-copy">{certification.description}</p>
      ) : null}
    </article>
  );
}

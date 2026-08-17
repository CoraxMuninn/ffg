import Image from "next/image";
import { BadgeCheck } from "lucide-react";

import type { Certification } from "@/lib/content";
import { cn } from "@/lib/utils";

interface CertificationCardProps {
  certification: Certification;
  /** "dark" is the homepage treatment (navy surface). "light" is the internal page. */
  tone?: "dark" | "light";
}

export function CertificationCard({
  certification,
  tone = "dark",
}: CertificationCardProps) {
  const light = tone === "light";

  return (
    <div
      className={cn(
        "group flex flex-col",
        light
          ? "rounded-2xl border border-gray-200 bg-white p-6"
          : "items-center text-center",
      )}
    >
      <div
        className={cn(
          "flex w-full items-center justify-center",
          light
            ? "mb-5 aspect-[4/3] rounded-xl bg-smoke p-6"
            : "mb-4 aspect-square rounded-xl bg-white p-8 transition-shadow group-hover:shadow-glow-cyan",
        )}
      >
        {certification.image ? (
          <div className="relative h-full w-full">
            <Image
              src={certification.image}
              alt={`${certification.title} logo`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
        ) : (
          <BadgeCheck
            className={cn("h-12 w-12", light ? "text-cyan-brand/70" : "text-navy/30")}
          />
        )}
      </div>
      <h3
        className={cn(
          "font-bold",
          light
            ? "mb-2 text-base text-navy"
            : "mb-1 text-sm text-white lg:text-base",
        )}
      >
        {certification.title}
      </h3>
      <p
        className={cn(
          "leading-relaxed",
          light
            ? "text-sm text-ink"
            : "max-w-48 text-xs text-silver lg:text-sm",
        )}
      >
        {certification.description}
      </p>
    </div>
  );
}

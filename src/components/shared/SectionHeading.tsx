import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  intro?: string;
  /** "light" = on white background (navy text); "dark" = on navy background (white text). */
  tone?: "light" | "dark";
  className?: string;
}

/** Centered section heading used across homepage sections. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  tone = "light",
  className,
}: SectionHeadingProps) {
  const dark = tone === "dark";
  return (
    <div className={cn("mb-14 text-center", className)}>
      {eyebrow && (
        <p
          className={cn(
            "mb-3 text-xs font-semibold uppercase tracking-[0.2em]",
            dark ? "text-cyan-light" : "text-cyan-link",
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "text-3xl font-bold sm:text-4xl lg:text-[2.75rem] lg:leading-tight",
          dark ? "text-white" : "text-navy"
        )}
      >
        {title}
      </h2>
      {intro && (
        <p
          className={cn(
            "mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg",
            dark ? "text-silver" : "text-ink-soft"
          )}
        >
          {intro}
        </p>
      )}
    </div>
  );
}

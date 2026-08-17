import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface MediaSplitProps {
  /** CMS or media-library path. When empty, only `children` render (single column). */
  src?: string;
  alt: string;
  children: ReactNode;
  /** Flip the desktop reading order to CONTENT | IMAGE. Source order stays media-first. */
  reverse?: boolean;
  priority?: boolean;
  className?: string;
  id?: string;
}

/**
 * Product-page image + content pair.
 *
 * When a meaningful image exists this is a balanced two-column grid
 * (`IMAGE | CONTENT`, or the reverse). When it does not, the second column
 * is omitted — never an empty frame to force the grid.
 *
 * Desktop side is swapped with `order` so RTL reading direction stays correct.
 * Mobile always stacks image above copy.
 */
export function MediaSplit({
  src,
  alt,
  children,
  reverse = false,
  priority = false,
  className,
  id,
}: MediaSplitProps) {
  if (!src) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div
      id={id}
      className={cn("grid grid-cols-1 gap-12 lg:grid-cols-2", className)}
    >
      <div
        className={cn(
          "relative h-80 overflow-hidden rounded-2xl shadow-card lg:h-120",
          reverse && "lg:order-2",
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={priority}
        />
      </div>

      <div className={cn(reverse && "lg:order-1")}>{children}</div>
    </div>
  );
}

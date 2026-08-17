import Image from "next/image";

import { Container } from "@/components/shared/Container";

interface PageVisualProps {
  src: string;
  alt: string;
}

/** Wide editorial image under PageHeader — shared crop and radius. */
export function PageVisual({ src, alt }: PageVisualProps) {
  return (
    <section className="bg-white pb-0 pt-8 lg:pt-10">
      <Container>
        <div className="relative h-56 overflow-hidden rounded-2xl shadow-card sm:h-72 lg:h-80">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
            priority={false}
          />
        </div>
      </Container>
    </section>
  );
}

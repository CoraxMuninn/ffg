import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { Product } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { productPath } from "@/lib/i18n/routes";

interface ProductCardProps {
  product: Product;
  locale: Locale;
  dictionary: Dictionary;
}

export function ProductCard({ product, locale, dictionary }: ProductCardProps) {
  return (
    <Link
      href={productPath(locale, product.slug)}
      className="group  relative scroll-mt-24 overflow-hidden rounded-3xl border bg-white  transition-all duration-500 hover:-translate-y-0.5 border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:border-cyan-brand/40 hover:shadow-card-hover"
    >
      <div className="relative h-52 shrink-0 overflow-hidden">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.imageAlt}
            fill
            className="object-cover transition-all duration-500 "
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-smoke text-sm text-silver">
            {product.title}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-2 text-lg font-bold text-navy transition-colors group-hover:text-cyan-brand">
          {product.title}
        </h3>
        <p className="mb-4 flex-1 text-sm leading-relaxed text-silver">
          {product.description}
        </p>

        {product.specs.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {product.specs.slice(0, 3).map((spec) => (
              <span
                key={spec.label}
                className="rounded bg-smoke px-2 py-1 text-xs font-medium text-navy"
              >
                {spec.value}
              </span>
            ))}
          </div>
        )}

        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-brand">
          {dictionary.cta.viewDetails}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </span>
      </div>
    </Link>
  );
}

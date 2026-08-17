import { Container } from "@/components/shared/Container";
import { ProductShowcaseItem } from "@/components/sections/ProductShowcaseItem";
import type { Product } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

interface ProductShowcaseProps {
  products: Product[];
  locale: Locale;
  dictionary: Dictionary;
}

/**
 * Alternating editorial product showcase.
 *
 * The image/text side is derived from the item index inside
 * `ProductShowcaseItem`, so the pattern (image → text, text → image, …)
 * continues automatically for any number of CMS products.
 *
 * The hero product is whichever entry the CMS marks `featured` (falling back to
 * the first item), so editorial priority stays content-driven rather than
 * hardcoded to a slug.
 */
export function ProductShowcase({
  products,
  locale,
  dictionary,
}: ProductShowcaseProps) {
  if (products.length === 0) return null;

  const featuredSlug = (products.find((p) => p.featured) ?? products[0]).slug;

  return (
    <section className="bg-smoke py-16 lg:py-20">
      <Container>
        <div className="flex flex-col gap-8 sm:gap-10 lg:gap-12 ">
          {products.map((product, index) => (
            <ProductShowcaseItem
              key={product.slug}
              product={product}
              locale={locale}
              dictionary={dictionary}
              index={index}
              featured={product.slug === featuredSlug}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

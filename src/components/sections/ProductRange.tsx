import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ProductCard } from "@/components/shared/cards/ProductCard";
import { getProducts } from "@/lib/content";

import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

interface ProductRangeProps {
  locale: Locale;
  dictionary: Dictionary;
}

export default function ProductRange({
  locale,
  dictionary,
}: ProductRangeProps) {
  const products = getProducts(locale);

  return (
    <section className="bg-navy-glass/5 backdrop-blur-3xl py-20 lg:py-28">
      <Container>
        <SectionHeading
          title={dictionary.homepage.productsHeading}
          intro={dictionary.homepage.productsIntro}
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              locale={locale}
              dictionary={dictionary}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

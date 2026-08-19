import Link from "next/link";
import Image from "next/image";

import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { localizedPath } from "@/lib/i18n/routes";
import { getProducts } from "@/lib/content";
import { SOCIAL_URLS } from "@/lib/content/contact";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  InstagramIcon,
  TelegramIcon,
  WhatsAppIcon,
} from "@/components/layout/SocialIcons";

interface FooterProps {
  locale: Locale;
  dictionary: Dictionary;
}

export default function Footer({ locale, dictionary }: FooterProps) {
  const products = getProducts(locale);
  const quickLinks = [
    { label: dictionary.nav.home, href: "/" },
    { label: dictionary.nav.products, href: "/products" },
    { label: dictionary.nav.about, href: "/about" },
    { label: dictionary.nav.qualityControl, href: "/quality-control" },
    { label: dictionary.nav.certifications, href: "/certifications" },
    { label: dictionary.nav.supplyChain, href: "/supply-chain" },
    { label: dictionary.nav.markets, href: "/markets" },
    { label: dictionary.nav.blog, href: "/blog" },
    { label: dictionary.nav.contact, href: "/contact" },
  ];

  // Legal links live in the bottom bar so they stay discoverable without
  // competing with the primary B2B journey above.
  const legalLinks = [
    { label: dictionary.legal.privacy, href: "/privacy" },
    { label: dictionary.legal.terms, href: "/terms" },
  ];

  return (
    <footer className="bg-navy border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company */}
          <div>
            <Link
              href={localizedPath(locale, "/")}
              className="inline-block mb-4"
            >
              <Image
                src="/media/logo/feiz-food-logo.png"
                alt={dictionary.brand}
                // 3:1 intrinsic ratio; 110x110 reserved a square box.
                width={165}
                height={55}
                className="h-14 w-auto rounded-lg -ml-1"
              />
            </Link>
            <h3 className="text-white font-bold text-lg mb-2">
              {dictionary.brand}
            </h3>
            <p className="text-silver text-sm leading-relaxed mb-4">
              {dictionary.footer.tagline}
            </p>
            <SocialLinks dictionary={dictionary} />
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">
              {dictionary.footer.quickLinks}
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={localizedPath(locale, link.href)}
                    className="text-silver hover:text-white text-sm transition-colors duration-[var(--btn-duration)] ease-[var(--btn-ease)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">
              {dictionary.footer.products}
            </h3>
            <ul className="space-y-2">
              {products.map((product) => (
                <li key={product.slug}>
                  <Link
                    href={localizedPath(locale, `/products/${product.slug}`)}
                    className="text-silver hover:text-white text-sm transition-colors duration-[var(--btn-duration)] ease-[var(--btn-ease)]"
                  >
                    {product.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">
              {dictionary.footer.contact}
            </h3>
            <ul className="space-y-3 text-sm text-silver">
              <li>
                <strong className="text-white block mb-1">
                  {dictionary.footer.email}
                </strong>
                <a
                  href={`mailto:${dictionary.contact.emailValue}`}
                  dir="ltr"
                  className="inline-block transition-colors duration-[var(--btn-duration)] ease-[var(--btn-ease)] hover:text-white"
                >
                  {dictionary.contact.emailValue}
                </a>
              </li>
              <li>
                <strong className="text-white block mb-1">
                  {dictionary.footer.phone}
                </strong>
                <a
                  href={`tel:${dictionary.contact.phoneValue.replace(/\s/g, "")}`}
                  dir="ltr"
                  className="inline-block transition-colors duration-[var(--btn-duration)] ease-[var(--btn-ease)] hover:text-white"
                >
                  {dictionary.contact.phoneValue}
                </a>
              </li>
              <li>
                <strong className="text-white block mb-1">
                  {dictionary.footer.officeHours}
                </strong>
                {dictionary.footer.officeHoursValue}
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-silver text-sm">
            © 2026 {dictionary.brand}. {dictionary.footer.rights}
          </p>

          <nav aria-label={dictionary.legal.eyebrow}>
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={localizedPath(locale, link.href)}
                    className="text-silver hover:text-white text-sm transition-colors duration-[var(--btn-duration)] ease-[var(--btn-ease)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

/** Icon-button treatment for footer social links — built on the unified
 * Button system (ghost-inverse), with the brand cyan hover accent. */
const socialIconClass =
  "border border-white/15 text-silver hover:border-cyan-brand/50 hover:bg-white/5 hover:text-cyan-light";

function SocialLinks({ dictionary }: { dictionary: Dictionary }) {
  const items = [
    {
      id: "instagram",
      href: SOCIAL_URLS.instagram,
      label: dictionary.footer.instagram,
      Icon: InstagramIcon,
    },
    {
      id: "telegram",
      href: SOCIAL_URLS.telegram,
      label: dictionary.footer.telegram,
      Icon: TelegramIcon,
    },
    {
      id: "whatsapp",
      href: SOCIAL_URLS.whatsapp,
      label: dictionary.footer.whatsapp,
      Icon: WhatsAppIcon,
    },
  ] as const;

  return (
    <nav aria-label={dictionary.footer.social}>
      <ul className="flex items-center gap-2">
        {items.map(({ id, href, label, Icon }) => (
          <li key={id}>
            {href ? (
              <Button
                asChild
                variant="ghost-inverse"
                size="icon"
                className={socialIconClass}
              >
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              </Button>
            ) : (
              <span
                role="img"
                aria-label={label}
                title={label}
                className={cn(
                  "inline-flex size-11 items-center justify-center rounded-lg border border-white/15 text-silver opacity-50",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

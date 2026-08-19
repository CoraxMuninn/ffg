import type { RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { LocaleFlag } from "@/components/layout/LocaleFlag";
import { Button } from "@/components/ui/button";
import { localizedPath } from "@/lib/i18n/routes";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";
import { isActivePath, type LocaleLink, type NavItem } from "./nav";

/**
 * Mobile navigation modal (Roadmap Task 6.1 / UX-M2).
 *
 * Always mounted so it can animate open/close. The modal behaviour (focus
 * trap, body lock, focus restoration, Escape/resize close) lives in
 * `useMobileNav`; this component renders the dialog and wires link/route clicks
 * to `onClose`. The overlay ref is forwarded so the trap can scope focus to it.
 */
export function MobileNav({
  locale,
  navItems,
  localeLinks,
  pathname,
  isOpen,
  onClose,
  overlayRef,
  brand,
  toggleLabel,
  requestQuoteLabel,
}: {
  locale: Locale;
  navItems: NavItem[];
  localeLinks: LocaleLink[];
  pathname: string;
  isOpen: boolean;
  onClose: () => void;
  overlayRef: RefObject<HTMLDivElement | null>;
  brand: string;
  toggleLabel: string;
  requestQuoteLabel: string;
}) {
  return (
    <div
      ref={overlayRef}
      id="mobile-nav"
      className={cn("nav-mobile-overlay", isOpen && "is-open")}
      role="dialog"
      aria-modal="true"
      aria-label={toggleLabel}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <div className="flex min-h-full flex-col px-6 pb-8 pt-24">
        {/* Mobile Logo */}
        <div className="nav-mobile-chrome mb-8">
          <Image
            src="/media/logo/feiz-food-logo.png"
            alt={brand}
            width={192}
            height={64}
            className="h-16 w-auto"
          />
        </div>

        <nav className="flex-1 space-y-1" aria-label={brand}>
          {navItems.map((item, index) => {
            const href = localizedPath(locale, item.href);
            const active = isActivePath(pathname, href, item.href === "/");
            return (
              <Link
                key={item.href}
                href={href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                style={{ ["--nav-i" as string]: String(index) }}
                className={cn("group nav-mobile-item", active && "is-active")}
              >
                <span>{item.label}</span>
                <ArrowUpRight
                  aria-hidden
                  className="h-5 w-5 opacity-40 transition-opacity duration-[var(--btn-duration)] ease-[var(--btn-ease)] group-hover:opacity-80 rtl:-scale-x-100"
                />
              </Link>
            );
          })}
        </nav>

        {/* Mobile Language & CTA */}
        <div className="nav-mobile-chrome space-y-4 pt-8">
          <div className="flex flex-wrap gap-2">
            {localeLinks.map((lang) => (
              <Link
                key={lang.code}
                href={lang.href}
                onClick={onClose}
                aria-current={lang.code === locale ? "true" : undefined}
                className={cn(
                  "rounded-full border px-3 py-2 text-sm transition-colors duration-[var(--btn-duration)] ease-[var(--btn-ease)]",
                  lang.code === locale
                    ? "border-cyan-brand bg-cyan-brand text-white"
                    : "border-white/10 bg-white/5 text-white hover:bg-white/10",
                )}
              >
                <span className="flex items-center gap-2">
                  <LocaleFlag
                    locale={lang.code}
                    className="h-3.5 w-[21px] shrink-0 rounded-[2px]"
                  />
                  {lang.code.toUpperCase()}
                </span>
              </Link>
            ))}
          </div>

          <Button asChild size="lg" className="w-full">
            <Link href={localizedPath(locale, "/contact")} onClick={onClose}>
              {requestQuoteLabel}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

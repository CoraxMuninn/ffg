"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { localizedPath } from "@/lib/i18n/routes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { useScrolled } from "./header/use-scrolled";
import { useMobileNav } from "./header/use-mobile-nav";
import { DesktopNav } from "./header/DesktopNav";
import { LanguageSwitcher } from "./header/LanguageSwitcher";
import { MobileNav } from "./header/MobileNav";
import { buildLocaleLinks, buildNavItems } from "./header/nav";

interface HeaderProps {
  locale: Locale;
  dictionary: Dictionary;
}

/**
 * Site header — orchestrator only (Roadmap Task 6.1).
 *
 * The header's concerns are split into focused, independently testable pieces:
 *
 *  - scroll state          → `useScrolled`
 *  - mobile modal behavior → `useMobileNav` (body lock, resize close, focus
 *                            trap, focus restore) + the `MobileNav` component
 *  - desktop navigation    → `DesktopNav`
 *  - language disclosure   → `LanguageSwitcher`
 *  - nav/locale data       → `header/nav` (pure builders)
 *
 * What remains here is wiring: holding the language-disclosure state, the
 * shared Escape/outside-click dismissal, and the static shell (logo, CTA,
 * hamburger toggle). Visuals and DOM are unchanged.
 */
export default function Header({ locale, dictionary }: HeaderProps) {
  const pathname = usePathname();
  const isScrolled = useScrolled();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const {
    isOpen: isMobileMenuOpen,
    setOpen: setIsMobileMenuOpen,
    overlayRef,
    menuButtonRef,
  } = useMobileNav();

  const navItems = buildNavItems(dictionary);
  const localeLinks = buildLocaleLinks(locale, pathname);

  // Escape closes either surface; an outside click closes only the language
  // disclosure (the mobile sheet covers the page, so outside-click does not
  // apply to it). Coordinated here because dismissal spans both concerns.
  useEffect(() => {
    if (!isLangOpen && !isMobileMenuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLangOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isLangOpen, isMobileMenuOpen, setIsMobileMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-1.5 md:top-3 inset-x-4 z-50 transition-all duration-300 ${
          isScrolled
            ? "glass-nav backdrop-blur-3xl rounded-xl"
            : "bg-transparent"
        }`}
      >
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 ">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <Link href={localizedPath(locale, "/")} className="shrink-0">
              <Image
                src="/media/logo/feiz-food-logo.png"
                alt={dictionary.brand}
                // Intrinsic ratio is 3:1 (2172x724). The previous 83x80
                // reserved a near-square box, so the header shifted once the
                // real image painted.
                width={132}
                height={44}
                className="h-10 w-auto"
                priority
              />
            </Link>

            <DesktopNav
              navItems={navItems}
              locale={locale}
              pathname={pathname}
              ariaLabel={dictionary.brand}
            />

            {/* Right side (desktop) */}
            <div className="hidden lg:flex items-center gap-2">
              <LanguageSwitcher
                locale={locale}
                localeLinks={localeLinks}
                isOpen={isLangOpen}
                onToggle={() => setIsLangOpen((open) => !open)}
                onClose={() => setIsLangOpen(false)}
                langRef={langRef}
                chooseLabel={dictionary.header.chooseLanguage}
              />

              {/* CTA */}
              <Button asChild size="sm">
                <Link href={localizedPath(locale, "/contact")}>
                  {dictionary.cta.requestQuote}
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              ref={menuButtonRef}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="relative min-h-11 min-w-11 cursor-pointer rounded-lg p-2 text-white transition-colors duration-[var(--btn-duration)] ease-[var(--btn-ease)] hover:bg-white/10 lg:hidden"
              aria-label={dictionary.header.toggleMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav"
            >
              <span className="relative block h-6 w-6">
                <Menu
                  aria-hidden
                  className={cn(
                    "absolute inset-0 h-6 w-6 transition-all duration-[var(--btn-duration)] ease-[var(--btn-ease)]",
                    isMobileMenuOpen
                      ? "rotate-90 opacity-0"
                      : "rotate-0 opacity-100",
                  )}
                />
                <X
                  aria-hidden
                  className={cn(
                    "absolute inset-0 h-6 w-6 transition-all duration-[var(--btn-duration)] ease-[var(--btn-ease)]",
                    isMobileMenuOpen
                      ? "rotate-0 opacity-100"
                      : "-rotate-90 opacity-0",
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <MobileNav
        locale={locale}
        navItems={navItems}
        localeLinks={localeLinks}
        pathname={pathname}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        overlayRef={overlayRef}
        brand={dictionary.brand}
        toggleLabel={dictionary.header.toggleMenu}
        requestQuoteLabel={dictionary.cta.requestQuote}
      />
    </>
  );
}

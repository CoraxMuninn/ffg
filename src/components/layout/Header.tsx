"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, ArrowUpRight } from "lucide-react";

import { localeConfig, locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { localizedPath } from "@/lib/i18n/routes";
import { LocaleFlag } from "@/components/layout/LocaleFlag";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  locale: Locale;
  dictionary: Dictionary;
}

/** Home is exact-match only; every other item also matches nested routes. */
function isActivePath(pathname: string, href: string, isHome: boolean): boolean {
  if (isHome) return pathname === href || pathname === `${href}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header({ locale, dictionary }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasMenuOpen = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setIsScrolled(window.scrollY > 50);
    };
    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Close language dropdown / mobile menu on Escape or outside click.
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
  }, [isLangOpen, isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMobileMenuOpen]);

  // Desktop nav takes over at `lg`; drop the mobile overlay if the viewport grows.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) setIsMobileMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Return focus to the hamburger after a close so keyboard users are not stranded.
  useEffect(() => {
    if (wasMenuOpen.current && !isMobileMenuOpen) {
      menuButtonRef.current?.focus();
    }
    wasMenuOpen.current = isMobileMenuOpen;
  }, [isMobileMenuOpen]);

  const currentConfig = localeConfig[locale];

  const navItems = [
    { label: dictionary.nav.home, href: "/" },
    { label: dictionary.nav.products, href: "/products" },
    { label: dictionary.nav.markets, href: "/markets" },
    { label: dictionary.nav.supplyChain, href: "/supply-chain" },
    { label: dictionary.nav.blog, href: "/blog" },
    { label: dictionary.nav.about, href: "/about" },
    { label: dictionary.nav.contact, href: "/contact" },
  ];

  // Path suffix after the current locale prefix, used to preserve the route
  // when switching locales (e.g. /en/products → /fa/products).
  const pathSuffix =
    pathname === `/${locale}` ? "" : pathname.replace(`/${locale}`, "");

  const localizedHref = (targetLocale: Locale) =>
    `/${targetLocale}${pathSuffix}`;

  const localeLinks = locales.map((code) => ({
    code,
    label: localeConfig[code].label,
    href: localizedHref(code),
  }));

  return (
    <>
      <header
        className={`fixed top-3 inset-x-4 z-50 transition-all duration-300 ${
          isScrolled ? "glass rounded-xl backdrop-blur-2xl" : "bg-transparent"
        }`}
      >
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 ">
          <div className="flex items-center justify-between h-16">
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
                className="h-11 w-auto"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-x-1 xl:gap-x-1.5" aria-label={dictionary.brand}>
              {navItems.map((item) => {
                const href = localizedPath(locale, item.href);
                const active = isActivePath(pathname, href, item.href === "/");
                return (
                  <Link
                    key={item.href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn("nav-link", active && "is-active")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Language Selector */}
              <div className="relative" ref={langRef}>
                <button
                  type="button"
                  onClick={() => setIsLangOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={isLangOpen}
                  aria-controls="lang-menu-desktop"
                  aria-label={`${dictionary.brand} · ${currentConfig.label}`}
                  className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white transition-colors duration-[var(--btn-duration)] ease-[var(--btn-ease)] hover:bg-white/10"
                >
                  <LocaleFlag
                    locale={locale}
                    className="h-3.5 w-[21px] shrink-0 rounded-[2px]"
                  />
                  <span className="font-medium">{locale.toUpperCase()}</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 opacity-60 transition-transform duration-[var(--btn-duration)] ease-[var(--btn-ease)]",
                      isLangOpen && "rotate-180",
                    )}
                  />
                </button>

                <div
                  id="lang-menu-desktop"
                  role="menu"
                  aria-label={dictionary.header.toggleMenu}
                  aria-hidden={!isLangOpen}
                  inert={!isLangOpen}
                  className={cn("nav-lang-menu", isLangOpen && "is-open")}
                >
                  {localeLinks.map((lang) => (
                    <Link
                      key={lang.code}
                      href={lang.href}
                      role="menuitem"
                      tabIndex={isLangOpen ? 0 : -1}
                      onClick={() => setIsLangOpen(false)}
                      aria-current={lang.code === locale ? "true" : undefined}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white transition-colors duration-[var(--btn-duration)] ease-[var(--btn-ease)] hover:bg-white/5"
                    >
                      <LocaleFlag
                        locale={lang.code}
                        className="h-4 w-6 shrink-0 rounded-xs"
                      />
                      <span>{lang.label}</span>
                      {lang.code === locale && (
                        <span className="ms-auto text-cyan-brand text-xs">
                          ✓
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>

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

      {/* Mobile Menu — always mounted so open/close can animate. */}
      <div
        id="mobile-nav"
        className={cn("nav-mobile-overlay", isMobileMenuOpen && "is-open")}
        aria-hidden={!isMobileMenuOpen}
        inert={!isMobileMenuOpen}
      >
        <div className="flex min-h-full flex-col px-6 pb-8 pt-24">
          {/* Mobile Logo */}
          <div className="nav-mobile-chrome mb-8">
            <Image
              src="/media/logo/feiz-food-logo.png"
              alt={dictionary.brand}
              width={192}
              height={64}
              className="h-16 w-auto"
            />
          </div>

          <nav className="flex-1 space-y-1" aria-label={dictionary.brand}>
            {navItems.map((item, index) => {
              const href = localizedPath(locale, item.href);
              const active = isActivePath(pathname, href, item.href === "/");
              return (
                <Link
                  key={item.href}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
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
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={lang.code === locale ? "true" : undefined}
                  className={`rounded-full border px-3 py-2 text-sm transition-colors duration-[var(--btn-duration)] ease-[var(--btn-ease)] ${
                    lang.code === locale
                      ? "border-cyan-brand bg-cyan-brand text-white"
                      : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  }`}
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
              <Link
                href={localizedPath(locale, "/contact")}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {dictionary.cta.requestQuote}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

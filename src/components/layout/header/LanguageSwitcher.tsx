import type { RefObject } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { LocaleFlag } from "@/components/layout/LocaleFlag";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";
import type { LocaleLink } from "./nav";

/**
 * Desktop language disclosure (Roadmap Task 6.1 / UX-M7).
 *
 * Disclosure + navigation-list semantics: the trigger sets `aria-expanded`/
 * `aria-controls`, and the menu is a plain list of locale links kept mounted
 * (inert when closed) so it can animate. Open state and dismissal are owned by
 * the Header; this component only renders.
 */
export function LanguageSwitcher({
  locale,
  localeLinks,
  isOpen,
  onToggle,
  onClose,
  langRef,
  chooseLabel,
}: {
  locale: Locale;
  localeLinks: LocaleLink[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  langRef: RefObject<HTMLDivElement | null>;
  chooseLabel: string;
}) {
  return (
    <div className="relative" ref={langRef}>
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="lang-menu-desktop"
        aria-label={chooseLabel}
        className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white transition-colors duration-[var(--btn-duration)] ease-[var(--btn-ease)] hover:bg-white/10"
      >
        <LocaleFlag locale={locale} className="h-3.5 w-[21px] shrink-0 rounded-[2px]" />
        <span className="font-medium">{locale.toUpperCase()}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 opacity-60 transition-transform duration-[var(--btn-duration)] ease-[var(--btn-ease)]",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <div
        id="lang-menu-desktop"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn("nav-lang-menu", isOpen && "is-open")}
      >
        {localeLinks.map((lang) => (
          <Link
            key={lang.code}
            href={lang.href}
            tabIndex={isOpen ? 0 : -1}
            onClick={onClose}
            aria-current={lang.code === locale ? "true" : undefined}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white transition-colors duration-[var(--btn-duration)] ease-[var(--btn-ease)] hover:bg-white/5"
          >
            <LocaleFlag locale={lang.code} className="h-4 w-6 shrink-0 rounded-xs" />
            <span>{lang.label}</span>
            {lang.code === locale && (
              <span className="ms-auto text-cyan-brand text-xs">✓</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

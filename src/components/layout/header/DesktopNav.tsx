import Link from "next/link";

import { localizedPath } from "@/lib/i18n/routes";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";
import { isActivePath, type NavItem } from "./nav";

/**
 * Desktop primary navigation (Roadmap Task 6.1). Purely presentational: the
 * active-route comparison lives in `nav.ts`, so this just maps items to links.
 * Rendered only at `lg` and above.
 */
export function DesktopNav({
  navItems,
  locale,
  pathname,
  ariaLabel,
}: {
  navItems: NavItem[];
  locale: Locale;
  pathname: string;
  ariaLabel: string;
}) {
  return (
    <nav
      className="hidden lg:flex  items-center gap-x-1 xl:gap-x-1.5"
      aria-label={ariaLabel}
    >
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
  );
}

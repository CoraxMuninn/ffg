import { headers } from "next/headers";

import { defaultLocale, isLocale, type Locale } from "./config";

/**
 * Locale stamped by `src/proxy.ts` on `x-locale`.
 * Used by Server Components that sit outside `params` (loading, not-found).
 */
export async function getRequestLocale(): Promise<Locale> {
  const headerList = await headers();
  const headerLocale = headerList.get("x-locale");
  return headerLocale && isLocale(headerLocale) ? headerLocale : defaultLocale;
}

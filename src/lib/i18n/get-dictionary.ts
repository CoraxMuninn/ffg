import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/types";
import { dictionaries } from "./dictionaries";

/**
 * Returns the UI dictionary for a locale.
 *
 * This helper is the single access point for localized chrome strings. It is
 * safe to call from both Server Components (e.g. layouts) and Client
 * Components (via props passed from the server).
 */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

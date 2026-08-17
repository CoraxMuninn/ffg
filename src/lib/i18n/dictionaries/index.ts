import type { Locale } from "../config";
import type { Dictionary } from "./types";

import { en } from "./en";
import { fa } from "./fa";
import { ru } from "./ru";
import { vi } from "./vi";

export const dictionaries: Record<Locale, Dictionary> = {
  en,
  fa,
  ru,
  vi,
};

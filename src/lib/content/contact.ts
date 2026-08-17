/**
 * Public contact facts used by UI dictionaries.
 *
 * Single source so EN/FA/RU/VI cannot drift. Values already existed in the
 * repository (email in all locales; phone in the Persian dictionary).
 */
export const PUBLIC_EMAIL = "info@feizfood.com";
export const PUBLIC_PHONE = "+98 922 358 3442";

/**
 * Official social profiles.
 *
 * Do not invent handles. Leave a field empty until the account is confirmed.
 * Values may also be supplied via env so they can be wired in production
 * without a code change.
 *
 * WhatsApp is derived from the existing public phone (wa.me), not a new claim.
 */
function envUrl(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

const whatsappDigits = PUBLIC_PHONE.replace(/\D/g, "");

export const SOCIAL_URLS = {
  instagram: envUrl("NEXT_PUBLIC_SOCIAL_INSTAGRAM"),
  telegram: envUrl("NEXT_PUBLIC_SOCIAL_TELEGRAM"),
  whatsapp: envUrl("NEXT_PUBLIC_SOCIAL_WHATSAPP") || `https://wa.me/${whatsappDigits}`,
} as const;

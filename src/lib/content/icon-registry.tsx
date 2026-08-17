import {
  Package,
  ShieldCheck,
  Snowflake,
  Ship,
  FileText,
  Tag,
  Search,
  Handshake,
  Factory,
  Truck,
  Thermometer,
  ClipboardCheck,
  Globe,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";

/**
 * Safe, explicit Lucide icon registry.
 *
 * CMS content stores a plain string key (e.g. "shield-check"). This registry
 * maps those keys to approved Lucide components at build time. It deliberately
 * does NOT dynamically import or execute arbitrary components from untrusted
 * input — unknown keys resolve to a safe fallback instead of throwing.
 */

const ICON_REGISTRY: Record<string, LucideIcon> = {
  "package": Package,
  "shield-check": ShieldCheck,
  "snowflake": Snowflake,
  "ship": Ship,
  "file-text": FileText,
  "tag": Tag,
  "search": Search,
  "handshake": Handshake,
  "factory": Factory,
  "truck": Truck,
  "thermometer": Thermometer,
  "clipboard-check": ClipboardCheck,
  "globe": Globe,
  "check-circle": CheckCircle,
};

const FALLBACK_ICON: LucideIcon = Package;

/**
 * Returns the Lucide component for a CMS-provided icon key.
 * Falls back to a safe icon when the key is unknown or missing.
 */
export function getIcon(key: string | undefined | null): LucideIcon {
  if (!key) return FALLBACK_ICON;
  return ICON_REGISTRY[key] ?? FALLBACK_ICON;
}



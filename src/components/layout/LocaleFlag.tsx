import type { Locale } from "@/lib/i18n/config";

/**
 * Inline SVG flags for the locale switcher.
 *
 * Flag emoji (regional-indicator pairs such as "🇬🇧") are NOT rendered as flags
 * by Chrome on Windows/ChromeOS/most Linux builds, because those platforms ship
 * no font with the flag glyphs — the pairs fall back to letter boxes or tofu.
 * Drawing the flags as inline SVG makes them independent of system fonts and
 * emoji support, so they render identically in Chrome, Firefox, Edge & Safari.
 *
 * Each flag uses a 60×40 viewBox (the 3:2 ratio the switcher already implied)
 * and inherits its box size from the caller's className, so the surrounding
 * layout, spacing and typography are unchanged.
 */

interface LocaleFlagProps {
  locale: Locale;
  className?: string;
}

/** Shared attributes: decorative — the adjacent text label names the language. */
const svgProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 60 40",
  "aria-hidden": true,
  focusable: false,
} as const;

function FlagGB({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      <rect width="60" height="40" fill="#012169" />
      {/* White saltire */}
      <path d="M0 0 60 40M60 0 0 40" stroke="#fff" strokeWidth="8" />
      {/*
        Red saltire counterchange, pre-computed as explicit polygons rather than
        a clipped stroke: `clipPath` needs a document-unique id, and this flag is
        rendered several times per page (trigger + dropdown + mobile).
      */}
      <path
        fill="#C8102E"
        d="M30.00 20.00L34.81 20.00L60.00 36.79L60.00 40.00ZM0.00 0.00L30.00 20.00L25.19 20.00L0.00 3.21ZM30.00 20.00L30.00 23.21L4.81 40.00L0.00 40.00ZM60.00 0.00L30.00 20.00L30.00 16.79L55.19 0.00Z"
      />
      {/* White cross */}
      <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="13.33" />
      {/* Red cross */}
      <path d="M30 0v40M0 20h60" stroke="#C8102E" strokeWidth="8" />
    </svg>
  );
}

function FlagRU({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      <rect width="60" height="40" fill="#fff" />
      <rect y="13.34" width="60" height="13.33" fill="#0039A6" />
      <rect y="26.66" width="60" height="13.34" fill="#D52B1E" />
    </svg>
  );
}

function FlagVN({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      <rect width="60" height="40" fill="#DA251D" />
      <polygon
        fill="#FF0"
        points="30.00,8.00 32.94,17.05 42.46,17.05 34.76,22.64 37.71,31.69 30.00,26.10 22.29,31.69 25.24,22.64 17.54,17.05 27.06,17.05"
      />
    </svg>
  );
}

/**
 * Iran — green / white / red horizontal tricolour with the historic
 * Lion and Sun (شیر و خورشید) centred in the white stripe.
 *
 * The emblem is drawn entirely with vector primitives (no text, no emoji, no
 * external asset), so it is font-independent and stays legible at the ~14–16px
 * sizes used by the switcher.
 */
function FlagIR({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      <rect width="60" height="40" fill="#fff" />
      <rect width="60" height="13.34" fill="#239F40" />
      <rect y="26.66" width="60" height="13.34" fill="#DA0000" />
      <g transform="translate(21.9 13.5) scale(0.164)">
        <g fill="#D4A11E">
          {/* Sun with 16 rays, rising behind the lion */}
          <path d="M67.89 12.26L69.00 2.50L70.11 12.26ZM71.89 12.61L76.65 4.02L73.94 13.46ZM75.46 14.47L83.14 8.36L77.03 16.04ZM78.04 17.56L87.48 14.85L78.89 19.61ZM79.24 21.39L89.00 22.50L79.24 23.61ZM78.89 25.39L87.48 30.15L78.04 27.44ZM77.03 28.96L83.14 36.64L75.46 30.53ZM73.94 31.54L76.65 40.98L71.89 32.39ZM70.11 32.74L69.00 42.50L67.89 32.74ZM66.11 32.39L61.35 40.98L64.06 31.54ZM62.54 30.53L54.86 36.64L60.97 28.96ZM59.96 27.44L50.52 30.15L59.11 25.39ZM58.76 23.61L49.00 22.50L58.76 21.39ZM59.11 19.61L50.52 14.85L59.96 17.56ZM60.97 16.04L54.86 8.36L62.54 14.47ZM64.06 13.46L61.35 4.02L66.11 12.61Z" />
          <circle cx="69" cy="22.5" r="10.8" />
          {/* Tail, curling forward over the back */}
          <path d="M62 42 C70.5 43.5 76.5 40 78 33.5 C79 28.8 77.6 25 74.6 23 L72 26.8 C73.8 28.2 74.6 30.4 74 33 C72.9 37.4 68.4 39.4 62 38.4 Z" />
          {/* Body */}
          <path d="M29 40 C29 34.6 35.5 31.2 45 31.2 C55 31.2 62.6 34.2 65 39 C66.3 41.6 65.6 45.2 63 46.4 C57 49 45.5 50 37.5 48.4 C31.8 47.2 29 44.4 29 40 Z" />
          {/* Legs */}
          <path d="M59.6 45 L61 57.8 L59.8 60.6 L64.6 60.6 L64.8 57.6 L64.2 45 Z" />
          <path d="M53.4 46 L54 58 L52.6 60.6 L57.6 60.6 L58 57.8 L58.4 45.6 Z" />
          <path d="M34 45 L33.8 58 L32.4 60.6 L37.4 60.6 L37.8 57.8 L38.8 44.6 Z" />
          {/* Mane, head, muzzle, ear */}
          <circle cx="29.5" cy="35" r="12.6" />
          <circle cx="23.5" cy="31.5" r="7.9" />
          <path d="M18.6 27.8 C13.8 28.4 11.2 30.6 11.4 33.6 C11.6 36.2 13.9 37.9 16.8 37.7 C20.3 37.5 22.5 35.2 22.7 32 Z" />
          <path d="M26.4 23.6 L30.4 19.4 L31.4 25.4 Z" />
          {/* Raised foreleg holding the sabre */}
          <path d="M41.5 34 C39 28.4 36.6 23.6 34.6 20.4 L29.4 22.8 C31.6 26.4 34 31.4 36.4 37 Z" />
          {/* Ground line */}
          <rect x="11" y="60.6" width="58" height="3.4" rx="1.7" />
          {/* Shamshir: blade, crossguard, grip */}
          <path d="M33.4 15.6 C25.6 10.4 17 6.2 7.6 3.2 C15.4 8.8 23.4 14.6 31.2 20.6 Z" />
          <path d="M36.8 17.4 L30 21.6 L32.2 25.2 L39 21 Z" />
          <path d="M40.6 19.6 L36.6 22 L38.4 25 L42.4 22.6 Z" />
        </g>
      </g>
    </svg>
  );
}

const FLAGS: Record<Locale, (props: { className?: string }) => React.ReactElement> = {
  en: FlagGB,
  fa: FlagIR,
  ru: FlagRU,
  vi: FlagVN,
};

/** Renders the flag for a locale as an inline, font-independent SVG. */
export function LocaleFlag({ locale, className }: LocaleFlagProps) {
  const Flag = FLAGS[locale];
  return <Flag className={className} />;
}

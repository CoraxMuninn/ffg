import type { NextConfig } from "next";

/**
 * Production security headers.
 *
 * The CSP is tuned to this application: Next.js inline bootstrap scripts,
 * Next/Image optimizations, self-hosted fonts, the Cloudflare Turnstile script,
 * and Decap CMS (admin loads its JS from this origin). `unsafe-eval` is avoided;
 * a narrowly-scoped `unsafe-inline` for scripts is required by Next.js's
 * inlined bootstrap in production, so `script-src` allows it only where
 * needed. This is documented and should be revisited if Next.js changes its
 * inline-script strategy.
 */
const baseSecurityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
];

/** Public site: Turnstile only. No admin/CMS resources. */
const appCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://challenges.cloudflare.com",
  "font-src 'self'",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

/**
 * Decap CMS admin.
 *
 * The Decap runtime is self-hosted and version-pinned under
 * `/admin/vendor/decap-cms/<version>/` (audit SEC-M1), so unpkg has been
 * removed from every directive: script, style, img, font, and connect. The
 * admin now loads no third-party code at all.
 */
const adminCsp = [
  "default-src 'self'",
  // Decap bundles AJV, which compiles its config schema with `new Function`.
  // Without 'unsafe-eval' the CMS refuses to boot. This is scoped strictly to
  // /admin (a noindex, authenticated-only route); the public-site CSP above
  // still forbids eval entirely.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Decap injects its component styles at runtime (Emotion), hence
  // 'unsafe-inline'; no external stylesheet is loaded.
  "style-src 'self' 'unsafe-inline'",
  // `data:`/`blob:` cover media-library previews of local uploads;
  // `raw.githubusercontent.com` serves existing repository media in the editor.
  "img-src 'self' data: blob: https://raw.githubusercontent.com",
  "font-src 'self'",
  "connect-src 'self' https://api.github.com",
  // The OAuth popup is opened at /api/auth on this origin, which then
  // redirects the browser to github.com. `form-action` must therefore allow
  // GitHub, or the navigation is blocked.
  "form-action 'self' https://github.com",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // 75 is the default used site-wide. 90 is allowed for the Markets export
    // map, whose thin cyan trade lanes and small country labels visibly break
    // up under stronger compression.
    qualities: [75, 90],
  },
  experimental: {
    // Enables a self-contained, locale-aware 404 for unmatched routes. Our root
    // layout is the `[locale]` layout, so segment `not-found.tsx` only covers
    // `notFound()` calls; unmatched URLs need the global not-found.
    globalNotFound: true,
  },
  /**
   * Decap CMS lives at `public/admin/index.html`. Next.js serves files from
   * `public/` at their exact path only, so `/admin` (no extension, no trailing
   * slash) would 404 — the CMS was only reachable at `/admin/index.html`.
   * These rewrites make the natural URL work while keeping the file static.
   */
  async rewrites() {
    return [
      { source: "/admin", destination: "/admin/index.html" },
      { source: "/admin/", destination: "/admin/index.html" },
    ];
  },
  async headers() {
    return [
      {
        // `/admin` and `/admin/*` — the CMS entry point and its assets.
        source: "/admin",
        headers: [
          ...baseSecurityHeaders.filter(
            (header) => header.key !== "Cross-Origin-Opener-Policy",
          ),
          // Decap's GitHub login runs in a popup that calls
          // `window.opener.postMessage`. A strict `same-origin` COOP detaches
          // the opener and the popup can never return the token.
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          { key: "Content-Security-Policy", value: adminCsp },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        // Assets and sub-paths under the CMS entry point.
        source: "/admin/:path*",
        headers: [
          ...baseSecurityHeaders.filter(
            (header) => header.key !== "Cross-Origin-Opener-Policy",
          ),
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          { key: "Content-Security-Policy", value: adminCsp },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        // OAuth broker endpoints: same popup/opener requirement as /admin.
        source: "/api/(auth|callback)",
        headers: [
          ...baseSecurityHeaders.filter(
            (header) => header.key !== "Cross-Origin-Opener-Policy",
          ),
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        // Exclude /admin and the OAuth broker so they keep the rules above
        // rather than inheriting the public-site CSP (which is stricter and
        // has no 'unsafe-eval').
        source: "/((?!admin|api/auth|api/callback).*)",
        headers: [
          ...baseSecurityHeaders,
          { key: "Content-Security-Policy", value: appCsp },
        ],
      },
    ];
  },
};

export default nextConfig;

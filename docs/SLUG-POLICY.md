# Slug Policy — Stable English Shared Slugs (Decision, SEO-L5 / Task 5.8)

**Decision:** Retain **stable English shared slugs** across all four locales
(`en`, `fa`, `ru`, `vi`). Do **not** migrate to per-locale slugs at this time.

**Status:** Documented architectural decision (Roadmap Task 5.8 decision gate).
Enforced by repository tests. Revisit only with multilingual keyword/business
evidence (see “Revisiting this decision”).

## Rationale

Every CMS record carries one lowercase kebab-case `slug` that is **identical
across all locales** (e.g. `/en/products/frozen-chicken-feet`,
`/fa/products/frozen-chicken-feet`). The slug is therefore the **stable
translation/entity ID** that ties counterpart pages together and drives
canonical, hreflang, the language switcher, and sitemap alternates.

Reasons to retain this model rather than migrating to localized slugs:

1. **No keyword evidence.** The site targets B2B importers searching in
   international trade English; there is no multilingual keyword dataset showing
   that translated URL segments would meaningfully improve non-English ranking.
   Migrating without that evidence would trade known URL equity for speculative
   gain.
2. **URL equity & link integrity.** Shared slugs keep every existing URL valid.
   Per-locale slugs require a full permanent redirect map and risk orphaned
   equity and broken inbound links.
3. **Simpler, correct i18n.** Counterpart-aware hreflang (Task 5.3), sitemap
   alternates, and the locale switcher all key off the shared slug. A migration
   would require a per-locale slug table, switch mappings, and updated
   canonicals across ~100 URLs.
4. **Editor simplicity.** Editors copy a stable slug once; the collection folder
   (`content/<locale>/…`) selects the language. This is exactly how the Decap
   CMS collections are configured (Task 5.2).

Localized **content** (titles, headings, body, SEO titles/descriptions, image
alt) is fully translated per locale; only the **URL segment** is shared.

## Enforcement

This policy is enforced by tests, not just convention:

- **Format** — every slug is lowercase kebab-case
  (`src/lib/content/parse.ts` `validateSlug`, plus
  `content.contract.test.ts`).
- **Cross-locale identity** — `content.contract.test.ts` asserts every
  collection has an *identical slug set* across all four locales, so a
  locale-specific slug cannot be introduced by accident.
- **Filename ↔ slug** — each content file’s name equals its frontmatter slug.
- **Counterpart-aware hreflang** — `buildAlternates` (`src/lib/seo/hreflang.ts`)
  emits alternates only for locales whose content actually carries the slug, so
  the shared-slug model never produces a hreflang pointing at missing content.

## Revisiting this decision

If localized keyword/business evidence later justifies a migration, it must be
executed as a separate, expanded plan that includes, at minimum: per-locale slug
fields, a translation-ID map, language-switch mappings, updated canonicals,
sitemap updates, and a complete permanent (308) redirect map from every existing
shared-slug URL to its localized replacement — with no orphaned URL equity.

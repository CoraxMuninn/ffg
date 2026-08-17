# Feiz Food Group — SEO Guidelines

## International B2B SEO Specification v2

## 1. SEO Goal

Build a technically strong international SEO foundation for a B2B frozen poultry exporter.

Primary objectives:

- Visibility in target markets
- Qualified organic traffic
- Product discovery
- International buyer acquisition
- Strong technical performance
- Clear search-engine understanding

---

## 2. Target Keywords

Use naturally:

- Frozen chicken feet exporter
- Frozen poultry supplier
- Chicken feet supplier
- IQF frozen chicken feet
- Frozen chicken feet from Iran
- B2B poultry exporter
- Bulk frozen poultry supply

Do not force exact-match keywords into every page.

---

## 3. Search Intent

Prioritize commercial B2B intent.

Content should answer:

- What product is supplied?
- What specifications are available?
- Who supplies it?
- Where can it be exported?
- What quality controls exist?
- How can a buyer request a quotation?

---

## 4. Metadata

Every indexable page requires:

- Unique title
- Unique meta description
- Canonical URL
- Appropriate robots directives
- Open Graph metadata
- Locale-aware metadata

Use Next.js Metadata API.

---

## 5. Multilingual SEO

Locales:

```
/en
/fa
/ru
/vi

```

English is default.

Persian:

`RTL`

Russian and Vietnamese:

`LTR`

Every translated page should have:

- Correct hreflang
- Self-referencing canonical
- Localized title
- Localized description
- Correct locale metadata

Use:

`x-default → English`

Do not use machine-translated low-quality copy as final published content.

---

## 6. URL Strategy

Use stable English slugs.

Example:

```
/en/products/frozen-chicken-feet
/fa/products/frozen-chicken-feet
/ru/products/frozen-chicken-feet
/vi/products/frozen-chicken-feet

```

Keep URL structures predictable across locales.

---

## 7. Schema Strategy

### Homepage

Use where appropriate:

- Organization
- WebSite

### Product Detail

Use:

- Product
- BreadcrumbList

Only include product properties supported by actual page content.

### Blog Article

Use:

- Article
- BreadcrumbList

### Internal Pages

Use:

- BreadcrumbList where applicable

Do not add irrelevant or misleading Schema types.

Use LocalBusiness only where the actual business/location data satisfies the requirements.

---

## 8. Product SEO

Each product should have:

- Unique URL
- Unique title
- Unique description
- Unique metadata
- Product-focused headings
- Product imagery
- Descriptive alt text
- Internal links
- RFQ CTA

Chicken Feet receives the strongest SEO content because it is the primary product.

---

## 9. Internal Linking

Create logical internal links between:

- Home
- Products
- Product details
- Markets
- Supply Chain
- Quality Control
- Certifications
- Blog
- Contact
- RFQ

Use descriptive anchor text naturally.

---

## 10. Heading Structure

Every page should maintain:

- One clear H1
- Logical H2 sections
- H3 subsections where needed

Never use headings only for visual styling.

---

## 11. Image SEO

Use:

- WebP / AVIF where appropriate
- Descriptive filenames
- Descriptive alt text
- Correct dimensions
- Responsive images
- Lazy loading where appropriate
- Priority loading only for important above-the-fold imagery

---

## 12. Performance SEO

Optimize:

- Core Web Vitals
- LCP
- CLS
- INP
- Font loading
- Image loading
- JavaScript size
- Server response time

Prefer Server Components and static rendering where appropriate.

---

## 13. Indexing

Implement:

- `sitemap.xml`
- `robots.txt`
- Canonical URLs
- Correct noindex handling
- Clean URLs
- Consistent locale indexing

Avoid indexing duplicate or incomplete CMS content.

---

## 14. Content SEO

Every indexable page should provide meaningful unique value.

Avoid:

- Keyword stuffing
- Duplicate locale content
- Thin product pages
- Generic AI-generated filler
- Repetitive headings
- Empty SEO sections

---

## 15. SEO Audit

Before production, perform:

`/seoaudit`

Check:

- Metadata
- Canonical
- hreflang
- Sitemap
- Robots
- Schema
- Indexability
- Headings
- Internal links
- Images
- Performance
- Duplicate content

---

## 16. Final QA

The completed site must also pass:

`/killcritic`

`/uiaudit`

`/uxaudit`

`/optimize`

plus a dedicated security audit.

SEO is not considered complete until technical, content, multilingual and performance layers have been reviewed together.

# Feiz Food Group — Multilingual Content & SEO Audit

**Audit date:** 2026-08-17  
**Locales:** English (`en`), Persian (`fa`, RTL), Russian (`ru`), Vietnamese (`vi`)

## Scope

Audited and updated all 228 localized content records:

- 44 page records (11 per locale)
- 16 product records
- 16 market records
- 24 blog articles
- 32 capability records
- 24 document/standard records
- 36 quality-control records
- 36 supply-chain records

The production crawl covered all 100 indexable localized routes: static pages, all products, all market detail pages, and all blog articles.

## Final critical pass

A final selective review was completed after the initial audit. All 228 records were re-read; 83 content records received focused edits rather than blanket rewrites. The pass:

- moved broad `frozen poultry exporter` intent to the homepage and kept frozen-chicken-feet supplier/specification intent on the product page;
- separated the market hub, Vietnam landing page, and chicken-feet buying guide by user task;
- replaced implementation-facing language such as “the repository does not…” with buyer-facing commercial explanations;
- gave Vietnam, UAE, Russia, and Thailand distinct procurement purposes;
- added natural Product → Vietnam and Blog → Vietnam links;
- removed inline RFQ links where the same page already presents the primary RFQ button;
- improved Persian temperature wording, Russian document terminology, and Vietnamese IQF/procurement language.

## Editorial findings

The previous content repeatedly presented business focus or possible order requirements as completed facts. Examples included:

- “every shipment” and “every batch” quality claims;
- certified-facility statements without certificate evidence in the repository;
- “active destinations,” “strong demand,” “worldwide,” and customer-service claims;
- fixed consistency or delivery language unsupported by published business data;
- certificate/standard cards that could imply ownership instead of identifying document categories;
- literal translated phrases, especially in Vietnamese and Russian;
- secondary-product quality labels such as “fresh,” “clean,” and “uniform” without documented acceptance criteria.

These were removed or rewritten around information the buyer must confirm for the actual product, order, and destination. Missing prices, MOQ, capacity, availability, lead times, routes, regulatory approvals, certificate numbers, issuers, customers, and shipment volumes were not invented.

## Search-intent map

No search-volume claims are made. The mapping reflects native commercial terminology and the documented business priority.

### English

- Home: frozen poultry exporter from Iran; company and portfolio intent
- Products: frozen chicken products supplier; IQF poultry product range
- Chicken feet: frozen chicken feet supplier; Grade A/A+ IQF chicken feet; bulk buying intent
- Vietnam: frozen chicken feet supply for Vietnam importers
- Market hub: frozen poultry target markets and destination requirements
- Supporting intent: cold chain, order inspection, export documents, international sourcing

### Persian

- صفحه اصلی: صادرکننده محصولات منجمد مرغ از ایران
- پای مرغ: تأمین و خرید عمده پای مرغ منجمد IQF
- سبد محصولات: محصولات منجمد مرغ برای خریداران B2B
- بازار ویتنام: تأمین پای مرغ منجمد برای بازار ویتنام
- محتوای پشتیبان: کنترل کیفیت، زنجیره سرد و مدارک صادراتی

Terminology was standardized around **یخ‌پوش** for glaze, **گرید** for commercial grade, and **درخواست قیمت / استعلام** for RFQ context.

### Russian

- Главная: экспортёр замороженной птицы из Ирана
- Продукт: замороженные куриные лапы / лапки IQF оптом
- Ассортимент: печень, желудки и сердечки IQF для B2B-закупок
- Рынки: требования Вьетнама, ОАЭ, России и Таиланда
- Поддерживающие темы: ветеринарные документы, холодовая цепь и предотгрузочная инспекция

The commercial product copy uses natural Russian word order and distinguishes `лапки` in product copy from the common query form `куриные лапы оптом` in search titles where appropriate.

### Vietnamese

- Trang chủ: nhà xuất khẩu gia cầm đông lạnh từ Iran
- Sản phẩm: nhà cung cấp chân gà đông lạnh IQF
- Việt Nam: nguồn chân gà đông lạnh cho nhà nhập khẩu Việt Nam
- Danh mục: sản phẩm gà đông lạnh cho nhà nhập khẩu, nhà phân phối và đơn vị bán sỉ
- Nội dung hỗ trợ: quy cách, tỷ lệ mạ băng, cảng đến, chuỗi lạnh và bộ chứng từ

Vietnam received dedicated market and product language rather than translated English syntax. Terminology was standardized around **nguồn hàng**, **quy cách**, **mạ băng**, **cấp đông nhanh từng sản phẩm / cấp đông rời IQF**, **cảng đến**, and **bộ chứng từ**.

## Metadata

Every indexable content record now has a unique, locale-specific search title and description:

- visible H1 and SEO title are separate CMS fields;
- all 100 generated routes have one title and one meta description;
- no title or description duplicates were found within any locale;
- page-specific Open Graph images and localized image descriptions are used;
- blog pages emit `article` Open Graph metadata with publication date, author, and tags;
- each page emits three `og:locale:alternate` values.

## Canonical and hreflang

Verified in generated production HTML on all 100 indexable localized routes:

- one self-referencing canonical per route;
- `en`, `fa`, `ru`, `vi`, and `x-default` on every route;
- `x-default` points to the equivalent English URL;
- all language alternatives point to the same product, market, article, or static page;
- `<html lang>` matches the route locale;
- Persian emits `dir="rtl"`; all other locales emit `dir="ltr"`.

The XML sitemap contains the same five language alternatives for all 100 URLs.

## Heading structure

Production crawl result: exactly one non-empty H1 on every indexable route.

Additional corrections:

- market detail pages now use search-intent H1s instead of a country name alone;
- product specification headings use noun phrases instead of button copy;
- the 404 page uses “Page not found” (localized) as H1; `404` is presentational text;
- Markdown body headings remain below the page H1 and market-panel headings are demoted correctly.

## Internal linking

- About market cards now link to localized market detail pages.
- Product listings link to every product detail page.
- Product detail pages preselect the product in the RFQ URL.
- Market detail pages link to RFQ and sibling markets.
- Blog articles link contextually to products, quality control, supply chain, markets, and RFQ.
- All root-relative Markdown links are localized by the existing `Prose` component.

Validation found zero broken Markdown links and zero broken internal links across 116 unique internal paths.

## Image SEO

- Replaced hard-coded English alt text with localized copy.
- Added CMS-managed `imageAlt` fields for products, markets, and articles.
- Added separate market card and panel descriptions.
- Open Graph images now have localized, image-accurate alt text.
- Renamed four generic media files:
  - `records.jpg` → `export-document-inspection-record.jpg`
  - `inspection-line.jpg` → `poultry-temperature-inspection.jpg`
  - `inspection.jpg` → `poultry-quality-control-line.jpg`
  - `cold-hold.jpg` → `frozen-storage-aisle.jpg`

Alt text describes visible content and does not repeat keyword lists.

## Structured data

Verified JSON-LD types in generated HTML:

- Home: `Organization`, `WebSite`, `WebPage`
- Static/index pages: `WebPage`, `BreadcrumbList`
- Product details: `Product`, `WebPage`, `BreadcrumbList`
- Blog articles: `BlogPosting`, `WebPage`, `BreadcrumbList`
- Market details: `WebPage`, `BreadcrumbList`

All entities include the active language where applicable. Article bylines use `Organization`, not a fabricated `Person`. No offers, prices, stock, ratings, reviews, certificate numbers, approvals, or business capacity were added.

## Remaining issues requiring verified business input

The repository still does not contain verified values for:

- price, MOQ, availability, lead time, capacity, or shipping terms;
- fixed ports, carriers, routes, or delivery scope;
- certificate numbers, issuers, validity, or company/facility ownership;
- destination market approvals;
- customer names, sales volume, or shipment history;
- fixed secondary-product size, grade, packing, or shelf-life specifications.

The live copy now identifies these as quotation- or order-specific instead of filling the gaps with marketing claims. They should only be added after documentary verification.

The Decap CMS exposes localized blog collections, while non-blog page/product/market editors remain English-first in the existing CMS configuration. All four localized files are valid and live, but expanding non-blog CMS editing per locale remains a future workflow improvement.

## Validation

- `npm run lint` — passed
- `npm run typecheck` — passed
- `npm run build` — passed; 106 static outputs generated
- Production crawl — 100 indexable locale routes checked; 0 SEO validation errors
- Internal links — 116 unique internal paths checked; 0 broken links
- Sitemap — 100 URLs; 0 missing alternate-language sets

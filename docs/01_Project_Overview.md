# Feiz Food Group — Project Overview

## Master Business & Product Specification v2

## 1. Project

**Company:** Feiz Food Group
**Country:** Iran
**Business:** International B2B Frozen Poultry Exporter

This website is a production-ready international B2B export platform.

It is designed for business buyers, not consumers.

---

## 2. Business Goals

The website must:

- Attract international buyers
- Build international credibility
- Present export capabilities
- Generate qualified RFQs
- Communicate supply-chain reliability
- Demonstrate quality-control processes
- Support long-term B2B relationships

Primary conversion:

**Request a Quote**

---

## 3. Target Buyers

Primary audiences:

- Importers
- Distributors
- Wholesalers
- Food processing companies

The experience must prioritize business decision-makers.

---

## 4. Product Portfolio

### Primary Product

**Frozen Chicken Feet**

### Secondary Products

- Chicken Liver
- Chicken Gizzard
- Chicken Heart

All four products must have independent dynamic product pages.

Chicken Feet receives the deepest and most detailed presentation because it is the primary commercial focus.

---

## 5. Product Architecture

```
Products
├── Frozen Chicken Feet
├── Chicken Liver
├── Chicken Gizzard
└── Chicken Heart

```

Each product is CMS-driven.

Product content may include:

- Name
- Slug
- Description
- Images
- Specifications
- Packaging
- Quality information
- Storage information
- Cold-chain information
- Enabled status
- Featured status
- Display order

Never invent missing product information.

---

## 6. Product Information

Known Chicken Feet specifications include:

- Grade A / Grade A+
- IQF Frozen
- 35–55g average weight
- Natural white color
- Clean nails
- No black spots
- No bad odor after defrost
- 5–10% glaze
- No feathers
- No blood
- No contamination
- Storage temperature: -18°C

These values must remain editable through the CMS.

---

## 7. Target Markets

### Primary

- Vietnam

### Secondary

- UAE
- Russia
- Thailand

Use **one Markets page**.

Do not create separate market pages at this stage.

---

## 8. Website Pages

Required pages:

- Home
- About Us
- Products
- Markets
- Supply Chain
- Quality Control
- Certifications
- Contact
- Blog

Products additionally have individual product detail routes.

---

## 9. Trust Architecture

Trust content is divided into two independent visual systems.

### Certifications & Compliance

Display:

- HACCP
- ISO 22000
- Halal
- Health Certificate
- Veterinary Certificate
- Certificate of Origin

Use official certification assets/logos where applicable.

### Trust / Quality / Capabilities

Dynamic feature cards may include:

- Reliable Supply
- Strict Quality Control
- Cold-Chain Integrity
- Bulk Export
- Export Documentation
- Private Label
- Pre-Shipment Inspection
- Long-Term Cooperation

These use Lucide React icons.

---

## 10. Supply Chain

Communicate the export process through:

- Farm
- Processing
- Sorting
- IQF Freezing
- Cold Storage
- Quality Inspection
- Container Loading
- Sea Shipping
- Destination Delivery

---

## 11. Quality Control

Relevant processes include:

- Sample Approval
- Temperature Control
- Glaze Test
- Size Uniformity
- Broken Ratio Inspection
- Defrost Smell Test
- Random Carton Inspection
- Container Sealing Photos
- Pre-Shipment Inspection

Only verified processes should be presented as actual company practice.

---

## 12. RFQ

The primary conversion mechanism is a concise B2B RFQ form.

Required:

- Full Name
- Company Name
- Business Email
- Country
- Product
- Quantity
- Message

Optional:

- Destination / Port
- Packaging / Specification

Product choices are CMS-driven.

Quantity should accept practical B2B formats such as:

`20 MT / 1 × 40' container`

Do not force unnecessary contact fields.

---

## 13. RFQ Email Architecture

Use **Resend**.

Flow:

RFQ Form → Server-side API → Validation / Anti-spam → Resend → Company inbox

Use buyer email as:

`Reply-To`

This allows the sales team to reply directly to the buyer.

API credentials must remain server-side.

---

## 14. Languages

Required:

- English — default
- Persian
- Russian
- Vietnamese

No Arabic.

Vietnamese receives high localization priority because Vietnam is the primary target market.

---

## 15. UX Priorities

The buyer should quickly understand:

- Product
- Specifications
- Quality
- Supply capability
- Export markets
- How to request a quote

Avoid unnecessary friction and consumer-style interactions.

---

## 16. Quality Goals

Priority order:

1. Trust and credibility
2. Buyer UX and conversion
3. Performance
4. SEO
5. Responsive experience
6. Maintainable architecture
7. Security

# Feiz Food Group — Project Rules

## Master Production Specification v2

## 1. Role

Act as a senior:

- Full-Stack Developer
- UI/UX Designer
- Product Designer
- SEO Specialist
- B2B Website Expert
- Security & Performance Engineer

Make professional production-level decisions.

This is a real international B2B business website, not a demo.

Prioritize:

- Buyer experience
- Trust and credibility
- Conversion
- Accessibility
- Security
- SEO
- Performance
- Maintainability
- Scalability

---

## 2. Development Principles

Always follow:

- Clean Code
- Separation of concerns
- Type safety
- Reusable architecture
- Server-first architecture
- Minimal dependencies
- Modern Next.js practices
- Progressive enhancement
- Accessibility
- Security best practices

Never use:

- Quick hacks
- Demo-quality solutions
- Duplicate logic
- Unnecessary dependencies
- Large monolithic components
- Hard-coded CMS-managed content

---

## 3. Technology Stack

### Core

- Next.js 16
- App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Decap CMS
- Markdown

### UI

Use the latest shadcn/ui approach.

Do not install Radix UI separately.

Use Lucide React for interface and capability icons.

### Content

Content must be CMS-driven wherever practical.

Architecture:

Decap CMS → GitHub → Markdown → Next.js → UI

No database is required initially.

Do not use:

- Prisma
- PostgreSQL

---

## 4. Architecture

Use Server Components by default.

Use Client Components only when interaction requires them.

Keep:

- UI
- business logic
- content/data
- validation
- API logic

separated.

Use feature-based organization where appropriate.

Components must remain:

- Small
- Focused
- Reusable
- Testable
- Maintainable

---

## 5. Dynamic Content Requirement

The following must be CMS-driven and configurable:

- Pages
- Products
- Product specifications
- Product images
- Certifications
- Trust features
- Quality features
- Capability features
- Markets
- Blog posts
- Relevant page sections

Do not hard-code CMS-managed content inside UI components.

### Trust / Capability Features

Each feature should support:

- title
- description
- icon
- enabled
- order

Icons are referenced by name and rendered through a controlled Lucide React icon registry.

### Certifications

Support:

- name
- logo
- description
- enabled
- order

Required certifications:

- HACCP
- ISO 22000
- Halal
- Health Certificate
- Veterinary Certificate
- Certificate of Origin

Certification cards and Trust/Capability cards must remain visually separate.

---

## 6. Content Rules

Write like a senior international B2B copywriter.

Content must be:

- Natural
- Human
- Professional
- Concise
- Clear
- Trust-focused
- Internationally understandable

Target:

- Importers
- Distributors
- Wholesalers
- Food processors

Avoid:

- AI-sounding copy
- Empty marketing language
- Exaggeration
- Fake claims
- Keyword stuffing
- Consumer-style messaging
- Long unnecessary paragraphs

Never invent certifications, capabilities, specifications or business claims.

---

## 7. UI/UX Principles

The website must feel:

- Premium
- Modern
- Minimal
- Industrial
- Professional
- International
- Trustworthy

Primary UX objective:

Make an international buyer understand:

1. What Feiz Food exports
2. What product is available
3. Why the company is credible
4. Where it can supply
5. How to request a quotation

Core buyer journey:

Home → Product → Trust / Quality → Market / Supply → RFQ

Do not create consumer-oriented UX.

---

## 8. Responsive Design

Mobile-first.

Every component must work across:

- Mobile
- Tablet
- Desktop
- Large screens

Pay special attention to:

- Header
- Navigation
- Product cards
- Forms
- Tables
- Hero sections
- Typography
- Images
- RFQ flow

---

## 9. Image Rules

Use `next/image` for website images.

Never use ordinary `<img>` for website content.

Images must support:

- Responsive sizing
- Correct dimensions
- Lazy loading where appropriate
- Priority loading only when justified
- Proper alt text
- WebP/AVIF where appropriate
- Minimal layout shift

Industrial imagery should focus on:

- Reefer containers
- Cargo ships
- Cold storage
- IQF production
- Quality inspection
- Export logistics

Avoid generic consumer-food imagery.

---

## 10. Performance

Prioritize:

- Core Web Vitals
- Fast server response
- Low JavaScript usage
- Optimized fonts
- Optimized images
- Static generation where appropriate
- Efficient data access
- Minimal client-side state

---

## 11. Accessibility

Production UI must support:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Proper form labels
- Accessible errors
- Screen-reader compatibility
- Sufficient contrast
- Reduced-motion preferences

Use ARIA only where semantic HTML is insufficient.

---

## 12. Security

Production security requirements include:

- HTTPS
- HSTS
- Security headers
- CSP
- Secure environment variables
- Server-side input validation
- Rate limiting
- Anti-bot protection
- XSS protection
- API protection
- Dependency auditing
- VPS hardening
- Safe error handling
- Logging
- Backup strategy

Never expose secrets to the client.

---

## 13. QA Commands

The project must support final audits using:

- `/killcritic`
- `/optimize`
- `/seoaudit`
- `/uiaudit`
- `/uxaudit`

Security testing must also be performed before production deployment.

---

## 14. Final Requirement

Every implementation must be production-ready.

The final product must combine:

- Premium B2B UX
- Strong credibility
- Clean architecture
- Excellent performance
- Strong multilingual SEO
- Secure RFQ workflow
- CMS-driven content
- Scalable structure

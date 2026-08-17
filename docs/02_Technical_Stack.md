# Feiz Food Group — Technical Stack

## Production Architecture v2

## 1. Framework

Use:

- Next.js 16
- App Router
- TypeScript

Rules:

- Server Components by default
- Client Components only where required
- Modern App Router architecture
- Strong type safety

---

## 2. Styling

Use:

- Tailwind CSS
- shadcn/ui

Do not install Radix UI separately.

Use Lucide React for interface icons.

---

## 3. CMS

Use:

**Decap CMS**

Content storage:

**Markdown in GitHub**

Architecture:

```
Decap CMS
↓
GitHub
↓
Markdown
↓
Next.js
↓
Rendered UI

```

CMS-managed entities include:

- Pages
- Products
- Product specifications
- Certifications
- Trust features
- Markets
- Blog
- Relevant reusable content

---

## 4. Database

No database initially.

Do not use:

- Prisma
- PostgreSQL

The content model is Git-based.

---

## 5. Dynamic Architecture

CMS-managed content must not be hard-coded into components.

Use reusable content schemas.

### Products

Support independent product records and routes.

### Certifications

Support:

- title
- logo
- description
- enabled
- order

### Trust Features

Support:

- title
- description
- Lucide icon name
- enabled
- order

Use an icon registry rather than dynamically rendering arbitrary components from untrusted input.

---

## 6. Routing

Locales:

```
/en
/fa
/ru
/vi

```

Root:

```
/ → /en

```

Product example:

```
/en/products/frozen-chicken-feet
/fa/products/frozen-chicken-feet
/ru/products/frozen-chicken-feet
/vi/products/frozen-chicken-feet

```

Use stable English slugs across locales.

---

## 7. Localization

Direction:

```
EN → LTR
FA → RTL
RU → LTR
VI → LTR

```

Set direction at document level.

Use logical CSS properties where possible.

Do not create separate RTL versions of components.

---

## 8. SEO

Implement:

- Metadata API
- Dynamic metadata
- Canonical URLs
- Sitemap
- Robots
- hreflang
- Open Graph
- Structured data
- Semantic HTML

Schemas should be contextually assigned.

---

## 9. Performance

Prioritize:

- Static generation where appropriate
- Server rendering where required
- Optimized images
- Optimized fonts
- Minimal JavaScript
- Efficient data loading
- Core Web Vitals

---

## 10. RFQ API

The RFQ API must include:

- Server-side validation
- Input sanitization
- Rate limiting
- Anti-bot protection
- Safe error responses
- Resend integration
- Reply-To support

Never expose the Resend API key to the browser.

---

## 11. Security

Minimum production baseline:

- HTTPS
- HSTS
- CSP
- Security headers
- Secure cookies where applicable
- Environment-based secrets
- Dependency audit
- API protection
- Rate limiting
- XSS protection
- Safe logging
- VPS hardening
- Backup and recovery strategy

---

## 12. Error Handling

Provide deliberate states for:

- 404
- 500
- Loading
- Empty content
- Missing CMS content
- RFQ validation error
- RFQ submission failure
- RFQ submission success
- Image failure

Do not expose stack traces or internal implementation details to users.

---

## 13. Hosting

Target:

**VPS**

Architecture should remain lightweight.

Production deployment should support:

- Reverse proxy
- HTTPS
- Node.js process management
- Environment variables
- Logs
- Backups
- Rollback strategy

---

## 14. Deployment

Preferred workflow:

```
GitHub
↓
Build / Deploy
↓
VPS
↓
Reverse Proxy
↓
Next.js

```

Decap content changes should be compatible with automated deployment.

---

## 15. Code Quality

Avoid:

- Large components
- Duplicate logic
- Unnecessary packages
- Hard-coded CMS data
- Client-side rendering without need
- Temporary implementations

All production code must be maintainable and scalable.
# Feiz Food Group — UI Design System

## Premium B2B Design Specification v2

## 1. Design Direction

Primary style:

- Premium Corporate
- Modern Minimal
- Luxury B2B
- Industrial Editorial
- Subtle Glassmorphism

Glassmorphism is a secondary technique only.

It must never dominate the visual identity.

The overall experience should feel:

- Clean
- Premium
- Industrial
- Credible
- International

References such as Stripe, Vercel, Raycast and Linear are inspiration only.

Do not copy their layouts or visual identity.

---

## 2. Color System

### Primary

**Midnight Navy**

Used for:

- Brand identity
- Primary buttons
- Major navigation elements
- Key surfaces

### Secondary / Interaction

**Cyan 600**

Used for:

- Secondary buttons
- Interactive states
- Hover states
- Active states
- Focus accents
- Interactive icon backgrounds

### Hover

Primary button hover:

- Cyan 600 or Cyan 700

Secondary button hover:

- Cyan 700

Interactive icon hover:

- Cyan 600

### Supporting Colors

- Smoke White
- Silver
- Emerald only for success states

---

## 3. Button System

Every button and interactive CTA on the site is rendered through one
component: `src/components/ui/button.tsx`. Do not hand-roll button classes
or per-instance transitions — pick a variant and size. This is what keeps
Home, Products, Markets, RFQ, Header, Footer and Mobile Navigation feeling
like one design system.

### Variants

- `primary` — Cyan surface, white text. Subtle elevation at rest, cyan glow
  on hover. The conversion action: **Request a Quote**, form submits.
- `secondary` — Solid Midnight Navy, white text. Second emphasis on light
  surfaces (e.g. View Full Specifications).
- `outline` — White surface, navy border/ink. Companion on light surfaces.
  Hover: border + text shift toward Cyan.
- `outline-inverse` — White border + translucent fill on navy/dark surfaces.
- `ghost` — Transparent, navy ink, on light surfaces.
- `ghost-inverse` — Transparent, white ink, on navy/dark surfaces (used for
  footer social icon buttons).

### Sizes

- `sm` — h-9, compact (Header CTA, dense panels).
- `md` — h-11, default (section CTAs, form submit, cards).
- `lg` — h-12, hero & landing CTAs, comfortable touch target on mobile.
- `icon` / `icon-sm` — square icon buttons.

All sizes share the same radius (`rounded-lg`), typography weight
(`font-semibold`), and gap system, so variants are drop-in interchangeable.

### Motion (single source of truth)

Timing tokens live in `globals.css`; never hardcode a duration on a button:

- `--btn-duration: 200ms`
- `--btn-ease: cubic-bezier(0.22, 1, 0.36, 1)`
- `--btn-icon-nudge: 3px`

Every button uses one `transition-all` across background, border, text,
shadow, and the press scale, so all properties move together. Motion is
premium and subtle: no hover lift, no scale-up on hover.

- Hover — background / border / text / shadow transition only.
- Active / pressed — very small `scale-[0.98]`.
- Focus — visible cyan `focus-visible` outline (offset 2px), keyboard-first.
- Disabled — `opacity-60`, no shadow, `pointer-events-none`.
- `prefers-reduced-motion` — all button transitions collapse to ~0ms.

### Icon movement

Icons opt into the centralized hover nudge with a data attribute; the CSS in
`globals.css` handles the rest (RTL-aware, reduced-motion aware):

- Trailing arrow: `<ArrowRight data-icon="end" />` nudges forward on hover/focus.
- Leading arrow: `<ArrowLeft data-icon="start" />` nudges backward.

Keep `rtl:rotate-180` on directional arrows; the nudge uses the `translate`
property so it composes with the rotation instead of overriding it.

### Usage

```tsx
import { Button } from "@/components/ui/button";

// Real button (form submit, actions)
<Button type="submit" size="lg">Request a Quote</Button>

// Rendered as a link while keeping the full button treatment
<Button asChild variant="outline">
  <Link href="/products">View Products</Link>
</Button>
```

Buttons must remain accessible and clearly distinguishable.

---

## 4. Borders & Radius

Use a consistent rounded system.

Preferred radius scale:

- `sm`
- `md`
- `lg`

Use larger radius such as `xl` only where visually justified.

Avoid arbitrary radius values.

Standard border:

**1px**

Border colors should remain subtle.

Interactive border:

**Cyan 600**

Focus:

Visible Cyan focus ring.

Apply the same system to:

- Buttons
- Inputs
- Cards
- Panels
- Product cards
- Certification cards
- Trust cards
- Modals

---

## 5. Header

Requirements:

- Sticky
- Transparent over hero when appropriate
- Glass surface after scroll
- Backdrop blur
- Compact professional height
- Smooth transition

Do not overuse blur or glass effects.

---

## 6. Navigation

Desktop:

- Spacious
- Clear hierarchy
- Dropdown where needed
- Keyboard accessible

Mobile:

- Tap-based navigation
- Clear hierarchy
- Large touch targets
- Accessible focus states

Primary CTA:

**Request a Quote**

The CTA should remain easy to discover without making the header visually heavy.

---

## 7. Layout

Use:

- Mobile-first
- 8px spacing system
- 1280–1440px maximum content width
- Large section spacing
- Strong visual hierarchy
- Responsive grids

Use logical spacing properties to support RTL.

---

## 8. Cards

Cards should use:

- Subtle borders
- Soft shadows
- Consistent rounded corners
- Controlled glass effects where appropriate

Interactive card hover:

- Slight elevation
- Subtle border transition toward Cyan
- Minimal Cyan accent
- 150–300ms transition

Avoid excessive glow.

---

## 9. Certification Cards

Certification cards form a dedicated section.

Display:

- HACCP
- ISO 22000
- Halal
- Health Certificate
- Veterinary Certificate
- Certificate of Origin

Each card may contain:

- Official logo
- Name
- Short description

Certification cards must be visually distinct from Trust/Capability cards.

Content is CMS-driven.

---

## 10. Trust / Quality / Capability Cards

Separate section.

Possible features:

- Reliable Supply
- Strict Quality Control
- Cold-Chain Integrity
- Bulk Export
- Export Documentation
- Private Label
- Pre-Shipment Inspection
- Long-Term Cooperation

Use **Lucide React** icons.

Features are dynamic and controlled by CMS.

Each card supports:

- Icon
- Title
- Description
- Enabled state
- Order

---

## 11. Typography

### Latin / Cyrillic / Vietnamese

Use:

**Inter**

### Persian

Use:

**Vazirmatn**

Typography must support:

- English
- Persian
- Russian
- Vietnamese

Recommended weights:

- 400 — body
- 500 — labels / UI
- 600 — buttons / subheadings
- 700 — major headings

Avoid unnecessary font weights.

Use fluid responsive sizing with `clamp()` where appropriate.

---

## 12. Responsive Typography

Indicative hierarchy:

- H1: approximately 56–72px desktop
- H2: approximately 40–48px
- H3: approximately 28–32px
- Body: approximately 16–18px
- Small: approximately 14px

Adjust fluidly across breakpoints.

---

## 13. Animation

Use:

- 150–300ms transitions
- GPU-friendly transforms
- Small fade/slide interactions
- Hover transitions

Avoid:

- Heavy animation
- Excessive parallax
- Large motion
- Constant movement

Respect reduced-motion preferences.

---

## 14. Imagery

Use professional industrial imagery:

- Cargo ships
- Reefer containers
- Cold storage
- IQF production
- Quality inspection
- Export logistics
- Poultry processing

Avoid:

- Consumer-food advertising
- Generic stock marketing imagery
- Overly staged food photography

---

## 15. Logo

Direction:

- Modern F monogram
- Minimal
- Premium
- Corporate

Primary colors:

- Midnight Navy
- Silver

---

## 16. Forms

Forms must be:

- Accessible
- Short
- Clear
- Mobile-friendly
- B2B-oriented

RFQ is the primary form.

Do not add unnecessary fields merely to collect data.

---

## 17. UI Quality

Every component must maintain:

- Consistent spacing
- Consistent radius
- Consistent borders
- Clear hierarchy
- Responsive behavior
- Keyboard accessibility
- Visible focus
- Predictable interaction

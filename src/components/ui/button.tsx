import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Unified Button design system — the single source of truth for every
 * button and interactive CTA on the site (header, hero, sections, cards,
 * forms, footer, error pages, mobile navigation).
 *
 * ── Motion ────────────────────────────────────────────────────────────
 * All timing lives in `globals.css` (`--btn-duration`, `--btn-ease`,
 * `--btn-icon-nudge`). Every variant shares one transition treatment:
 * background, border, text colour, shadow and the press-scale all move
 * with the same 200ms premium ease. Do not hand-roll per-instance
 * transitions — add a variant here instead.
 *
 * ── Icon movement ─────────────────────────────────────────────────────
 * Icons opt into the centralized hover nudge with a data attribute:
 *   <ArrowRight data-icon="end" />   trailing icon → nudges forward
 *   <ArrowLeft  data-icon="start" /> leading icon  → nudges backward
 * The nudge is CSS-driven, RTL-aware and disabled under reduced motion
 * (see the `[data-slot="button"] [data-icon]` rules in globals.css).
 *
 * ── Rendering as a link ───────────────────────────────────────────────
 * Pass `asChild` with a single child element (e.g. `next/link`) to keep
 * semantic markup while inheriting the full button treatment.
 *
 * Minimal dependency-free `Slot` primitive, mirroring the `asChild`
 * behavior of shadcn/ui buttons. This intentionally depends on no
 * third-party UI primitive, per the project's UI library constraints.
 */

type SlotProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode
}

/** Merge slot props onto the single child element (class names and inline
 * styles are combined; event handlers from both sides are composed). */
function mergeProps(
  slotProps: Record<string, unknown>,
  childProps: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...slotProps, ...childProps }

  for (const key of Object.keys(childProps)) {
    const slotValue = slotProps[key]
    const childValue = childProps[key]

    if (key === "className") {
      merged[key] = cn(slotValue as string, childValue as string)
    } else if (key === "style") {
      merged[key] = {
        ...(slotValue as React.CSSProperties),
        ...(childValue as React.CSSProperties),
      }
    } else if (
      key.startsWith("on") &&
      typeof slotValue === "function" &&
      typeof childValue === "function"
    ) {
      merged[key] = (...args: unknown[]) => {
        ;(childValue as (...a: unknown[]) => void)(...args)
        ;(slotValue as (...a: unknown[]) => void)(...args)
      }
    }
  }

  return merged
}

function Slot({ children, ...props }: SlotProps) {
  const child = React.Children.only(children) as React.ReactElement<
    Record<string, unknown>
  >

  if (!React.isValidElement(child)) {
    throw new Error(
      "Slot: expected a single React element as child so it can be rendered as the button element."
    )
  }

  return React.cloneElement(child, mergeProps(props, child.props as Record<string, unknown>))
}

const buttonVariants = cva(
  [
    // ── Layout & typography (identical across all variants) ──
    // Note: `border` width + color live in each variant (never in the base),
    // so tailwind-merge cannot strand a conflicting `border-transparent` next to
    // a variant border color — the stylesheet order would let it win.
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg text-center font-semibold outline-none select-none",
    // ── Unified motion: one duration + one ease for every property ──
    "transition-all duration-[var(--btn-duration)] ease-[var(--btn-ease)]",
    // ── Press: very small scale, no exaggerated movement ──
    "active:scale-[0.98]",
    // ── Keyboard focus: matches the site-wide cyan focus treatment ──
    // `focus-visible:rounded-lg` keeps the radius stable while the global
    // `*:focus-visible` rule is applied.
    "focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-brand",
    // ── Disabled ──
    "disabled:pointer-events-none disabled:opacity-60 disabled:shadow-none",
    // ── Icon hygiene ──
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        /** Brand CTA — cyan surface, subtle elevation, cyan glow on hover. */
        primary:
          "border border-transparent bg-cyan-brand text-white shadow-btn hover:bg-cyan-hover hover:shadow-btn-hover",
        /** Solid midnight navy — secondary emphasis on light surfaces. */
        secondary:
          "border border-transparent bg-navy text-white hover:bg-navy-light hover:shadow-btn-navy",
        /** Bordered companion on light surfaces — white with navy ink. */
        outline:
          "border border-navy/15 bg-white text-navy hover:border-cyan-brand/40 hover:bg-cyan-brand/5 hover:text-cyan-brand",
        /** Bordered companion on navy/dark surfaces. */
        "outline-inverse":
          "border border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/20",
        /** Minimal, borderless — light surfaces. */
        ghost: "border border-transparent text-navy hover:bg-navy/5",
        /** Minimal, borderless — navy/dark surfaces. */
        "ghost-inverse": "border border-transparent text-white hover:bg-white/10",
      },
      size: {
        /** Compact — header CTA, dense panels. */
        sm: "h-9 px-4 text-sm",
        /** Default — section CTAs, form submits, cards. */
        md: "h-11 px-5 text-sm",
        /** Hero & landing CTAs; comfortable touch target on mobile. */
        lg: "h-12 px-7 text-base",
        /** Square icon buttons (footer social icons etc.). */
        icon: "size-11",
        /** Compact square icon buttons. */
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

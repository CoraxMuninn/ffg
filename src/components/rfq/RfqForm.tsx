"use client";

import { useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import { Toaster } from "sonner";

import { TurnstileWidget } from "./TurnstileWidget";
import { Field, errorInputClass, inputClass } from "./Field";
import {
  FIELD_LABEL_KEY,
  FIELD_ORDER,
  LIMITS,
  useRfqForm,
} from "./use-rfq-form";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { localizedPath } from "@/lib/i18n/routes";
import { cn } from "@/lib/utils";

interface RfqFormProps {
  products: Product[];
  dictionary: Dictionary;
  locale: Locale;
  /** Public Turnstile site key (passed from the Server Component). */
  turnstileSiteKey?: string;
  /** Fixed Turnstile action verified server-side (passed from the Server Component). */
  turnstileAction?: string;
}

/**
 * RFQ contact form — presentation only (Roadmap Task 6.2).
 *
 * All state and behaviour live in `useRfqForm` (validation, server-error
 * mapping, Turnstile lifecycle, submission/transport). This component renders
 * the fields from the hook's values/handlers and the success state. Field ids,
 * aria wiring, the validation summary, and the success region are unchanged.
 */
export function RfqForm({
  products,
  dictionary,
  locale,
  turnstileSiteKey,
  turnstileAction,
}: RfqFormProps) {
  const d = dictionary.rfq;
  const turnstileConfigured = Boolean(turnstileSiteKey);

  const {
    form,
    set,
    errors,
    turnstileError,
    isSubmitting,
    submitted,
    resetSignal,
    handleTurnstileToken,
    handleTurnstileExpire,
    handleTurnstileError,
    handleSubmit,
  } = useRfqForm({ rfq: d, turnstileConfigured });

  // Product preselection lives on the client so the contact route stays
  // statically cacheable (Roadmap Task 7.3 / PERF-M3): the page no longer reads
  // searchParams on the server. Valid ?product=<slug> selects that product; an
  // invalid/unknown slug is ignored. useLayoutEffect on the client sets it
  // before paint (no flash); during SSR it is a no-op (window is undefined),
  // so hydration matches the static HTML.
  const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;
  useIsoLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const slug = new URLSearchParams(window.location.search).get("product");
    if (slug && products.some((product) => product.slug === slug)) {
      set("product")(slug);
    }
    // One-time mount effect: `products` is server-provided and stable, and
    // `set` delegates to the stable setState dispatch.
  }, [products]);

  if (submitted) {
    return (
      <div
        className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-8 text-center"
        role="status"
        aria-live="polite"
      >
        <h3 className="mb-2 text-xl font-bold text-navy">{d.successTitle}</h3>
        <p className="mx-auto max-w-md leading-relaxed text-ink">{d.successText}</p>
      </div>
    );
  }

  const visibleErrors = FIELD_ORDER.filter((field) => errors[field]);

  return (
    <>
      <Toaster
        dir="auto"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#152238",
            color: "#e2e8f0",
            border: "1px solid rgba(148, 163, 184, 0.1)",
          },
        }}
      />
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Honeypot — hidden from users, catches bots. */}
        <div className="sr-only" aria-hidden="true">
          <label htmlFor="rfq-website">Website</label>
          <input
            id="rfq-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => set("website")(e.target.value)}
          />
        </div>

        {/* Inline validation summary (UX-M3): announced and focusable, with
            jump-links so keyboard/SR users reach each field directly. */}
        {visibleErrors.length > 0 && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-lg border border-red-200 bg-red-50/70 p-4"
          >
            <p className="mb-2 text-sm font-semibold text-red-700">{d.errorSummary}</p>
            <ul className="list-disc space-y-1 ps-5">
              {visibleErrors.map((field) => (
                <li key={field}>
                  <a
                    href={`#rfq-${field}`}
                    className="text-sm font-medium text-red-700 underline underline-offset-2"
                  >
                    {d[FIELD_LABEL_KEY[field]]}: {errors[field]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={d.name} htmlFor="rfq-name" required error={errors.name} describedBy="rfq-name-error">
            <input
              id="rfq-name"
              name="name"
              required
              maxLength={LIMITS.name}
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              placeholder={d.namePlaceholder}
              className={cn(inputClass, errors.name && errorInputClass)}
              autoComplete="name"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "rfq-name-error" : undefined}
            />
          </Field>

          <Field label={d.company} htmlFor="rfq-company" required error={errors.company} describedBy="rfq-company-error">
            <input
              id="rfq-company"
              name="company"
              required
              maxLength={LIMITS.company}
              value={form.company}
              onChange={(e) => set("company")(e.target.value)}
              placeholder={d.companyPlaceholder}
              className={cn(inputClass, errors.company && errorInputClass)}
              autoComplete="organization"
              aria-invalid={errors.company ? true : undefined}
              aria-describedby={errors.company ? "rfq-company-error" : undefined}
            />
          </Field>

          <Field label={d.email} htmlFor="rfq-email" required error={errors.email} describedBy="rfq-email-error">
            <input
              id="rfq-email"
              name="email"
              type="email"
              dir="ltr"
              required
              maxLength={LIMITS.email}
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              placeholder={d.emailPlaceholder}
              className={cn(inputClass, "text-left", errors.email && errorInputClass)}
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "rfq-email-error" : undefined}
            />
          </Field>

          <Field label={d.phone} htmlFor="rfq-phone">
            <input
              id="rfq-phone"
              name="phone"
              type="tel"
              dir="ltr"
              maxLength={LIMITS.phone}
              value={form.phone}
              onChange={(e) => set("phone")(e.target.value)}
              placeholder={d.phonePlaceholder}
              className={cn(inputClass, "text-left")}
              autoComplete="tel"
            />
          </Field>

          <Field label={d.country} htmlFor="rfq-country" required error={errors.country} describedBy="rfq-country-error">
            <input
              id="rfq-country"
              name="country"
              required
              maxLength={LIMITS.country}
              value={form.country}
              onChange={(e) => set("country")(e.target.value)}
              placeholder={d.countryPlaceholder}
              className={cn(inputClass, errors.country && errorInputClass)}
              autoComplete="country-name"
              aria-invalid={errors.country ? true : undefined}
              aria-describedby={errors.country ? "rfq-country-error" : undefined}
            />
          </Field>

          <Field label={d.product} htmlFor="rfq-product" required error={errors.product} describedBy="rfq-product-error">
            <select
              id="rfq-product"
              name="product"
              required
              value={form.product}
              onChange={(e) => set("product")(e.target.value)}
              className={cn(inputClass, "appearance-none", errors.product && errorInputClass)}
              aria-invalid={errors.product ? true : undefined}
              aria-describedby={errors.product ? "rfq-product-error" : undefined}
            >
              <option value="">{d.productPlaceholder}</option>
              {products.map((product) => (
                <option key={product.slug} value={product.slug}>
                  {product.title}
                </option>
              ))}
            </select>
          </Field>

          <Field label={d.quantity} htmlFor="rfq-quantity" required error={errors.quantity} describedBy="rfq-quantity-error">
            <input
              id="rfq-quantity"
              name="quantity"
              required
              maxLength={LIMITS.quantity}
              value={form.quantity}
              onChange={(e) => set("quantity")(e.target.value)}
              placeholder={d.quantityPlaceholder}
              className={cn(inputClass, errors.quantity && errorInputClass)}
              aria-invalid={errors.quantity ? true : undefined}
              aria-describedby={errors.quantity ? "rfq-quantity-error" : undefined}
            />
          </Field>

          <Field label={d.destinationPort} htmlFor="rfq-port">
            <input
              id="rfq-port"
              name="destinationPort"
              dir="ltr"
              maxLength={LIMITS.destinationPort}
              value={form.destinationPort}
              onChange={(e) => set("destinationPort")(e.target.value)}
              placeholder={d.destinationPortPlaceholder}
              className={cn(inputClass, "text-left")}
            />
          </Field>

          <Field label={d.packaging} htmlFor="rfq-packaging">
            <input
              id="rfq-packaging"
              name="packaging"
              maxLength={LIMITS.packaging}
              value={form.packaging}
              onChange={(e) => set("packaging")(e.target.value)}
              placeholder={d.packagingPlaceholder}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label={d.message} htmlFor="rfq-message" required error={errors.message} describedBy="rfq-message-error">
          <textarea
            id="rfq-message"
            name="message"
            dir="auto"
            required
            maxLength={LIMITS.message}
            rows={4}
            value={form.message}
            onChange={(e) => set("message")(e.target.value)}
            placeholder={d.messagePlaceholder}
            className={cn(inputClass, errors.message && errorInputClass)}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? "rfq-message-error" : undefined}
          />
        </Field>

        <TurnstileWidget
          siteKey={turnstileSiteKey}
          action={turnstileAction}
          onTokenChange={handleTurnstileToken}
          onExpire={handleTurnstileExpire}
          onError={handleTurnstileError}
          resetSignal={resetSignal}
        />
        {turnstileError && (
          <p className="text-xs font-medium text-red-600" role="alert">
            {turnstileError}
          </p>
        )}

        <p className="text-xs leading-relaxed text-label">{d.note}</p>
        {/* Concise data-use link near submission (UX-L2). Does not assert legal consent. */}
        <p className="text-xs text-ink-soft">
          {d.privacyNote}{" "}
          <Link
            href={localizedPath(locale, "/privacy")}
            className="font-medium text-cyan-link underline underline-offset-2 hover:text-cyan-link-hover"
          >
            {d.privacyLinkText}
          </Link>
          .
        </p>

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? d.submitting : d.submit}
        </Button>
      </form>
    </>
  );
}

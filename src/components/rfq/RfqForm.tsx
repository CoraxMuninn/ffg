"use client";

import { useCallback, useState } from "react";
import { Toaster, toast } from "sonner";
import type { ReactNode } from "react";

import { TurnstileWidget } from "./TurnstileWidget";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/content";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { cn } from "@/lib/utils";

interface RfqFormProps {
  products: Product[];
  dictionary: Dictionary;
  /** Public Turnstile site key (passed from the Server Component). */
  turnstileSiteKey?: string;
  /** Preselected product slug from `?product=`. */
  selectedProductSlug?: string;
}

interface FormState {
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  product: string;
  quantity: string;
  message: string;
  destinationPort: string;
  packaging: string;
  website: string; // honeypot
  turnstileToken: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  name: "",
  company: "",
  email: "",
  phone: "",
  country: "",
  product: "",
  quantity: "",
  message: "",
  destinationPort: "",
  packaging: "",
  website: "",
  turnstileToken: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  describedBy?: string;
  children: ReactNode;
}

function Field({ label, htmlFor, required, error, describedBy, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-navy">
        {label}
        {required && <span className="ms-1 text-cyan-brand">*</span>}
      </label>
      {children}
      {error && (
        <p id={describedBy} className="mt-1.5 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-silver focus:border-cyan-brand focus:outline-none focus:ring-2 focus:ring-cyan-brand/30";

const errorInputClass =
  "border-red-400 focus:border-red-400 focus:ring-red-400/30";

export function RfqForm({
  products,
  dictionary,
  turnstileSiteKey,
  selectedProductSlug,
}: RfqFormProps) {
  const d = dictionary.rfq;
  const preselected =
    selectedProductSlug && products.some((product) => product.slug === selectedProductSlug)
      ? selectedProductSlug
      : "";
  const [form, setForm] = useState<FormState>({ ...initialForm, product: preselected });
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleTurnstileToken = useCallback((token: string) => {
    setForm((prev) => ({ ...prev, turnstileToken: token }));
  }, []);

  function validate(): Errors {
    const next: Errors = {};
    if (!form.name.trim()) next.name = d.errorRequired;
    if (!form.company.trim()) next.company = d.errorRequired;
    if (!form.email.trim()) next.email = d.errorRequired;
    else if (!EMAIL_RE.test(form.email)) next.email = d.errorEmail;
    if (!form.country.trim()) next.country = d.errorRequired;
    if (!form.product) next.product = d.errorRequired;
    if (!form.quantity.trim()) next.quantity = d.errorQuantity;
    if (form.message.trim().length < 10) next.message = d.errorMessage;
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          company: form.company,
          email: form.email,
          phone: form.phone,
          country: form.country,
          product: form.product,
          quantity: form.quantity,
          message: form.message,
          destinationPort: form.destinationPort,
          packaging: form.packaging,
          website: form.website,
          turnstileToken: form.turnstileToken,
        }),
      });

      const data = (await res.json()) as { ok: boolean; error?: string };

      if (!res.ok || !data.ok) {
        if (data.error === "RATE_LIMITED") {
          toast.error(d.rateLimited);
        } else if (data.error === "TURNSTILE_FAILED") {
          toast.error(d.turnstileFailed);
        } else {
          toast.error(d.serverError);
        }
        return;
      }

      setSubmitted(true);
      toast.success(d.successTitle);
    } catch {
      toast.error(d.serverError);
    } finally {
      setIsSubmitting(false);
    }
  }

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

  return (
    <>
      {/*
        Mounted here rather than in the root layout.

        `toast()` is only ever called by this form, but a global <Toaster>
        pulled the ~72 KB sonner chunk into the shared bundle for all 90
        pages. Rendering it alongside the only caller keeps the dependency on
        /contact, where it is actually reachable.

        `dir="auto"` keeps the RTL placement the layout used to set
        explicitly — sonner mirrors its own position from the document
        direction.
      */}
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label={d.name}
          htmlFor="rfq-name"
          required
          error={errors.name}
          describedBy="rfq-name-error"
        >
          <input
            id="rfq-name"
            name="name"
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
            placeholder={d.namePlaceholder}
            className={cn(inputClass, errors.name && errorInputClass)}
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "rfq-name-error" : undefined}
          />
        </Field>

        <Field
          label={d.company}
          htmlFor="rfq-company"
          required
          error={errors.company}
          describedBy="rfq-company-error"
        >
          <input
            id="rfq-company"
            name="company"
            value={form.company}
            onChange={(e) => set("company")(e.target.value)}
            placeholder={d.companyPlaceholder}
            className={cn(inputClass, errors.company && errorInputClass)}
            autoComplete="organization"
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={errors.company ? "rfq-company-error" : undefined}
          />
        </Field>

        <Field
          label={d.email}
          htmlFor="rfq-email"
          required
          error={errors.email}
          describedBy="rfq-email-error"
        >
          <input
            id="rfq-email"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => set("email")(e.target.value)}
            placeholder={d.emailPlaceholder}
            className={cn(inputClass, errors.email && errorInputClass)}
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
            value={form.phone}
            onChange={(e) => set("phone")(e.target.value)}
            placeholder={d.phonePlaceholder}
            className={inputClass}
            autoComplete="tel"
          />
        </Field>

        <Field
          label={d.country}
          htmlFor="rfq-country"
          required
          error={errors.country}
          describedBy="rfq-country-error"
        >
          <input
            id="rfq-country"
            name="country"
            value={form.country}
            onChange={(e) => set("country")(e.target.value)}
            placeholder={d.countryPlaceholder}
            className={cn(inputClass, errors.country && errorInputClass)}
            autoComplete="country-name"
            aria-invalid={errors.country ? true : undefined}
            aria-describedby={errors.country ? "rfq-country-error" : undefined}
          />
        </Field>

        <Field
          label={d.product}
          htmlFor="rfq-product"
          required
          error={errors.product}
          describedBy="rfq-product-error"
        >
          <select
            id="rfq-product"
            name="product"
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

        <Field
          label={d.quantity}
          htmlFor="rfq-quantity"
          required
          error={errors.quantity}
          describedBy="rfq-quantity-error"
        >
          <input
            id="rfq-quantity"
            name="quantity"
            value={form.quantity}
            onChange={(e) => set("quantity")(e.target.value)}
            placeholder={d.quantityPlaceholder}
            className={cn(inputClass, errors.quantity && errorInputClass)}
            aria-invalid={errors.quantity ? true : undefined}
            aria-describedby={errors.quantity ? "rfq-quantity-error" : undefined}
          />
        </Field>

        <Field
          label={d.destinationPort}
          htmlFor="rfq-port"
        >
          <input
            id="rfq-port"
            name="destinationPort"
            value={form.destinationPort}
            onChange={(e) => set("destinationPort")(e.target.value)}
            placeholder={d.destinationPortPlaceholder}
            className={inputClass}
          />
        </Field>

        <Field
          label={d.packaging}
          htmlFor="rfq-packaging"
        >
          <input
            id="rfq-packaging"
            name="packaging"
            value={form.packaging}
            onChange={(e) => set("packaging")(e.target.value)}
            placeholder={d.packagingPlaceholder}
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label={d.message}
        htmlFor="rfq-message"
        required
        error={errors.message}
        describedBy="rfq-message-error"
      >
        <textarea
          id="rfq-message"
          name="message"
          rows={4}
          value={form.message}
          onChange={(e) => set("message")(e.target.value)}
          placeholder={d.messagePlaceholder}
          className={cn(inputClass, errors.message && errorInputClass)}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "rfq-message-error" : undefined}
        />
      </Field>

      <TurnstileWidget siteKey={turnstileSiteKey} onTokenChange={handleTurnstileToken} />

      <p className="text-xs font-medium text-label">{d.note}</p>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? d.submitting : d.submit}
      </Button>
      </form>
    </>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { LIMITS, MESSAGE_MIN_LENGTH, RFQ_EMAIL_RE } from "@/lib/rfq/constants";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";

/**
 * RFQ form state + behaviour (Roadmap Task 6.2).
 *
 * Owns the schema/view-model, client validation, server-error mapping, the
 * Turnstile token lifecycle, submission status, and the transport call. The
 * `RfqForm` component is now purely presentational — it renders the fields from
 * the values/handlers this hook returns. Behaviour is unchanged from the
 * previous monolithic component (same validation, same fetch contract, same
 * retry/token-reset semantics).
 *
 * The validation contract shares one source of truth with the server: the
 * email regex (`RFQ_EMAIL_RE`) and the field limits (`LIMITS`,
 * `MESSAGE_MIN_LENGTH`). The server remains stricter (length caps, product
 * allowlist, control-character sanitization).
 */

export interface FormState {
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

export type FieldKey =
  | "name"
  | "company"
  | "email"
  | "country"
  | "product"
  | "quantity"
  | "message";

export type Errors = Partial<Record<FieldKey, string>>;

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

/** Validation + summary field order (honeypot/token excluded). */
export const FIELD_ORDER: FieldKey[] = [
  "name",
  "company",
  "email",
  "country",
  "product",
  "quantity",
  "message",
];

/** Maps a form field to its localized label key (for the error summary). */
export const FIELD_LABEL_KEY: Record<FieldKey, keyof Dictionary["rfq"]> = {
  name: "name",
  company: "company",
  email: "email",
  country: "country",
  product: "product",
  quantity: "quantity",
  message: "message",
};

/** Per-form idempotency key so a transient failure / duplicate click never
 *  produces more than one sales email (audit ARCH-M9). */
function createIdempotencyKey(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface UseRfqFormOptions {
  rfq: Dictionary["rfq"];
  turnstileConfigured: boolean;
}

export interface UseRfqForm {
  form: FormState;
  set: (key: keyof FormState) => (value: string) => void;
  errors: Errors;
  turnstileError: string | null;
  isSubmitting: boolean;
  submitted: boolean;
  resetSignal: number;
  handleTurnstileToken: (token: string) => void;
  handleTurnstileExpire: () => void;
  handleTurnstileError: () => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function useRfqForm({
  rfq: d,
  turnstileConfigured,
}: UseRfqFormOptions): UseRfqForm {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const idempotencyKeyRef = useRef<string>(createIdempotencyKey());

  const set = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleTurnstileToken = useCallback((token: string) => {
    setForm((prev) => ({ ...prev, turnstileToken: token }));
    if (token) setTurnstileError(null);
  }, []);
  const handleTurnstileExpire = useCallback(() => {
    setForm((prev) => ({ ...prev, turnstileToken: "" }));
    setTurnstileError(d.turnstileFailed);
  }, [d.turnstileFailed]);
  const handleTurnstileError = useCallback(() => {
    setForm((prev) => ({ ...prev, turnstileToken: "" }));
    setTurnstileError(d.turnstileFailed);
  }, [d.turnstileFailed]);

  function focusFirstError(next: Errors) {
    const first = FIELD_ORDER.find((field) => next[field]);
    if (first) {
      const el = document.getElementById(`rfq-${first}`);
      el?.focus();
    }
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!form.name.trim()) next.name = d.errorRequired;
    if (!form.company.trim()) next.company = d.errorRequired;
    if (!form.email.trim()) next.email = d.errorRequired;
    else if (!RFQ_EMAIL_RE.test(form.email)) next.email = d.errorEmail;
    if (!form.country.trim()) next.country = d.errorRequired;
    if (!form.product) next.product = d.errorProduct;
    if (!form.quantity.trim()) next.quantity = d.errorQuantity;
    if (form.message.trim().length < MESSAGE_MIN_LENGTH) next.message = d.errorMessage;
    return next;
  }

  /** Maps a server validation code to a field + localized message (UX-M3). */
  function applyServerError(code: string | undefined): Errors {
    switch (code) {
      case "EMAIL":
        return { email: d.errorEmail };
      case "QUANTITY":
        return { quantity: d.errorQuantity };
      case "MESSAGE":
        return { message: d.errorMessage };
      case "PRODUCT":
        return { product: d.errorProduct };
      default:
        return {};
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }

    // Prevent submission without a valid Turnstile token when configured (UX-M4).
    if (turnstileConfigured && !form.turnstileToken) {
      setTurnstileError(d.turnstileRequired);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/rfq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKeyRef.current,
        },
        body: JSON.stringify({ ...form }),
      });

      const data = (await res.json()) as { ok: boolean; error?: string };

      if (!res.ok || !data.ok) {
        // A failed attempt must not strand the buyer: reset the bot-check so a
        // fresh token can be obtained on retry (UX-M4).
        if (turnstileConfigured) setResetSignal((n) => n + 1);

        if (data.error === "RATE_LIMITED") {
          toast.error(d.rateLimited);
        } else if (data.error === "TURNSTILE_FAILED") {
          setTurnstileError(d.turnstileFailed);
        } else {
          const fieldErrors = applyServerError(data.error);
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            focusFirstError(fieldErrors);
          } else {
            toast.error(d.serverError);
          }
        }
        return;
      }

      setSubmitted(true);
      toast.success(d.successTitle);
    } catch {
      if (turnstileConfigured) setResetSignal((n) => n + 1);
      toast.error(d.serverError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
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
  };
}

/** Re-exported so RFQ view code imports limits from one place. */
export { LIMITS };

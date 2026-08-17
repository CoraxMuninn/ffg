import { LIMITS, MESSAGE_MIN_LENGTH } from "./constants";
import { isValidProductIdentifier, resolveProductLabel } from "./product-allowlist";
import type { RfqPayload } from "./types";

/**
 * Server-side validation and sanitization for RFQ submissions.
 *
 * Every incoming value is treated as untrusted. Validation returns a structured
 * result; on failure no email is sent. Messages are generic and do not leak
 * internal implementation details to the client.
 */

interface ValidationResult {
  valid: boolean;
  payload?: RfqPayload;
  /** Generic client-facing error (no internals). */
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function withinLimit(value: string, max: number): boolean {
  return value.length <= max;
}

export function validateRfqInput(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { valid: false, error: "INVALID_REQUEST" };
  }

  const data = input as Record<string, unknown>;

  const name = clean(data.name);
  const company = clean(data.company);
  const email = clean(data.email);
  const country = clean(data.country);
  const phone = clean(data.phone);
  const product = clean(data.product);
  const quantity = clean(data.quantity);
  const message = clean(data.message);
  const destinationPort = clean(data.destinationPort);
  const packaging = clean(data.packaging);

  // Required fields.
  if (!name) return { valid: false, error: "REQUIRED" };
  if (!company) return { valid: false, error: "REQUIRED" };
  if (!email || !EMAIL_RE.test(email)) return { valid: false, error: "EMAIL" };
  if (!country) return { valid: false, error: "REQUIRED" };
  if (!product) return { valid: false, error: "REQUIRED" };
  if (!quantity) return { valid: false, error: "QUANTITY" };
  if (message.length < MESSAGE_MIN_LENGTH) return { valid: false, error: "MESSAGE" };

  // Length limits.
  if (!withinLimit(name, LIMITS.name)) return { valid: false, error: "INVALID" };
  if (!withinLimit(company, LIMITS.company)) return { valid: false, error: "INVALID" };
  if (!withinLimit(email, LIMITS.email)) return { valid: false, error: "INVALID" };
  if (!withinLimit(country, LIMITS.country)) return { valid: false, error: "INVALID" };
  if (!withinLimit(phone, LIMITS.phone)) return { valid: false, error: "INVALID" };
  if (!withinLimit(product, LIMITS.product)) return { valid: false, error: "INVALID" };
  if (!withinLimit(quantity, LIMITS.quantity)) return { valid: false, error: "INVALID" };
  if (!withinLimit(message, LIMITS.message)) return { valid: false, error: "INVALID" };
  if (!withinLimit(destinationPort, LIMITS.destinationPort)) {
    return { valid: false, error: "INVALID" };
  }
  if (!withinLimit(packaging, LIMITS.packaging)) return { valid: false, error: "INVALID" };

  // Product must be an enabled CMS slug or a known localized title.
  if (!isValidProductIdentifier(product)) {
    return { valid: false, error: "PRODUCT" };
  }

  // Sanitize: strip all control characters, including CR/LF (which could enable
  // email header/CRLF injection), NUL bytes, and other injection-aiding bytes.
  const sanitize = (v: string) =>
    v.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

  const payload: RfqPayload = {
    name: sanitize(name),
    company: sanitize(company),
    email: sanitize(email),
    country: sanitize(country),
    phone: sanitize(phone),
    product: sanitize(resolveProductLabel(product)),
    quantity: sanitize(quantity),
    message: sanitize(message),
    destinationPort: sanitize(destinationPort),
    packaging: sanitize(packaging),
  };

  return { valid: true, payload };
}

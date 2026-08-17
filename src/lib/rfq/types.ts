/**
 * Shared RFQ types.
 *
 * Used by both the client form and the server API so the payload contract stays
 * in one place. `RfqPayload` is the validated, server-side form of the request.
 */

/** Raw values as submitted by the client form. */
export interface RfqFormData {
  name: string;
  company: string;
  email: string;
  country: string;
  phone: string;
  product: string;
  quantity: string;
  message: string;
  destinationPort: string;
  packaging: string;
  /** Honeypot — must remain empty for legitimate submissions. */
  website?: string;
  /** Cloudflare Turnstile token (optional when Turnstile is configured). */
  turnstileToken?: string;
}

/** Validated and normalized data passed to the email layer. */
export interface RfqPayload {
  name: string;
  company: string;
  email: string;
  country: string;
  phone: string;
  product: string;
  quantity: string;
  message: string;
  destinationPort: string;
  packaging: string;
}

/** Success/error shape returned by the API. */
export interface RfqApiResult {
  ok: boolean;
  error?: string;
}

import { Resend } from "resend";

import { RFQ } from "./constants";
import type { RfqPayload } from "./types";

/**
 * RFQ email construction and Resend delivery.
 *
 * The buyer's email is used only as `Reply-To`, never as the sender. The sender
 * is always the configured, verified `RFQ_FROM_EMAIL`. Server-only secrets are
 * never exposed to the client.
 *
 * Delivery is bounded by a timeout (audit ARCH-M9) so a slow/unavailable Resend
 * cannot hang the request, and the result is classified so the outbox can
 * decide retry-vs-give-up.
 */

export type DeliveryErrorCategory = "permanent" | "transient";

function renderField(label: string, value: string): string {
  if (!value) return "";
  const escaped = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:220px;vertical-align:top">${label}</td><td style="padding:6px 0;color:#0f172a;font-size:14px;vertical-align:top">${escaped}</td></tr>`;
}

export function buildRfqEmailHtml(payload: RfqPayload, submittedAt: string): string {
  const rows = [
    renderField("Contact name", payload.name),
    renderField("Company", payload.company),
    renderField("Business email", payload.email),
    renderField("Phone", payload.phone),
    renderField("Product", payload.product),
    renderField("Destination market", payload.country),
    renderField("Quantity", payload.quantity),
    renderField("Destination / Port", payload.destinationPort),
    renderField("Packaging / Specification", payload.packaging),
  ].join("");

  const message = payload.message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto">
    <div style="background:#0a1628;padding:24px 28px">
      <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold">New RFQ — Feiz Food Group</p>
    </div>
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;padding:28px">
      <p style="margin:0 0 18px;color:#334155;font-size:14px">A buyer has requested a quotation. Reply directly to this email to reach them.</p>
      <table style="border-collapse:collapse;width:100%">${rows}</table>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0">
        <p style="margin:0 0 6px;color:#0f172a;font-size:13px;font-weight:bold">Additional requirements</p>
        <p style="margin:0;color:#334155;font-size:14px;line-height:1.6">${message}</p>
      </div>
      <p style="margin:20px 0 0;color:#94a3b8;font-size:12px">Submitted: ${submittedAt}</p>
    </div>
  </div>`;
}

export function buildRfqEmailText(payload: RfqPayload, submittedAt: string): string {
  const lines = [
    "New RFQ — Feiz Food Group",
    "",
    `Contact name: ${payload.name}`,
    `Company: ${payload.company}`,
    `Business email: ${payload.email}`,
    payload.phone ? `Phone: ${payload.phone}` : null,
    `Product: ${payload.product}`,
    `Destination market: ${payload.country}`,
    `Quantity: ${payload.quantity}`,
    payload.destinationPort ? `Destination / Port: ${payload.destinationPort}` : null,
    payload.packaging ? `Packaging / Specification: ${payload.packaging}` : null,
    "",
    "Additional requirements:",
    payload.message,
    "",
    `Submitted: ${submittedAt}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
  return lines;
}

export interface SendRfqEmailResult {
  ok: boolean;
  /** Human-safe, generic error code (never internal details). */
  error?: string;
  /** Classification for the outbox retry policy. */
  category?: DeliveryErrorCategory;
}

/** Rejects after `ms`, labelling the outcome as a transient timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("SEND_TIMEOUT")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export async function sendRfqEmail(
  payload: RfqPayload,
  options: { idempotencyKey?: string } = {},
): Promise<SendRfqEmailResult> {
  const apiKey = RFQ.resendApiKey;
  const to = RFQ.toEmail;
  const from = RFQ.fromEmail;

  if (!apiKey || !to || !from) {
    // Missing Resend configuration is a deployment error an operator must fix,
    // not a transient hiccup — classify it permanent so the buyer is not left
    // in an endless retry loop.
    return { ok: false, error: "NOT_CONFIGURED", category: "permanent" };
  }

  const submittedAt = new Date().toISOString();

  try {
    const resend = new Resend(apiKey);
    const sendPromise = resend.emails.send(
      {
        from,
        to: [to],
        replyTo: [payload.email],
        // Defense in depth: strip any control characters from the subject so it
        // can never be used for email header injection, regardless of source.
        subject: `New RFQ from ${payload.company} — ${payload.product}`.replace(
          /[\u0000-\u001F\u007F-\u009F]/g,
          "",
        ),
        html: buildRfqEmailHtml(payload, submittedAt),
        text: buildRfqEmailText(payload, submittedAt),
      },
      // Resend-side dedup: a retried idempotency key produces one email even if
      // a previous attempt actually reached Resend before our timeout fired.
      options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined,
    );

    const { error } = await withTimeout(sendPromise, RFQ.sendTimeoutMs);

    if (error) {
      // Never forward the underlying Resend error to the client.
      return { ok: false, error: "SEND_FAILED", category: "transient" };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    // A bounded timeout is a transient transport problem, safe to retry.
    if (message === "SEND_TIMEOUT") {
      return { ok: false, error: "SEND_TIMEOUT", category: "transient" };
    }
    return { ok: false, error: "SEND_FAILED", category: "transient" };
  }
}

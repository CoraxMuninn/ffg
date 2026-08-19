import type { ReactNode } from "react";

/**
 * RFQ field wrapper (Roadmap Task 6.2).
 *
 * Extracted from the monolithic `RfqForm`: a labelled field with an associated
 * inline error (`role="alert"`). The id contract — `htmlFor`/`id` on the input
 * and `<field>-error` on the message — is what the validation summary jump
 * links and the aria-describedby wiring rely on, so it is preserved exactly.
 */
export interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  describedBy?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, required, error, describedBy, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-navy">
        {label}
        {required && <span className="ms-1 text-cyan-link">*</span>}
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

/** Shared text-input styling for every RFQ field. */
export const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-ink-soft focus:border-cyan-brand focus:outline-none focus:ring-2 focus:ring-cyan-brand/30";

/** Border/ring override applied alongside `inputClass` when a field is invalid. */
export const errorInputClass =
  "border-red-400 focus:border-red-400 focus:ring-red-400/30";

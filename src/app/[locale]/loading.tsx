/**
 * Segment loading UI. Server Component with no request APIs so SSG is preserved.
 * Copy is intentionally language-neutral (visual indicator + aria-busy).
 */
export default function Loading() {
  return (
    <section
      aria-live="polite"
      aria-busy="true"
      role="status"
      className="min-h-[70vh] flex flex-col items-center justify-center px-4"
    >
      <div className="flex items-center gap-2 mb-5" aria-hidden="true">
        <span className="w-3 h-3 rounded-full bg-cyan-brand animate-pulse" />
        <span
          className="w-3 h-3 rounded-full bg-cyan-brand/60 animate-pulse"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-3 h-3 rounded-full bg-cyan-brand/30 animate-pulse"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </section>
  );
}

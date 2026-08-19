interface Step {
  slug: string;
  title: string;
  description: string;
  icon: string;
}

interface StepGridProps {
  steps: Step[];
}

/**
 * Editorial checklist for quality-control checkpoints.
 *
 * A numbered rule list rather than a card grid — the page is a procedure,
 * so the type and order do the work. Icons stay in the CMS but are not
 * drawn here; they would add chrome without adding information.
 */
export function StepGrid({ steps }: StepGridProps) {
  if (steps.length === 0) return null;

  return (
    <ol className="divide-y divide-gray-200 border-y border-gray-200">
      {steps.map((step, index) => (
        <li
          key={step.slug}
          className="grid grid-cols-1 gap-2 py-7 sm:grid-cols-12 sm:items-start sm:gap-8 sm:py-8"
        >
          <span className="text-xs font-semibold tabular-nums text-cyan-link sm:col-span-1">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="font-bold text-navy sm:col-span-4">{step.title}</h3>
          <p className="text-sm leading-relaxed text-ink sm:col-span-7">
            {step.description}
          </p>
        </li>
      ))}
    </ol>
  );
}

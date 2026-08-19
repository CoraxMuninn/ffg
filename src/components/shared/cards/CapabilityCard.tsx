import type { Capability } from "@/lib/content";
import { Icon } from "@/components/shared/Icon";

interface CapabilityCardProps {
  capability: Capability;
}

/**
 * Compact capability cell. Not a link — hover is visual emphasis only
 * (lift, cyan edge, icon shift) and is disabled for touch / reduced motion.
 */
export function CapabilityCard({ capability }: CapabilityCardProps) {
  return (
    <article className="cap-card scroll-mt-24">
      <span className="cap-icon" aria-hidden>
        <Icon name={capability.icon} className="h-5 w-5" />
      </span>
      <div className="cap-copy">
        <h3 className="cap-card-title">{capability.title}</h3>
        {capability.description ? (
          <p className="cap-card-text">{capability.description}</p>
        ) : null}
      </div>
    </article>
  );
}

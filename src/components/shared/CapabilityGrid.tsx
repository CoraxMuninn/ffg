import { CapabilityCard } from "@/components/shared/cards/CapabilityCard";

import type { Capability } from "@/lib/content";

interface CapabilityGridProps {
  capabilities: Capability[];
}

/** Shared export-capability tray — homepage and any later reuse. */
export function CapabilityGrid({ capabilities }: CapabilityGridProps) {
  return (
    <ul className="trust-tray trust-tray--light cap-tray">
      {capabilities.map((capability) => (
        <li key={capability.slug}>
          <CapabilityCard capability={capability} />
        </li>
      ))}
    </ul>
  );
}

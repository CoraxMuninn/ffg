import type { Capability } from "@/lib/content";
import { Icon } from "@/components/shared/Icon";

interface CapabilityCardProps {
  capability: Capability;
}

export function CapabilityCard({ capability }: CapabilityCardProps) {
  return (
    <div className="group  p-6 scroll-mt-24 overflow-hidden rounded-3xl border bg-white  transition-all duration-300 hover:-translate-y-0.5 border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:border-cyan-brand/40 hover:shadow-card-hover">
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-brand/10 transition-colors  group-hover:border-navy group-hover:bg-navy
                      group-hover:shadow-[0_14px_30px_-10px_rgba(8,145,178,0.55)] "
      >
        <Icon
          name={capability.icon}
          className="h-6 w-6 text-cyan-brand group-hover:text-cyan-light"
        />
      </div>
      <h3 className="mb-2 text-lg font-bold text-navy">{capability.title}</h3>
      <p className="text-sm leading-relaxed text-silver">
        {capability.description}
      </p>
    </div>
  );
}

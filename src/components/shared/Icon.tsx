import { createElement } from "react";

import { getIcon } from "@/lib/content";

interface IconProps {
  name: string;
  className?: string;
}

/**
 * Renders a Lucide icon by its CMS registry key.
 *
 * Uses `createElement` so the icon reference is not treated as a component
 * created during render (which would reset state and trip static-component
 * linting). Keys are resolved through the safe, explicit icon registry.
 */
export function Icon({ name, className }: IconProps) {
  return createElement(getIcon(name), { className });
}

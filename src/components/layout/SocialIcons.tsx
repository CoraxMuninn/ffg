import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

/** Lucide-weight brand marks so the footer stays on the existing icon system. */
export function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TelegramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M21 4.5 3.6 11.2c-.8.3-.8 1.5.1 1.8l4.4 1.4 1.7 5.1c.3.8 1.3 1 1.9.4l2.4-2.4 4.6 3.4c.7.5 1.7.1 1.9-.7L22 5.4c.2-.9-.7-1.6-1.5-1.2z" />
      <path d="m9.9 14.3 8.4-7.2" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M7.2 19.3 5 20.8a.7.7 0 0 1-1-.8l.8-3A8.8 8.8 0 1 1 12 20.8a8.7 8.7 0 0 1-4.8-1.5z" />
      <path d="M9.2 9.4c.2-.5.3-.5.6-.5h.5c.2 0 .4.1.5.4l.7 1.7c.1.2 0 .5-.2.6l-.5.5a7 7 0 0 0 3.2 3.2l.5-.5c.2-.2.4-.3.6-.2l1.7.7c.3.1.4.3.4.5v.5c0 .3 0 .4-.5.6a4.4 4.4 0 0 1-5.3-1.2 8 8 0 0 1-2.2-4.6z" />
    </svg>
  );
}

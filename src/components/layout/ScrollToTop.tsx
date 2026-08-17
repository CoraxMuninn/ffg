"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";

interface ScrollToTopProps {
  label: string;
}

const SHOW_AFTER_PX = 420;

/**
 * Compact “back to top” control.
 *
 * Desktop + tablet only (`md+`). Hidden on mobile. Appears after a meaningful
 * scroll using opacity/transform so the entrance stays on the compositor.
 * Uses the browser’s native smooth scroll — `html { scroll-behavior }` already
 * respects `prefers-reduced-motion` in globals.css.
 */
export function ScrollToTop({ label }: ScrollToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={label}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={cn(
        "scroll-to-top hidden md:inline-flex",
        visible && "is-visible",
      )}
    >
      <ArrowUp className="h-4 w-4" aria-hidden />
    </button>
  );
}

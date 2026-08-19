"use client";

import { useEffect, useState } from "react";

/**
 * `isScrolled` — true once the window passes `threshold` px (Roadmap 6.1).
 *
 * Extracted from the Header so the scroll affordance is one focused hook: a
 * requestAnimationFrame-throttled scroll listener that flips a single boolean.
 * The Header consumes it to toggle the glass treatment.
 */
export function useScrolled(threshold = 50): boolean {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setIsScrolled(window.scrollY > threshold);
    };
    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return isScrolled;
}

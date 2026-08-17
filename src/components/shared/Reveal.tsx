"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type RevealDirection = "up" | "start" | "end";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Entrance offset direction. "start"/"end" are RTL-aware (logical). */
  from?: RevealDirection;
  /** Stagger delay in ms, applied only to the transition. */
  delay?: number;
}

/**
 * Minimal viewport-entrance wrapper.
 *
 * Deliberately implemented with a single IntersectionObserver + CSS transition
 * instead of an animation library: the project has neither Framer Motion nor
 * GSAP installed, and this effect (fade + small translate, once) does not
 * justify shipping a ~50 kB runtime to every visitor.
 *
 * The observer disconnects after the first intersection, so there is no
 * ongoing scroll work. Reduced-motion users skip the transform entirely.
 */
export function Reveal({ children, className, from = "up", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion is handled entirely in CSS (see globals.css), which forces
    // the revealed state, so no motion-preference branch is needed here.
    // Elements already in view fire on the observer's first callback.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal={shown ? "shown" : "hidden"}
      data-reveal-from={from}
      className={cn("reveal", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

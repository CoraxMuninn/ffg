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
 * Minimal viewport-entrance wrapper (Roadmap Task 7.6 / PERF-L4).
 *
 * Two things changed from the per-instance version:
 *
 *  - **One shared IntersectionObserver** for every Reveal instance, instead of
 *    one observer per element. The observer is created lazily on first use and
 *    reused; each instance registers a callback and unobserves after firing, so
 *    there is no ongoing scroll work.
 *  - **Progressive enhancement**: content is visible by default and only hidden
 *    for the entrance animation when JS is active (see the `@media (scripting:
 *    enabled)` rules in globals.css). Without JS the children are never hidden.
 *
 * Reduced motion is handled entirely in CSS, which forces the shown state.
 * No animation library is shipped: the effect (fade + small translate, once)
 * does not justify one.
 */

type RevealCallback = () => void;
const callbacks = new Map<Element, RevealCallback>();

let sharedObserver: IntersectionObserver | null = null;
function getObserver(): IntersectionObserver {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const cb = callbacks.get(entry.target);
        if (cb) {
          // Fire once, then stop watching this element.
          callbacks.delete(entry.target);
          sharedObserver?.unobserve(entry.target);
          cb();
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );
  return sharedObserver;
}

export function Reveal({ children, className, from = "up", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = getObserver();
    callbacks.set(el, () => setShown(true));
    observer.observe(el);
    return () => {
      callbacks.delete(el);
      observer.unobserve(el);
    };
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

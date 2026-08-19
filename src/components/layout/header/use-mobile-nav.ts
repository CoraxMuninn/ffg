"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Mobile navigation modal state + behaviour (Roadmap Task 6.1, audit UX-M2).
 *
 * Owns the open/close state and the four behaviours that make the overlay a
 * real modal dialog, so the Header no longer interleaves them with rendering:
 *
 *  - body scroll lock while open;
 *  - auto-close when the viewport grows to the desktop (`lg`) breakpoint;
 *  - focus restoration to the hamburger toggle after a close;
 *  - a focus trap: on open, focus moves to the first overlay control; Tab/Shift+Tab
 *    cycle within the overlay and can never reach the concealed page content.
 *
 * The focus move is retried each animation frame until the first focusable is
 * `visibility: visible`: the sheet opens via a visibility transition, and rAF
 * callbacks observe the prior frame's computed style, so the very first frame
 * after open is still `hidden` and `.focus()` would no-op. Under
 * prefers-reduced-motion the value is visible immediately, so the first attempt
 * focuses. The pending frame is cancelled on close.
 */
export interface MobileNav {
  isOpen: boolean;
  setOpen: (next: boolean | ((prev: boolean) => boolean)) => void;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function visibleFocusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => {
      // Skip truly hidden elements without relying on offsetParent, which is
      // null for descendants of a position:fixed container (this overlay).
      const rects = el.getClientRects();
      return rects.length > 0 && rects[0]!.width > 0 && rects[0]!.height > 0;
    },
  );
}

export function useMobileNav(): MobileNav {
  const [isOpen, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // Lock body scroll while the overlay is open.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Desktop nav takes over at `lg`; drop the overlay if the viewport grows.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Restore focus to the toggle after a close so keyboard users are not stranded.
  useEffect(() => {
    if (wasOpen.current && !isOpen) {
      menuButtonRef.current?.focus();
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  // Focus trap: move focus in on open and cycle Tab within the overlay.
  useEffect(() => {
    if (!isOpen) return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    let rafId = 0;
    const focusFirst = () => {
      const first = visibleFocusables(overlay)[0];
      if (!first) return;
      if (getComputedStyle(first).visibility === "visible") {
        first.focus();
        return;
      }
      rafId = requestAnimationFrame(focusFirst);
    };
    rafId = requestAnimationFrame(focusFirst);

    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const list = visibleFocusables(overlay);
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    overlay.addEventListener("keydown", handleKey);
    return () => {
      cancelAnimationFrame(rafId);
      overlay.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  return { isOpen, setOpen, overlayRef, menuButtonRef };
}

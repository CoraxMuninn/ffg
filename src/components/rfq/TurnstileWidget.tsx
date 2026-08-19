"use client";

import { useEffect, useRef } from "react";

interface TurnstileWidgetProps {
  /** Public Turnstile site key, passed from a Server Component. */
  siteKey?: string;
  /**
   * Fixed action verified server-side (audit SEC-M5). Bound to the widget so
   * the token the broker receives names the same action it checks.
   */
  action?: string;
  onTokenChange: (token: string) => void;
  /** Called when a valid token expires (audit UX-M4). */
  onExpire?: () => void;
  /** Called when the widget errors (audit UX-M4). */
  onError?: () => void;
  /**
   * Bump this counter to force a token reset after an unsuccessful submission so
   * the buyer is not stranded by a consumed/failed token (audit UX-M4).
   */
  resetSignal?: number;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          action?: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string | undefined;
      reset?: (widgetId?: string) => void;
    };
  }
}

/**
 * Renders a Cloudflare Turnstile challenge when a site key is provided.
 *
 * The public site key is passed in from a Server Component, so this Client
 * Component never imports the server-side RFQ config (which holds server-only
 * secrets). If no site key is present (development), renders nothing. The token
 * is passed up via `onTokenChange` and verified server-side by the RFQ API,
 * which additionally checks the bound `action` and an approved hostname set.
 *
 * Recovery (UX-M4): the parent bumps `resetSignal` after a failed submission;
 * the widget resets so the buyer can re-verify without a page refresh. Expired
 * or errored tokens surface via `onExpire`/`onError`.
 */
export function TurnstileWidget({
  siteKey,
  action,
  onTokenChange,
  onExpire,
  onError,
  resetSignal = 0,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) return;

    const render = () => {
      if (!window.turnstile || !containerRef.current) return;
      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        ...(action ? { action } : {}),
        callback: onTokenChange,
        "expired-callback": onExpire,
        "error-callback": onError,
      });
      widgetIdRef.current = id ?? null;
    };

    if (!window.turnstile) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
    } else {
      render();
    }

    return () => {
      if (widgetIdRef.current && window.turnstile?.reset) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          /* noop */
        }
      }
    };
  }, [siteKey, action, onTokenChange, onExpire, onError]);

  // Reset the token when the parent signals a retry (after a failed submit).
  useEffect(() => {
    if (resetSignal <= 0 || !widgetIdRef.current) return;
    try {
      window.turnstile?.reset?.(widgetIdRef.current);
    } catch {
      /* noop */
    }
  }, [resetSignal]);

  if (!siteKey) return null;

  return <div ref={containerRef} />;
}

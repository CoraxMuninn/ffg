"use client";

import { useEffect, useRef } from "react";

interface TurnstileWidgetProps {
  /** Public Turnstile site key, passed from a Server Component. */
  siteKey?: string;
  onTokenChange: (token: string) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
        }
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
 * is passed up via `onTokenChange` and verified server-side by the RFQ API.
 */
export function TurnstileWidget({ siteKey, onTokenChange }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) return;

    const render = () => {
      if (!window.turnstile || !containerRef.current) return;
      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onTokenChange,
        "expired-callback": () => onTokenChange(""),
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
  }, [siteKey, onTokenChange]);

  if (!siteKey) return null;

  return <div ref={containerRef} />;
}

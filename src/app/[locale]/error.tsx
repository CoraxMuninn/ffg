"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { statusStrings } from "@/lib/i18n/dictionaries/status";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const params = useParams<{ locale: string }>();
  const locale: Locale = isLocale(params?.locale) ? params.locale : defaultLocale;
  const t = statusStrings[locale].error;

  useEffect(() => {
    // Log the error only in development (audit SEC-L2): production must not
    // push stack traces to the browser console. Controlled production
    // telemetry, if ever added, would route through a server endpoint rather
    // than window.console.
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-navy overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-cyan-brand/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-cyan-brand" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          {t.title}
        </h1>

        <p className="text-silver text-base sm:text-lg leading-relaxed mb-10 max-w-md mx-auto">
          {t.message}
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" type="button" onClick={reset}>
            <RefreshCw className="h-5 w-5" />
            {t.retry}
          </Button>
          <Button asChild size="lg" variant="outline-inverse">
            <Link href={`/${locale}`}>
              <Home className="h-5 w-5" />
              {t.home}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

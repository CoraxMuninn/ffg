import { NextResponse } from "next/server";

import { validateEnv } from "@/lib/config/env";

/**
 * Health check endpoint (audit SEC-M6 / ARCH-M5, Roadmap Task 3.1).
 *
 * Used by the reverse proxy (Nginx `proxy_pass` health), the systemd service
 * readiness check, and external monitoring. It runs the full environment
 * contract validation and returns 200 when healthy, 503 when one or more
 * production requirements are unmet — so a misconfigured deploy fails the
 * health/deploy gate. It never returns secret values, only structured problems.
 *
 *   GET /api/health → 200 { status: "ok", environment }
 *                   → 503 { status: "degraded", environment, problems: [...] }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const report = validateEnv();

  if (report.ok) {
    return NextResponse.json(
      { status: "ok", environment: report.environment },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      status: "degraded",
      environment: report.environment,
      // problems carry only var names and generic messages — never secret values.
      problems: report.problems,
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

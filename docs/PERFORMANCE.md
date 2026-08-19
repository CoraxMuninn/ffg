# Performance budgets & monitoring (Roadmap Task 7.7 / PERF-L5)

This document records the project's performance budgets and the **decision
gate** that gates real-user monitoring. It exists so performance is monitored
against defined limits rather than inferred from a one-time audit.

## In-repo budgets (enforced)

### Bundle budget — `scripts/check-bundle-budget.mjs` + `perf-budget.json`

A dependency-free guard run after `next build` (CI `quality` job, and locally
via `npm run perf:budget`). It sums the shared client payload in
`.next/static/chunks and fails when the **client JS** or **client CSS** exceeds
the calibrated limit. Limits are set to the post-Phase-7 baseline plus headroom,
so ordinary work passes and a real regression (a new dependency, an accidental
client boundary, a duplicated bundle) fails the gate. Raise the limit in
`perf-budget.json` only when growth is intentional and reviewed.

### Lighthouse budget — `lighthouse-budget.json`

Resource-size, resource-count, and Core Web Vital thresholds (script, stylesheet,
font, image, total; LCP / CLS / INP-proxy). Apply it per representative route
(`/en`, `/fa`) with Lighthouse CI when that runner is wired into the deploy
pipeline. Font budget of 360 KiB reflects ONE variable font per locale (Task 7.1
eliminated the 463 KiB dual-font preload); EN/RU/VI load Inter, FA loads
Vazirmatn.

## Budget baseline

Budgets assume one variable font per locale (Inter for EN/RU/VI, Vazirmatn
for FA), statically prerendered `/contact` routes, and long-lived
`Cache-Control` on `/media/*`.

## Decision gate — real-user monitoring (RUM)

**Status: deferred — pending operator approval.**

Field Web-Vitals monitoring (RUM) is **not** implemented. Per the privacy
policy, collecting field data requires:

1. A **privacy-reviewed endpoint/provider** (self-hosted or a named vendor) and
2. a documented **retention policy**, and
3. an update to the **Privacy Policy** describing what is collected, and
4. explicit **operator sign-off**.

Until those are in place, performance is guarded by the in-repo budgets above
and lab measurement (Lighthouse against `lighthouse-budget.json`). Do not add a
RUM script, beacon, or third-party analytics tag without completing the gate.

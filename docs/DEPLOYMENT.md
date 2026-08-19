# Deployment Guide — Feiz Food Group

**Authoritative production topology (Roadmap Task 3.1 decision):**
**single Node process behind Nginx, supervised by systemd**, on one VPS.

This matches the project's existing security controls, which were written for
this topology:

- The RFQ rate limiter is process-local (`rate-limit.ts`) — correct for one
  instance; it would NOT be shared across multiple instances.
- `TRUST_PROXY=true` trusts `X-Real-IP`/`X-Forwarded-For`, which Nginx
  overwrites — the only reason forwarded headers can be trusted.
- The GitHub OAuth broker (`/api/auth`, `/api/callback`) is self-hosted, so no
  third-party broker is in the path.

> **Out of scope here:** this document and the `deploy/` configs codify the
> topology. Performing an actual deployment (provisioning a server, issuing
> certs, running the service) is an operational step, not a code change.

---

## 1. Prerequisites

| Requirement | Version |
|---|---|
| Node.js | **≥ 20.18** (declared in `package.json` `engines`, `.nvmrc` = `20`) |
| npm | **≥ 10** |
| OS | A modern Linux VPS (Debian/Ubuntu) |
| Reverse proxy | Nginx |
| Process supervisor | systemd |
| TLS | Let's Encrypt (or equivalent) |
| Email provider | Resend (verified sender domain) |
| Bot protection | Cloudflare Turnstile (site key + secret) |

## 2. Configuration contract

All runtime configuration is environment variables. See **`.env.example`** for
the full list with required/optional/exposure annotations.

- **Paired keys** (OAuth, Resend, Turnstile) must be all-set or all-unset; the
  app validates this at `/api/health` and fails the health gate otherwise.
- **Production requires HTTPS** for all non-loopback configured origins
  (`SITE_URL`, `OAUTH_ALLOWED_ORIGINS`, `RFQ_ALLOWED_ORIGINS`).
- **`TRUST_PROXY=true`** is required behind Nginx for per-client rate limiting.
- **No secret is browser-exposed**: only `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and
  `NEXT_PUBLIC_TURNSTILE_ACTION` reach the bundle; everything else is
  server-only. The health check rejects any `NEXT_PUBLIC_<SECRET>` leak.

`/api/health` runs the validator: `200` when healthy, `503` (with structured,
non-secret problems) otherwise. Wire it into your deploy gate and uptime
monitor.

## 3. Build & release layout

Releases are versioned, immutable directories under `/opt/feiz-food`:

```
/opt/feiz-food/
  current → releases/<timestamp>   # symlink to the active release
  releases/
    20260818-1200/
    20260817-0900/
  shared/
    .data/                         # RFQ outbox (persists across releases)
```

Build on a CI/CI-like runner or the host, then ship the self-contained output:

```bash
npm ci
npm run build                       # type-checks + prebuild (Decap integrity)
# ship: package.json, package-lock.json, node_modules, .next, public, deploy/
```

## 4. Running the service

Secrets live in `/etc/feiz-food/env` (mode `0600`, owned by the service user),
provided to the app via systemd `EnvironmentFile` — never committed.

```bash
sudo cp deploy/feiz-food.service /etc/systemd/system/
sudo mkdir -p /etc/feiz-food && sudoedit /etc/feiz-food/env   # from .env.example
sudo systemctl daemon-reload
sudo systemctl enable --now feiz-food
```

The unit runs `next start --port 3000 --hostname 127.0.0.1` and is hardened
(`NoNewPrivileges`, `ProtectSystem=strict`, `ReadWritePaths` limited to `.data`).

## 5. Reverse proxy

```bash
sudo cp deploy/nginx.example.conf /etc/nginx/sites-available/feiz-food
sudo ln -s /etc/nginx/sites-available/feiz-food /etc/nginx/sites-enabled/
# edit server_name + cert paths, then:
sudo nginx -t && sudo systemctl reload nginx
```

Nginx terminates TLS and **always sets** `X-Real-IP` / `X-Forwarded-Proto`
(never trusts them raw from a client), bounds the body (`client_max_body_size
100k`), and applies a coarse edge rate limit in front of the app's own limiter.

## 6. RFQ delivery reliability (audit ARCH-M9)

Qualified buyer enquiries are never lost or duplicated by a transient failure:

- Each submission carries a client-generated **idempotency key**.
- A durable **outbox** (`.data/rfq-outbox.json`) records the state. A duplicate
  request for an already-delivered key returns the cached result with **no
  second email**. A transient Resend/network failure leaves the entry `pending`
  and the buyer sees `202 Accepted`.
- Retries run **lazily on incoming traffic** and on a **schedule** via the
  internal endpoint:

  ```bash
  curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" \
    https://feizfood.com/api/cron/rfq-retry
  ```

  Drive it with a systemd timer (every few minutes). After `OUTBOX_MAX_ATTEMPTS`
  a permanent failure raises an operator-visible event (and optionally
  `OPERATOR_ALERT_WEBHOOK`).

- **Privacy**: the outbox holds buyer payload **only while delivery is pending**
  and wipes it the moment delivery succeeds. Operational events are non-PII
  (idempotency key + status only). Retention (`OUTBOX_RETENTION_MS`, default
  30d) prunes settled entries. **The privacy notice should disclose that enquiry
  data is transiently stored for reliable delivery and processed by Resend.**

## 7. Rollback

```bash
sudo systemctl stop feiz-food
sudo ln -sfn /opt/feiz-food/releases/<previous> /opt/feiz-food/current
sudo systemctl start feiz-food
curl -fsS https://feizfood.com/api/health   # verify
```

The shared `.data` outbox persists across rollbacks, so in-flight deliveries are
not lost.

## 8. Updating

1. Build the new release into `releases/<new-timestamp>`.
2. Repoint the `current` symlink.
3. `sudo systemctl restart feiz-food`.
4. `curl /api/health` until it returns `200`.

## 9. Verification checklist (non-deployment)

These are runnable without deploying and are covered by CI/tests:

- [x] `npm run build` succeeds (incl. `prebuild` Decap integrity check).
- [x] `npm run test` — config validation, rate-limit, Turnstile, outbox suites.
- [x] `validateEnv()` fails on missing/mismatched production vars, non-HTTPS
      origins, and `NEXT_PUBLIC_<SECRET>` leaks; passes a clean production
      fixture.
- [x] Fresh clean install (`npm ci`) succeeds.

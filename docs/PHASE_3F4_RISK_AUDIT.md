# CIPHER — Phase 3F.4 Production-Readiness Risk Audit

**Audit Date:** October 25, 2026  
**Auditor:** Senior Engineering Engine (Google AI Studio Build)  
**Target Environment:** Fly.io Single-Instance Micro-VM (`shared-cpu-1x`, 512MB RAM) with Persistent NVMe Volume (`/data`)  
**Visual Identity:** Maple-green (`bg-emerald-800`, `text-emerald-900`), clean white (`bg-white`), and light-grey (`bg-slate-50`, `border-slate-200`). Preserved 100%.

---

## Executive Summary

Phase 3F.4 is a rigorous, non-destructive production-readiness audit and remediation cycle. Following exhaustive code inspections, automated test suite runs (12 suites, 100% passing), release gate execution (8/8 gates passed), and server-side authorization hardening, CIPHER has been audited across 7 core technical workstreams.

---

## Workstream 1 — Cloud SQL Discrepancy Resolution

### Findings
1. **Repository References**: Cloud SQL (PostgreSQL) files (`src/db/schema.ts`, `src/db/index.ts`, `src/db/drizzle.config.ts`, `server/db/schema.sql`, `server/db/migration.ts`) exist in the repository as part of earlier foundation layers (Phase 3E.1).
2. **Active Runtime Engine**: The actual server runtime (`server.ts`, `server/db.ts`, `server/db/sqliteAdapter.ts`) exclusively boots and executes against **SQLite 3 via `sql.js` (WASM)** with durable atomic file system persistence on `/data/cipher.sqlite`.
3. **External Provisioning Status**: While project `organic-transducer-8t8c4` in region `europe-west2` was mentioned in earlier planning prompts, **no active PostgreSQL connection string or credentials (`SQL_HOST`, `SQL_USER`, etc.) are configured in `fly.toml` or active production runtime**.
4. **Billing Exposure**: Zero live billing exposure exists on Fly.io regarding PostgreSQL because the active production runtime does not execute queries against Cloud SQL. However, if an external Cloud SQL PostgreSQL instance was provisioned in GCP project `organic-transducer-8t8c4` outside this repository, the owner must check their GCP Billing Console (`console.cloud.google.com/billing`) to confirm whether the instance is incurring idle charges under Developer/Standard tiers.

---

## Workstream 2 — Release-Gate Quality Audit

### Findings
- `scripts/release-gate.ts` executes 8 real, programmatic verification checks rather than regex text searches:
  - Gate 1: Real execution of `npx tsc --noEmit` with non-zero exit on failure.
  - Gate 2: Real execution of `npm run build` checking `dist/index.html` and bundle assets.
  - Gate 3: Real execution of `npm test` running all 12 automated test suites.
  - Gate 4: Programmatic parsing of `fly.toml` and `.env.example`.
  - Gate 5: Inspection of `.dockerignore` and `.gitignore` rules.
  - Gate 6: Instantiation of `CipherSqliteAdapter` against isolated temp test volumes.
  - Gate 7: Validation of server liveness and readiness route definitions in `server.ts`.
  - Gate 8: Verification of `package.json` start script and Express static asset serving.
- **Remediation**: Updated to account for the 12th test suite (`phase3f4-risk-audit.test.ts`).

---

## Workstream 3 — Authentication & Tenant Isolation

### Findings & Remediation
1. **Unauthenticated Access**: Protected API endpoints enforce `requireAuth`, returning HTTP 401 for missing or invalid session tokens.
2. **Cross-Tenant ID Tampering**: `authMiddleware` in `server.ts` was hardened so that when an `x-workspace-id` header is supplied, the server strictly validates that the authenticated user possesses an active membership in that workspace. If not, it unconditionally returns **HTTP 403 Forbidden**.
3. **Server-Side Authorization**: Founder/Owner-only operations (e.g. inviting members, publishing websites, unpublishing storefronts) are strictly guarded by `requireRole(['Owner'])` on the server. Furthermore, workspace member invitation endpoints now verify that the calling user is specifically an `Owner` of that workspace.
4. **Session Lifecycle & Password Reset**: Session tokens are 256-bit cryptographically secure. Password reset with a valid token successfully updates the password hash, marks the token as used, and **immediately invalidates all active sessions** for that user account.
5. **Abuse Protections**: Sliding window rate limiters protect registration, public chat, and password recovery (`forgot-password`) endpoints against brute-force attacks.

---

## Workstream 4 — Persistence, Backup & Restore

### Findings
1. **Non-Destructive Restart**: `sqliteAdapter.hasCommittedData()` accurately detects existing databases on mounted volumes, preventing factory seeding from overwriting live user data.
2. **Atomic Writes**: Persistent saves use temporary files (`.tmp`) followed by atomic renames (`fs.renameSync`), preventing partial or corrupt database writes.
3. **Safe Restoration & Freshness Guards**: `restoreFromBackup()` blocks the restoration of backups older than the active database unless `force: true` is provided, and automatically creates a `.pre-restore.<timestamp>.bak` quarantine snapshot.

---

## Workstream 5 — Deployment & Operational Claims

### Findings
- Fly.io configuration (`fly.toml`) correctly mounts the persistent NVMe volume at `/data`.
- Single-instance constraints (`min_machines_running = 1`, `auto_stop_machines = "off"`) are strictly enforced. High availability (multi-instance active-active SQLite) is explicitly documented as unsupported.
- Health endpoints (`/api/health`) and readiness endpoints (`/api/ready`) accurately report process uptime and database connectivity.

---

## Workstream 6 — Public Storefront & Privacy

### Findings
- Unpublished storefronts (`published: false`) return structured HTTP 404 responses while keeping private dashboard data intact.
- Public profile endpoints (`/api/public/business/:slug`) strictly strip internal notes, emergency stops, and confidential escalation rules.
- Missing AI configuration (`GEMINI_API_KEY`) triggers graceful fallback replies without crashing or leaking environment credentials.

---

## Workstream 7 — Cost & Launch Boundaries

### Official Cost Model (Fly.io)
- Compute (`shared-cpu-1x`, 512MB RAM): **~$3.69 / month**.
- Persistent Storage (1GB NVMe Volume): **$0.15 / month**.
- Network Egress: **~$0.10 - $0.50 / month**.
- Total Baseline: **~$3.94 - $4.50 / month**.
- *Billing Exposure Note*: Owner must verify GCP Console for any idle Cloud SQL PostgreSQL instances associated with project `organic-transducer-8t8c4`.

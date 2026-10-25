# CIPHER Release Checklist, Cost Model & Smoke-Test Plan
**Phase 3F.3: Pre-Launch Verification & Operational Governance**  
*Host: Fly.io | Runtime: Node.js 22 + tsx | Database: SQLite 3 on Persistent Volume (`/data`)*

---

## Part 1: Hosting Cost & Operational Constraints

All cost estimates are grounded in official documentation and verified pricing structures. **CIPHER does not promise zero-cost hosting or provide a fictitious guaranteed flat monthly total.**

### 1. Fly.io Official Hosting Costs (Verified)
*Official Pricing Documentation: https://fly.io/docs/about/pricing/*

| Cost Category | Specification | Unit Price | Estimated Baseline / Month |
| :--- | :--- | :--- | :--- |
| **Compute (Micro-VM)** | `shared-cpu-1x`, 512MB RAM | ~$0.0000014/sec (~$0.0050/hr) | **~$3.69 / month** |
| **Persistent NVMe Storage** | 1 GB attached NVMe volume (`/data`) | $0.15 / GB / month | **$0.15 / month** |
| **Outbound Data Transfer (Egress)** | Inbound free; egress to North America / Europe | $0.02 / GB | **~$0.10 - $0.50 / month** (traffic dependent) |
| **Public Anycast IP Routing** | Shared IPv4 + dedicated IPv6 | Included (free) | **$0.00 / month** |
| **Dedicated IPv4 (Optional)** | Required only if legacy networks require dedicated IPv4 | $2.00 / month | **$0.00** (using free shared IPv4) |
| **Baseline Infrastructure Total** | 1 VM (512MB) + 1GB NVMe Volume + Egress | — | **~$3.94 - $4.50 / month** |

*Note: Fly.io requires a valid payment method on file to deploy and provisions resources under paid usage tiers.*

### 2. External Provider & Feature Dependencies
| Feature Area | External Service | Pricing Model | Degradation Behavior if Inactive |
| :--- | :--- | :--- | :--- |
| **AI Assistant & Copy Drafts** | Google Gemini API (`@google/genai`) | Pay-per-token (e.g. Gemini 2.5 Flash input/output rates) | **Resilient Fallback Mode**: Gracefully emits deterministic fallback greeting and flags requests for human review. Does not crash. |
| **Custom Business Domains** | DNS Registrar (e.g., Cloudflare, Namecheap) | Annual domain fee ($10 - $20/yr) | Optional. Free `*.fly.dev` subdomain provided by default. |
| **Email Notifications** | Transactional SMTP/API (Resend, SendGrid) | Free tier / pay-per-email | Currently simulated in-memory/audit log; no live charges incurred. |
| **Relational Scaling (Optional)** | Google Cloud SQL (PostgreSQL) | Scale-to-zero Developer instance | Provisioned for project `organic-transducer-8t8c4`; currently idle. |

---

## Part 2: Release Checklist

### Phase A: Automated Pre-Deployment Verification (Executed in Local CI)
*All items below have been executed and verified in the automated repository test pipeline:*

- [x] **TypeScript Compilation (`tsc --noEmit`)**: 0 type errors across all server and client files.
- [x] **Production Bundle Build (`npm run build`)**: Vite bundled `dist/index.html` and assets cleanly.
- [x] **Automated Test Suite (11 suites, 0 failures)**:
  - [x] `tests/persistence.test.ts`
  - [x] `tests/api-persistence.test.ts`
  - [x] `tests/auth-multitenant.test.ts`
  - [x] `tests/lifecycle-e2e.test.ts`
  - [x] `tests/security-readiness-audit.test.ts`
  - [x] `tests/db-foundation.test.ts`
  - [x] `tests/sqlite-adapter.test.ts`
  - [x] `tests/phase3e3-reliability.test.ts`
  - [x] `tests/phase3f1-deployment.test.ts`
  - [x] `tests/phase3f2-audit-recovery.test.ts`
  - [x] `tests/overview-tab-reliability.test.ts`
- [x] **Release Gate Pipeline (`npm run release-gate`)**: All 8 release gates passed cleanly.
- [x] **Dedicated Volume Mount Configuration (`fly.toml`)**: `destination = "/data"` declared.
- [x] **Single-Instance Constraint (`fly.toml`)**: `min_machines_running = 1`, `auto_stop_machines = "off"`.
- [x] **VM Memory Sizing (`fly.toml`)**: `memory = "512mb"` with V8 max heap `384mb`.
- [x] **Liveness & Readiness Health Checks (`fly.toml`)**: Configured for `/api/health` and `/api/ready`.
- [x] **Container Exclusions (`.dockerignore` & `.gitignore`)**: `.env*`, `*.sqlite*`, `server/cipher_db.json`, `data`, `server/backups` excluded from Docker images and Git.
- [x] **Non-Destructive Restart Verification**: Confirmed existing SQLite database with committed records is never overwritten by factory seed.
- [x] **Database Collision Prevention**: `getDatabasePath()` appends `.json` if SQLite path is provided, preventing binary corruption.
- [x] **Defensive UI Rendering (`OverviewTab`)**: Verified zero runtime `.length` crashes across null, loading, empty, and partial data states.

---

### Phase B: Post-Deployment Smoke-Test Plan (To Execute After Approved Live Deploy)
*The following manual smoke tests MUST be performed on the live URL immediately following deployment authorization:*

#### 1. Baseline Availability & Asset Delivery
- [ ] **Static Assets Load**: Navigate to `https://<app-name>.fly.dev/`. Confirm CSS, fonts, and client JavaScript load with HTTP 200 (no 404 or MIME errors).
- [ ] **Liveness Probe**: Send `GET /api/health`. Confirm `200 OK` with JSON `{ "status": "ok", "uptime": ... }`.
- [ ] **Readiness Probe**: Send `GET /api/ready`. Confirm `200 OK` with `{ "status": "ready", "database": "connected", "workspacesCount": ... }`.
- [ ] **API 404 Safety**: Send `GET /api/nonexistent-route`. Confirm JSON `404 Not Found` (never HTML).

#### 2. Authentication, Session & Multi-Tenant Access
- [ ] **New Business Registration**: Register a new user (`test.owner@example.com`) and create a new business workspace.
- [ ] **Session State & Cookie Handling**: Refresh the browser; confirm authentication session persists.
- [ ] **Tenant Isolation**: Log in as User A; confirm only Workspace A catalogue items and enquiries appear. Log in as User B; confirm Workspace A records are completely invisible.
- [ ] **Logout**: Log out; confirm session token is revoked and cannot be reused.

#### 3. Catalogue, Pricing & Business Profile Persistence
- [ ] **Catalogue Item Creation**: Add a new catalogue item with custom discount conditions.
- [ ] **Business Profile Update**: Change tagline and business hours in settings.
- [ ] **VM Restart Persistence Test**:
  - Issue `fly m restart <machine-id>`.
  - Wait 15 seconds for restart.
  - Refresh dashboard. Confirm newly created item and updated profile are **fully intact**.

#### 4. Public Storefronts & Customer Interaction
- [ ] **Public Storefront Resolution**: Navigate to `https://<app-name>.fly.dev/business/<business-slug>` in an incognito window without logging in.
- [ ] **Catalogue Visibility**: Confirm published catalogue items and pricing appear accurately.
- [ ] **Data Protection Audit**: Inspect browser devtools network tab; confirm private notes, emergency stops, and internal policies are **not leaked** in the public JSON response.
- [ ] **Customer Enquiry Submission**: Submit a test customer enquiry. Confirm it appears in the owner's dashboard inbox.
- [ ] **Customer Review Submission**: Submit a 5-star review. Confirm it renders on the public storefront.

#### 5. Operational Safety & Disaster Recovery Verification
- [ ] **AI Graceful Degradation**: With `GEMINI_API_KEY` unset or invalid, send a customer message via public storefront chat. Confirm the system responds with the polite fallback message without crashing or throwing a 500 error.
- [ ] **Storefront Suspension**: In Business Settings, toggle `published: false`. Confirm incognito visits to `/business/<slug>` return HTTP 404, while all private dashboard data remains intact. Re-enabling `published: true` restores public availability.
- [ ] **Isolated Backup & Restore**: Execute `sqliteAdapter.createBackup()`; confirm file exists in `/data/backups/`. Verify restoration into isolated test database without destroying newer records.
- [ ] **Secret Hygiene Verification**: Send HTTP request to `/.env`, `/server.ts`, `/cipher.sqlite`, `/server/cipher_db.json`. Confirm all return 404 or static index (no private source or credential leakage).

---

## Part 3: Deployment Decision Gate

| Criteria | Status | Evidence |
| :--- | :--- | :--- |
| Pre-deployment release gate | **PASSED** | 8/8 gates passed via `npm run release-gate` |
| Automated test coverage | **PASSED** | 11/11 test suites passing (100% assertions) |
| Defensive frontend reliability | **PASSED** | `OverviewTab` verified against undefined `.length` |
| Persistent volume architecture | **VERIFIED** | SQLite configured for dedicated mount `/data` |
| Single-instance safety constraints | **VERIFIED** | `auto_stop_machines = "off"`, `min_machines = 1` |
| Operational runbooks | **COMPLETE** | 10 runbooks documented in `docs/OPERATIONAL_RUNBOOKS.md` |
| Hosting costs documented | **COMPLETE** | Official Fly.io pricing verified (~$3.94 - $4.50/mo baseline) |
| Live deployment status | **PENDING** | **STOPPED**: Awaiting explicit user approval before provisioning cloud resources. |

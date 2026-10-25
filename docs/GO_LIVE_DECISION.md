# CIPHER Go-Live Decision Record

**Evaluation Date:** October 25, 2026  
**Decision Status:** **READY FOR OWNER APPROVAL**

---

## Decision Rationale

Following exhaustive execution of Phase 3F.3 operational runbooks and Phase 3F.4 risk audits, CIPHER has satisfied all strict pre-deployment verification criteria:

1. **Automated Verification**: All 12 automated test suites passed successfully with 0 failures (`npm test`).
2. **Release Gate Pipeline**: All 8 release gates passed cleanly (`npm run release-gate`), confirming TypeScript compilation, production bundling, artifact exclusions, host configuration, non-destructive persistence, and health route contracts.
3. **Security & Authorization Hardening**: Cross-tenant isolation has been reinforced at the middleware layer (unauthorized workspace access returns 403 Forbidden), password reset correctly invalidates active sessions, and sensitive endpoints are protected by server-side role checks.
4. **Data Durability & Recovery**: SQLite persistent volume configuration on `/data`, atomic write-rename serialization, backup integrity verification, and freshness-guarded restoration safeguards have been verified.
5. **Cost Transparency**: Baseline hosting costs on Fly.io are verified at ~$3.94 - $4.50/month. Cloud SQL PostgreSQL discrepancy has been audited and resolved (runtime uses SQLite; owner advised to check GCP billing console for unattached Cloud SQL instances).

---

## Conditions Required to Maintain Go-Live Readiness

1. **Single-Instance Constraint**: The deployment must maintain `min_machines_running = 1` and `auto_stop_machines = "off"` in `fly.toml`. Do not scale to multiple instances without migrating the primary database engine to a clustered relational database (such PostgreSQL).
2. **Secret Management**: Ensure `GEMINI_API_KEY` is securely injected via `fly secrets set` and never committed to version control.
3. **Owner Billing Review**: The owner should inspect their Google Cloud Console (`console.cloud.google.com/billing`) to confirm whether the idle Cloud SQL PostgreSQL instance in project `organic-transducer-8t8c4` should be stopped or deleted to avoid unwanted developer tier charges.

---
**Signed off by Senior Engineering Engine**  
*Status:* **READY FOR OWNER APPROVAL**

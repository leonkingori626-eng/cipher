# CIPHER Phase 3 Deferred Work & Future Roadmap

**Classification Date:** October 25, 2026  
**Scope:** Delineation of pre-deployment requirements, deferred owner decisions, and future product roadmap items intentionally excluded from Phase 3.

---

## Category 1 — Required Before Any Live Deployment

1. **Production Secret Injection:**  
   Configure production `GEMINI_API_KEY` (and any custom port or domain overrides) securely via Fly.io secrets management (`fly secrets set`). Ensure no secrets exist in repository source code, `fly.toml`, or environment example files.
2. **Persistent Volume Provisioning:**  
   Provision the dedicated NVMe volume in the target region prior to initial deployment:
   ```bash
   fly volumes create cipher_data --region <region> --size 1
   ```
3. **Owner Billing & Resource Audit:**  
   Owner must inspect account dashboards on Fly.io and Google Cloud to confirm billing status, payment methods, and review the deferred Cloud SQL instance.

---

## Category 2 — Deferred Owner Decisions

1. **Cloud SQL PostgreSQL Migration:**  
   Evaluate whether the provisioned Cloud SQL PostgreSQL instance in project `organic-transducer-8t8c4` should be activated as the primary relational persistence engine for future horizontal scaling, or if SQLite on persistent NVMe storage should remain the permanent production engine.
2. **Hosting Provider Budget Approval:**  
   Approve the estimated baseline hosting budget (~$3.94 - $4.50/month on Fly.io) and optional dedicated IPv4/custom domain allocations.
3. **Transactional Email Integration:**  
   Approve integration of a live transactional email delivery provider (e.g., Resend or SendGrid) to replace development-mode simulated password reset token output.

---

## Category 3 — Future Product Features & Roadmap (Outside Phase 3)

1. **Major Command Center & Onboarding Redesign:**  
   Comprehensive visual and architectural redesign of the dashboard navigation, workspace onboarding flows, and analytics panels. *(Deferred until explicit owner authorization following Phase 3 closure)*.
2. **Payment Processing & Escrow Integration:**  
   Stripe or gateway checkout integrations for direct customer purchases of catalogue items and services. *(Not implemented in Phase 3; payment processing must never be represented as active)*.
3. **Marketplace Payouts & Multi-Vendor Settlement:**  
   Automated split payouts, vendor commissions, and ledger settlement flows. *(Outside Phase 3 scope)*.
4. **Delivery Logistics & Fleet Tracking:**  
   Third-party carrier integrations (UPS, FedEx, local courier routing) for physical shipment tracking. *(Outside Phase 3 scope)*.
5. **Automated Subscription Enforcement:**  
   Automated billing grace periods, payment failure dunning emails, and subscription tier metering. *(Phase 3 supports manual storefront suspension via `published: false`, but does not include automated billing webhook integrations)*.

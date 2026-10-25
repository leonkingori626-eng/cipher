# CIPHER Operational Runbooks
**Phase 3F.3: Production Launch Preparation & System Administration**  
*Target Environment: Fly.io (Single-Instance Dedicated Micro-VM with Persistent NVMe Volume)*  
*Application Entry: `server.ts` | Storage: `/data/cipher.sqlite` | Backup Directory: `/data/backups`*

---

## Architecture Context & High Availability Warning
> **CRITICAL ARCHITECTURAL CONSTRAINT**:  
> CIPHER currently runs as a **single-instance SQLite architecture** (`min_machines_running = 1`, `auto_stop_machines = "off"`).  
> **Do not claim or assume high availability (HA)**. SQLite does not support active-active concurrent multi-machine writes over network mounts. Running multiple Fly machines against the same volume mount or concurrent SQLite files will lead to database locking errors or corruption. Scaling to multi-instance HA requires migrating the primary persistence engine to a networked relational database (such as Cloud SQL PostgreSQL).

---

## Runbook 1: Initial Deployment Preparation

### Purpose
Prepare a clean Fly.io application workspace and dedicated NVMe volume prior to launching code.

### Prerequisites
- Fly.io CLI (`flyctl`) authenticated.
- Repository passed all 8 release gates locally (`npm run release-gate`).

### Procedure
1. **Verify Local Release Gate**:
   ```bash
   npm run release-gate
   ```
   *Must report: `RELEASE GATE PASSED: All 8 pre-deployment gates verified successfully.`*

2. **Verify `fly.toml` Configuration**:
   Ensure `app`, `primary_region` (e.g. `lhr`), and `[mounts]` are declared:
   ```toml
   app = "cipher-ecosystem"
   primary_region = "lhr"

   [mounts]
     source = "cipher_data"
     destination = "/data"
   ```

3. **Provision Persistent Volume** *(Provider-Specific, run once)*:
   ```bash
   # Create 1GB persistent volume in target region (e.g., London / lhr)
   fly volumes create cipher_data --region lhr --size 1
   ```
   *Verification*: Run `fly volumes list` to confirm `cipher_data` is `created` and attached to `cipher-ecosystem`.

---

## Runbook 2: Secure Environment-Variable & Secret Configuration

### Purpose
Configure runtime variables and API keys without leaking credentials into Docker container images or Git history.

### Security Rules
- **Never** add secrets to `Dockerfile`, `fly.toml`, or `.env.example`.
- All credentials must be injected at runtime using Fly secrets (`fly secrets set`).
- Both `.dockerignore` and `.gitignore` strictly block `.env*` files.

### Procedure
1. **Set Production Secrets** *(Provider-Specific)*:
   ```bash
   # Set Gemini API Key (Optional: system runs with resilient fallback if omitted)
   fly secrets set GEMINI_API_KEY="your-gemini-api-key-here"

   # Optional custom port override (defaults to 3000)
   fly secrets set PORT="3000"
   ```

2. **Verify Configuration Variables**:
   In `fly.toml`, confirm static environment variables:
   ```toml
   [env]
     NODE_ENV = "production"
     PORT = "3000"
     CIPHER_SQLITE_PATH = "/data/cipher.sqlite"
     CIPHER_DB_PATH = "/data/cipher_db.json"
     CIPHER_BACKUP_PATH = "/data/backups"
     NODE_OPTIONS = "--max-old-space-size=384"
   ```

3. **Verify Secrets Injected**:
   ```bash
   fly secrets list
   ```
   *Verification*: Confirm `GEMINI_API_KEY` appears in the digest list with a recent update timestamp.

---

## Runbook 3: Application Startup & Health Verification

### Purpose
Deploy the built container and verify both liveness and readiness probes before routing production traffic.

### Procedure
1. **Deploy Release** *(Provider-Specific)*:
   ```bash
   fly deploy --ha=false
   ```
   *Note: `--ha=false` ensures Fly does not inadvertently spawn a second replica machine.*

2. **Verify Liveness Endpoint (`/api/health`)**:
   Checks whether the Node.js Express process is responsive:
   ```bash
   curl -i https://cipher-ecosystem.fly.dev/api/health
   ```
   *Expected Response (`200 OK`)*:
   ```json
   {
     "status": "ok",
     "uptime": 42.15,
     "timestamp": "2026-10-25T15:00:00.000Z",
     "version": "1.0.0"
   }
   ```

3. **Verify Readiness Endpoint (`/api/ready`)**:
   Checks SQLite database connection, table integrity, and workspace readiness:
   ```bash
   curl -i https://cipher-ecosystem.fly.dev/api/ready
   ```
   *Expected Response (`200 OK`)*:
   ```json
   {
     "status": "ready",
     "database": "connected",
     "storageArchitecture": "sqlite and durable atomic persistence",
     "sqlitePath": "/data/cipher.sqlite",
     "rateLimiterArchitecture": "in-memory sliding window (single-instance)",
     "workspacesCount": 2,
     "timestamp": "2026-10-25T15:00:00.000Z"
   }
   ```
   *Failure Condition*: Returns `503 Service Unavailable` if database is unmounted or empty.

4. **Inspect Live Application Logs**:
   ```bash
   fly logs
   ```
   *Expected Log*: `[DATABASE] Loading authoritative multi-tenant dataset from persistent SQLite storage: /data/cipher.sqlite`

---

## Runbook 4: Backup Creation & Backup Integrity Checks

### Purpose
Generate atomic SQLite snapshots and verify their integrity without locking or interrupting active transactions.

### Architecture
- CIPHER's `sqliteAdapter.createBackup()` exports binary database memory to a temporary file (`.tmp`) and renames it atomically to `/data/backups/cipher-sqlite-backup-<timestamp>.sqlite`.
- Verification confirms file size is positive and table schema contains valid workspace records.

### Procedure
1. **Trigger On-Demand Backup via Server CLI / SSH**:
   ```bash
   # Connect to Fly VM terminal
   fly ssh console

   # Execute backup utility script or node snippet
   node -e '
     import("./server/db/sqliteAdapter.js").then(({ sqliteAdapter }) => {
       sqliteAdapter.init().then(() => {
         const meta = sqliteAdapter.createBackup("/data/backups");
         console.log("BACKUP CREATED:", JSON.stringify(meta, null, 2));
       });
     });
   '
   ```

2. **Verify Backup Integrity on Disk**:
   ```bash
   ls -la /data/backups/
   ```
   *Check*:
   - Backup file exists (e.g., `cipher-sqlite-backup-2026-10-25T15-30-00-000Z.sqlite`).
   - File size is non-zero (typically > 50 KB).
   - Timestamp is recent.

3. **Verify SQLite Database Header**:
   ```bash
   head -c 16 /data/backups/cipher-sqlite-backup-*.sqlite | grep -q "SQLite format 3" && echo "VALID SQLITE HEADER"
   ```

4. **Off-Host Backup Transfer (Disaster Prevention)**:
   ```bash
   # Download backup to local administrative workstation
   fly sftp get /data/backups/cipher-sqlite-backup-latest.sqlite ./backups/
   ```

---

## Runbook 5: Disaster Recovery & Safe Restoration

### Purpose
Safely restore an earlier database snapshot following catastrophic corruption, user error, or storage failure without accidentally overwriting newer live data.

### Built-in Safeguards
1. **Freshness Guard**: Restoring a backup older than the live database modification time (`mtime`) is **strictly rejected** unless explicit override (`force: true`) is provided.
2. **Safety Quarantine**: Before any file replacement, the current live database is saved to `/data/cipher.sqlite.pre-restore.<timestamp>.bak`.

### Procedure
1. **Identify Target Backup**:
   ```bash
   ls -lt /data/backups/
   ```

2. **Stop Inbound Traffic**:
   Temporarily divert traffic or suspend requests during restoration to guarantee atomic replacement:
   ```bash
   # Scale or stop application machine temporarily
   fly m stop <machine-id>
   ```

3. **Execute Safe Restoration**:
   ```bash
   fly ssh console
   node -e '
     import("./server/db/sqliteAdapter.js").then(({ sqliteAdapter }) => {
       sqliteAdapter.init().then(() => {
         const res = sqliteAdapter.restoreFromBackup("/data/backups/<target-backup>.sqlite", { force: true });
         console.log("RESTORE RESULT:", JSON.stringify(res, null, 2));
       });
     });
   '
   ```

4. **Verify Restored State & Quarantine Snapshot**:
   ```bash
   # Confirm quarantine file exists
   ls -la /data/cipher.sqlite.pre-restore.*.bak

   # Restart application machine
   fly m start <machine-id>

   # Verify readiness probe
   curl https://cipher-ecosystem.fly.dev/api/ready
   ```

---

## Runbook 6: Failed Deployment & Rollback Procedures

### Purpose
Roll back to the previous stable release when a new deployment fails health checks or runtime assertions.

### Schema Compatibility Warning
> **CRITICAL**: Rollback is only safe if the previous software version understands the current database schema.  
> - **Compatible Schema Changes**: Additive columns with default values (`ALTER TABLE ... ADD COLUMN ...`).
> - **Incompatible Changes**: Renamed tables, dropped columns, altered data types.
> If an incompatible schema migration occurred, **both application code and database backup must be restored simultaneously**.

### Procedure
1. **Detect Deployment Failure**:
   Fly deployment automatically halts if `/api/health` or `/api/ready` fails during the grace period (15s).

2. **Rollback Container Image** *(Provider-Specific)*:
   ```bash
   # List recent releases
   fly releases list

   # Revert to previous release version (e.g. v2)
   fly releases rollback <release-version>
   ```

3. **Assess Database Schema Status**:
   - If schema is unchanged: Application code rollback is sufficient.
   - If schema was altered: Restore corresponding database snapshot created prior to deployment using **Runbook 5**.

4. **Verify Recovery**:
   ```bash
   curl https://cipher-ecosystem.fly.dev/api/health
   curl https://cipher-ecosystem.fly.dev/api/ready
   ```

---

## Runbook 7: Database Disk-Space Monitoring & Storage Exhaustion

### Purpose
Monitor NVMe volume utilization and prevent SQLite disk-full failures (`SQLITE_FULL`).

### Indicators
- Server logs show `ENOSPC: no space left on device` or `CRITICAL: Failed to write SQLite database`.
- Readiness probe returns 503 or crashes during `saveData()`.

### Procedure
1. **Inspect Volume Usage** *(Provider-Specific)*:
   ```bash
   fly volumes list
   fly ssh console -C "df -h /data"
   ```

2. **Clean Up Old Backups**:
   Retain the last 7 daily snapshots and purge older files:
   ```bash
   fly ssh console
   # Remove backups older than 14 days
   find /data/backups -type f -name "cipher-sqlite-backup-*.sqlite" -mtime +14 -delete
   # Remove old quarantine backups
   find /data -type f -name "*.bak" -mtime +7 -delete
   ```

3. **Expand Volume Size** *(If usage > 80%)*:
   ```bash
   # Extend volume size from 1GB to 2GB online without downtime
   fly volumes extend <volume-id> --size 2
   ```

4. **Verify Free Space**:
   ```bash
   fly ssh console -C "df -h /data"
   ```

---

## Runbook 8: Unexpected Shutdowns & Restart Recovery

### Purpose
Ensure clean recovery when a micro-VM crashes, host node undergoes maintenance, or process crashes due to unhandled exceptions.

### Recovery Mechanics
- `server.ts` traps `SIGTERM` and `SIGINT` to gracefully close HTTP sockets before exiting.
- Persistent SQLite database on `/data` is protected by atomic write-rename pattern (`.tmp` -> `.sqlite`).
- Upon restart, `sqliteAdapter.hasCommittedData()` inspects `/data/cipher.sqlite`. If existing records are detected, factory default re-seeding is automatically skipped.

### Procedure
1. **Check Machine Status & Exit Codes**:
   ```bash
   fly status
   fly logs --no-tail
   ```
   *Look for: OOM killer (`exit_code = 137`) or V8 memory exhaustion.*

2. **Restart Application Machine**:
   ```bash
   fly m restart <machine-id>
   ```

3. **Verify Data Integrity Post-Restart**:
   ```bash
   # Confirm readiness probe returns active workspaces count
   curl https://cipher-ecosystem.fly.dev/api/ready
   ```

4. **Memory Tuning (If OOM Occurred)**:
   If logs indicate V8 heap exhaustion, verify `fly.toml`:
   - `memory = "512mb"`
   - `NODE_OPTIONS = "--max-old-space-size=384"`

---

## Runbook 9: Authentication, Tenant-Isolation & Security Incident Response

### Purpose
Respond immediately to compromised credentials, tenant data leakage, or malicious brute-force attempts.

### Threat Scenarios & Mitigations
1. **Compromised User Password**:
   - Issue immediate session revocation. CIPHER's `/api/auth/reset-password` automatically invalidates all active sessions for that user account:
     ```bash
     # Token revocation is verified in Phase 3D.1 test suite
     ```
2. **Brute-Force Login Attempt**:
   - CIPHER incorporates an in-memory sliding window rate limiter: 5 failed attempts trigger an automatic 15-minute IP/account lockout.
3. **Tenant Data Isolation Breach Inquiry**:
   - Inspect workspace ownership:
     ```bash
     fly ssh console
     node -e '
       import("./server/db/sqliteAdapter.js").then(({ sqliteAdapter }) => {
         sqliteAdapter.init().then(() => {
           const d = sqliteAdapter.loadData();
           console.log("Audit log count:", d.auditEvents.length);
           console.log("Recent audit entries:", d.auditEvents.slice(-5));
         });
       });
     '
     ```
4. **Emergency Stop (AI Safety)**:
   - If an AI agent emits incorrect information, the business owner can toggle `emergencyStopActive: true` in their Business Profile.
   - This immediately halts automated generative replies and forces human handoff for all customer chats.

---

## Runbook 10: Subscription Expiry & Business-Storefront Suspension

### Purpose
Suspend public visitor access to a business's storefront when a subscription lapses, terms are violated, or the owner unpublishes their profile—while preserving all catalogue items, enquiries, reviews, and private records intact.

### Existing Architecture Mechanism
- CIPHER stores `published: boolean` on `workspace.profile`.
- In `server.ts` (`/api/public/business/:slug`), if `ws.profile.published === false`, the public router immediately responds:
  ```json
  HTTP/1.1 404 Not Found
  {
    "error": "Business website is currently unpublished or inactive."
  }
  ```
- **Data Preservation**: Private catalogue items, customer reviews, enquiries, CRM contacts, and dashboard settings remain 100% intact.
- Re-enabling `published: true` instantly restores public availability without data loss.

### Procedure
1. **Suspend Business Storefront**:
   Owner or administrator updates the profile via API or dashboard:
   ```bash
   # PATCH /api/workspaces/:id/profile with { published: false }
   curl -X PUT https://cipher-ecosystem.fly.dev/api/workspace-profile \
     -H "Authorization: Bearer <owner-session-token>" \
     -H "Content-Type: application/json" \
     -d '{"published": false}'
   ```

2. **Verify Public Route Blocked**:
   ```bash
   curl -i https://cipher-ecosystem.fly.dev/api/public/business/<business-slug>
   ```
   *Expected Response*: `404 Not Found` with message: `"Business website is currently unpublished or inactive."`

3. **Verify Private Access Unaffected**:
   Log in as workspace owner. Access `/api/catalogue` and `/api/enquiries`.
   *Expected*: All private catalogue records and customer inquiries remain visible and fully editable.

4. **Reactivate Storefront**:
   ```bash
   curl -X PUT https://cipher-ecosystem.fly.dev/api/workspace-profile \
     -H "Authorization: Bearer <owner-session-token>" \
     -H "Content-Type: application/json" \
     -d '{"published": true}'
   ```
   *Result*: Public storefront immediately resumes serving at its canonical URL.

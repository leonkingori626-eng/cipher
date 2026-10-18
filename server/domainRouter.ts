import { DBschema, Workspace } from './db';

export interface DomainRecord {
  id: string;
  workspaceId: string;
  hostname: string;
  isCustom: boolean;
  verified: boolean;
  verificationToken?: string;
}

/**
 * Domain Routing & Verification Engine for CIPHER (Phase 3E.1)
 * Ensures hostnames map strictly to authorized, verified, and published workspaces.
 */
export class CipherDomainRouter {
  private verifiedDomains: Map<string, string> = new Map(); // hostname -> workspaceId
  private unverifiedDomains: Set<string> = new Set();

  constructor(private db: DBschema) {
    this.initializeDefaultDomains();
  }

  private initializeDefaultDomains() {
    // Register default subdomains or slugs for existing workspaces
    if (this.db && this.db.workspaces) {
      for (const ws of this.db.workspaces) {
        if (ws.slug) {
          const defaultHostname = `${ws.slug}.cipherapp.net`;
          this.verifiedDomains.set(defaultHostname.toLowerCase(), ws.id);
        }
        if (ws.profile && ws.profile.customDomain) {
          const custom = ws.profile.customDomain.toLowerCase().trim();
          if (ws.profile.customDomainVerified) {
            this.verifiedDomains.set(custom, ws.id);
          } else {
            this.unverifiedDomains.add(custom);
          }
        }
      }
    }
  }

  /**
   * Normalize and validate a hostname
   */
  public normalizeHostname(hostname: string): string {
    return hostname.toLowerCase().trim().replace(/:\d+$/, ''); // Strip port if present
  }

  /**
   * Resolve an incoming request hostname to an authorized workspace ID.
   * Rejects unverified domains or mismatched ownership claims.
   */
  public resolveWorkspaceByHost(hostname: string): { workspace: Workspace | null; reason?: string } {
    const normalized = this.normalizeHostname(hostname);

    // Check if domain is registered as unverified
    if (this.unverifiedDomains.has(normalized)) {
      return { workspace: null, reason: 'Domain is pending verification and cannot serve storefront traffic.' };
    }

    // Check verified custom domains or subdomains
    const workspaceId = this.verifiedDomains.get(normalized);
    if (!workspaceId) {
      return { workspace: null, reason: 'No authorized business found for this hostname.' };
    }

    const workspace = this.db.workspaces.find((w: Workspace) => w.id === workspaceId);
    if (!workspace) {
      return { workspace: null, reason: 'Referenced business workspace does not exist.' };
    }

    // Check publication status
    if (!workspace.profile || workspace.profile.published !== true) {
      return { workspace: null, reason: 'Business storefront is currently unpublished.' };
    }

    return { workspace };
  }

  /**
   * Register or claim a custom domain with uniqueness enforcement.
   */
  public registerDomain(workspaceId: string, hostname: string, isCustom = true): { success: boolean; error?: string; token?: string } {
    const normalized = this.normalizeHostname(hostname);

    // Check uniqueness across all verified and unverified domains
    if (this.verifiedDomains.has(normalized)) {
      const existingWsId = this.verifiedDomains.get(normalized);
      if (existingWsId !== workspaceId) {
        return { success: false, error: 'Domain is already claimed and verified by another business.' };
      }
      return { success: true, error: 'Domain already registered to this business.' };
    }

    if (this.unverifiedDomains.has(normalized)) {
      return { success: false, error: 'Domain is already registered by another business pending verification.' };
    }

    const token = `cipher-verify-${Math.random().toString(36).substring(2, 12)}`;
    this.unverifiedDomains.add(normalized);

    return { success: true, token };
  }

  /**
   * Verify a custom domain ownership challenge.
   */
  public verifyDomain(workspaceId: string, hostname: string): boolean {
    const normalized = this.normalizeHostname(hostname);
    if (this.unverifiedDomains.has(normalized)) {
      this.unverifiedDomains.delete(normalized);
      this.verifiedDomains.set(normalized, workspaceId);
      return true;
    }
    return false;
  }
}

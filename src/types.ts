export type WorkspaceRole = 'Owner' | 'Operator' | 'Client';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  profile: BusinessProfile;
  createdAt: string;
}

export interface Membership {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface AuthSession {
  token: string;
  user: User;
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  role: WorkspaceRole;
}

export interface WebsiteDraft {
  status: 'Draft' | 'Approved' | 'Published';
  heroHeadline: string;
  tagline: string;
  aboutText: string;
  faqs?: Array<{ question: string; answer: string }>;
  featuredItems?: string[];
  generatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface BusinessProfile {
  name: string;
  type: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  businessHours: string;
  timeZone: string;
  supportTone: string;
  escalationInstructions: string;
  emergencyStopActive: boolean;
  slug: string;
  tagline: string;
  published: boolean;
  template: 'Maple Botanical' | 'Modern Clean' | 'Warm Artisan';
  workspaceId?: string;
  location?: string;
  faqs?: Array<{ question: string; answer: string }>;
  websiteDraft?: WebsiteDraft;
}

export interface CatalogueItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  pricingMethod: 'Fixed' | 'From' | 'Hourly' | 'Quote Required';
  variants: string;
  availability: 'In Stock' | 'Made to Order' | 'Available' | 'Archived';
  discountPrice?: number;
  discountConditions?: string;
  workspaceId?: string;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  verifiedInteraction: boolean;
  businessResponse?: string;
  status: 'Published' | 'Pending Moderation' | 'Hidden';
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: 'Shipping & Delivery' | 'Returns & Refunds' | 'Products & Pricing' | 'Policies' | 'General FAQ';
  status: 'Draft' | 'Approved' | 'Archived';
  source: string;
  effectiveDate: string;
  updatedAt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  sender: 'customer' | 'assistant' | 'operator';
  senderName: string;
  text: string;
  timestamp: string;
  isAiGenerated?: boolean;
  needsHandoff?: boolean;
}

export interface Conversation {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: 'New' | 'AI assisted' | 'Needs human' | 'In progress' | 'Resolved' | 'Archived';
  channel: 'Web Chat' | 'Email Widget' | 'Direct';
  lastActive: string;
  assignedOperator?: string;
  operatorNotes?: string;
  messages: Message[];
  createdAt: string;
}

export interface CustomerEnquiry {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  businessNeed: string;
  source: string;
  dateReceived: string;
  status: 'New' | 'Reviewing' | 'Contacted' | 'Qualified' | 'Proposal pending' | 'Won' | 'Lost';
  assignedOwner: string;
  notes: string;
}

export interface CrmContact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'Lead' | 'Active Client' | 'Partner' | 'Archived';
  stage: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';
  value: number;
  lastInteraction: string;
  assignedOwner: string;
}

export interface Proposal {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  scope: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Sent' | 'Accepted' | 'Declined';
  validUntil: string;
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  projectId: string;
  assignee: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed';
  progress: number;
  dueDate: string;
  owner: string;
}

export interface WorkflowExecution {
  id: string;
  workflowName: string;
  trigger: string;
  status: 'Success' | 'Running' | 'Failed' | 'Pending Approval';
  executedAt: string;
  details: string;
}

export interface AssistantConfig {
  name: string;
  workspaceName: string;
  tone: string;
  model: string;
  temperature: number;
  maxTokens: number;
  escalationThreshold: string;
  enabled: boolean;
  version: string;
  lastTested: string;
}

export interface ApprovalRequest {
  id: string;
  action: string;
  requestor: string;
  reason: string;
  context: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  status: 'Not configured' | 'Needs credentials' | 'Test mode' | 'Connected and verified' | 'Error' | 'Disabled';
  implementationStatus?: 'implemented_and_verified' | 'configured_unverified' | 'simulated' | 'not_implemented';
  deliveryChannel?: string;
  description: string;
  lastChecked?: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  resource: string;
  timestamp: string;
  outcome: 'Success' | 'Blocked' | 'Warning';
  details: string;
}

import {
  BusinessProfile,
  CatalogueItem,
  Review,
  KnowledgeEntry,
  Conversation,
  CustomerEnquiry,
  CrmContact,
  Proposal,
  Project,
  ProjectTask,
  WorkflowExecution,
  AssistantConfig,
  ApprovalRequest,
  Integration,
  AuditEvent
} from './types';

export const initialBusinessProfile: BusinessProfile = {
  name: "Maple & Moss Home Goods",
  slug: "maple-and-moss",
  tagline: "Sustainable home decor & handcrafted ceramics",
  published: true,
  template: "Maple Botanical",
  type: "Small Online Retailer & Handcrafted Goods",
  description: "Curated sustainable home decor, handmade ceramics, botanical planters, and artisanal linens crafted by independent studios.",
  contactEmail: "support@mapleandmossgoods.com",
  contactPhone: "+1 (555) 382-9400",
  businessHours: "Monday - Friday, 9:00 AM - 6:00 PM EST",
  timeZone: "America/New_York",
  supportTone: "Warm, helpful, professional, and clear",
  escalationInstructions: "If a customer asks about custom international wholesale orders or returns after 30 days, flag as 'Needs human' and assign to Sarah Jenkins.",
  emergencyStopActive: false,
};

export const initialCatalogueItems: CatalogueItem[] = [
  {
    id: "cat-1",
    name: "Handmade Stoneware Planter",
    category: "Planters",
    description: "Thrown by hand in our Vermont studio with a soft forest green glaze and drainage hole.",
    price: 48,
    pricingMethod: "Fixed",
    variants: "Small (5in), Medium (7in), Large (10in)",
    availability: "In Stock"
  },
  {
    id: "cat-2",
    name: "Artisanal Linen Throw Blanket",
    category: "Textiles",
    description: "Pre-washed 100% European flax linen throw blanket for year-round comfort.",
    price: 125,
    pricingMethod: "Fixed",
    variants: "Natural Oat, Sage Green, Charcoal",
    availability: "In Stock"
  },
  {
    id: "cat-3",
    name: "Custom Corporate Gifting Set",
    category: "B2B / Wholesale",
    description: "Curated gift boxes including stoneware mug, organic linen throw, and botanical soy candle.",
    price: 95,
    pricingMethod: "From",
    variants: "Minimum 10 units",
    availability: "Made to Order"
  }
];

export const initialReviews: Review[] = [
  {
    id: "rev-1",
    customerName: "Chloe Bennett",
    rating: 5,
    comment: "The stoneware planter is absolutely gorgeous! Packaging was plastic-free and arrived safely in 3 days.",
    date: "2026-10-10",
    verifiedInteraction: true,
    businessResponse: "Thank you so much Chloe! Enjoy your new plant sanctuary.",
    status: "Published"
  },
  {
    id: "rev-2",
    customerName: "Marcus Vance",
    rating: 5,
    comment: "Incredible quality on the linen throw. Will definitely be stocking more for our interior design clients.",
    date: "2026-10-12",
    verifiedInteraction: true,
    status: "Published"
  }
];

export const initialKnowledgeEntries: KnowledgeEntry[] = [
  {
    id: "kb-1",
    title: "Standard Shipping Rates & Transit Times",
    content: "Standard ground shipping is $6.95 flat rate across the continental US for orders under $75. Free standard shipping is automatically applied on all orders over $75. Transit times typically range from 3 to 5 business days after processing (1-2 business days).",
    category: "Shipping & Delivery",
    status: "Approved",
    source: "Shipping Operations Policy v2.1",
    effectiveDate: "2026-01-15",
    updatedAt: "2026-09-10T14:22:00Z",
    createdAt: "2026-01-10T09:00:00Z",
  },
  {
    id: "kb-2",
    title: "Return & Exchange Policy (30 Days)",
    content: "We accept unwashed, undamaged items in original packaging within 30 days of delivery for a full refund minus original shipping costs. Return shipping labels are provided via our portal for a flat $5.00 deduction. Final sale items (clearance & personalized ceramics) cannot be returned.",
    category: "Returns & Refunds",
    status: "Approved",
    source: "Customer Care Handbook",
    effectiveDate: "2026-02-01",
    updatedAt: "2026-08-14T11:05:00Z",
    createdAt: "2026-01-12T10:30:00Z",
  },
  {
    id: "kb-3",
    title: "Handmade Ceramic Care Instructions",
    content: "All our stoneware ceramics are lead-free, food safe, microwave safe, and dishwasher safe unless specified otherwise with a gold luster rim (hand wash only). Sudden thermal shock (e.g., moving directly from freezer to hot oven) should be avoided.",
    category: "Products & Pricing",
    status: "Approved",
    source: "Studio Artisan Guide",
    effectiveDate: "2026-01-01",
    updatedAt: "2026-03-01T08:00:00Z",
    createdAt: "2026-01-01T08:00:00Z",
  }
];

export const initialConversations: Conversation[] = [
  {
    id: "conv-101",
    customerName: "Elena Rostova",
    customerEmail: "elena.r@example.com",
    status: "Needs human",
    channel: "Web Chat",
    lastActive: "10 mins ago",
    assignedOperator: "Sarah Jenkins",
    operatorNotes: "Customer wants to modify shipping address for order #4892 after fulfillment scan.",
    messages: [
      {
        id: "m-1",
        sender: "customer",
        senderName: "Elena Rostova",
        text: "Hi! I just placed order #4892 yesterday, but I need to change the shipping address to my new apartment across town.",
        timestamp: "10:25 AM"
      },
      {
        id: "m-2",
        sender: "assistant",
        senderName: "CIPHER Guide AI",
        text: "Hello Elena! I'd be happy to help look into order #4892. Because your order has already entered our fulfillment queue, address modifications require manual review by our team. I have flagged this conversation for Sarah Jenkins.",
        timestamp: "10:25 AM",
        isAiGenerated: true,
        needsHandoff: true
      }
    ],
    createdAt: "2026-10-15T10:25:00Z"
  }
];

export const initialEnquiries: CustomerEnquiry[] = [
  {
    id: "enq-1",
    customerName: "Marcus Vance",
    customerEmail: "marcus.vance@designstudio.co",
    customerPhone: "+1 (555) 902-1144",
    businessNeed: "Interior design studio stocking 45 ceramic planters for spring client project.",
    source: "Web Chat Enquiry",
    dateReceived: "2026-10-15",
    status: "Qualified",
    assignedOwner: "Sarah Jenkins",
    notes: "Expressed interest in wholesale catalog."
  }
];

export const initialCrmContacts: CrmContact[] = [
  {
    id: "crm-1",
    name: "Marcus Vance",
    company: "Vance Design Studio",
    email: "marcus.vance@designstudio.co",
    phone: "+1 (555) 902-1144",
    status: "Active Client",
    stage: "Qualified",
    value: 3400,
    lastInteraction: "2 hours ago",
    assignedOwner: "Sarah Jenkins"
  }
];

export const initialProposals: Proposal[] = [
  {
    id: "prop-1",
    title: "Spring Interior Studio Planter Stock",
    clientName: "Marcus Vance",
    clientEmail: "marcus.vance@designstudio.co",
    amount: 3400,
    currency: "USD",
    scope: "45 assorted handmade ceramic planters with custom forest green glaze.",
    status: "Approved",
    validUntil: "2026-12-01",
    createdAt: "2026-10-12"
  }
];

export const initialProjects: Project[] = [
  {
    id: "proj-1",
    name: "Spring Interior Studio Planter Delivery",
    clientName: "Marcus Vance",
    status: "Active",
    progress: 65,
    dueDate: "2026-11-10",
    owner: "Sarah Jenkins"
  }
];

export const initialTasks: ProjectTask[] = [
  {
    id: "task-1",
    title: "Glaze testing for custom forest green planters",
    projectId: "proj-1",
    assignee: "Sarah Jenkins",
    status: "In Progress",
    priority: "High",
    dueDate: "2026-10-20"
  }
];

export const initialWorkflowExecutions: WorkflowExecution[] = [
  {
    id: "wf-exec-1",
    workflowName: "New Enquiry Auto-Classifier",
    trigger: "Customer Enquiry Received",
    status: "Success",
    executedAt: "2026-10-15 10:25 AM",
    details: "Successfully categorized inquiry as Wholesale."
  }
];

export const initialAssistantConfig: AssistantConfig = {
  name: "CIPHER Guide (Maple & Moss)",
  workspaceName: "Maple & Moss Home Goods",
  tone: "Warm, helpful, professional, and clear",
  model: "gemini-2.5-flash",
  temperature: 0.3,
  maxTokens: 500,
  escalationThreshold: "Medium uncertainty or address changes",
  enabled: true,
  version: "1.4.2",
  lastTested: "Today at 08:30 AM (Passed all safety assertions)",
};

export const initialApprovals: ApprovalRequest[] = [
  {
    id: "app-1",
    action: "Publish new knowledge entry: Wholesale & Custom Corporate Orders",
    requestor: "David Kim (Operations)",
    reason: "Expanding B2B holiday gifting capabilities for Q4.",
    context: "Knowledge base item #kb-4 currently in draft mode.",
    riskLevel: "Medium",
    status: "Pending",
    createdAt: "2026-10-15T11:00:00Z"
  }
];

export const initialIntegrations: Integration[] = [
  {
    id: "int-1",
    name: "Customer Messaging Widget",
    category: "Channel",
    status: "Connected and verified",
    implementationStatus: "implemented_and_verified",
    deliveryChannel: "web_chat",
    description: "Embeddable web chat widget for customer support and AI guidance.",
    lastChecked: "2 mins ago"
  },
  {
    id: "int-2",
    name: "Outbound Email Notifications (SMTP)",
    category: "Notifications",
    status: "Needs credentials",
    implementationStatus: "configured_unverified",
    deliveryChannel: "email",
    description: "Transactional notifications for customer enquiries and account verification.",
    lastChecked: "Never"
  },
  {
    id: "int-3",
    name: "Stripe Payment Gateway",
    category: "Commerce",
    status: "Test mode",
    implementationStatus: "simulated",
    deliveryChannel: "payment",
    description: "Catalogue checkout and deposit payments (Simulation mode active).",
    lastChecked: "1 hour ago"
  },
  {
    id: "int-4",
    name: "Google Analytics 4",
    category: "Analytics",
    status: "Not configured",
    implementationStatus: "not_implemented",
    deliveryChannel: "analytics",
    description: "Website traffic and conversion analytics tracking.",
    lastChecked: "Never"
  },
  {
    id: "int-5",
    name: "Shopify Store Sync",
    category: "E-commerce",
    status: "Test mode",
    implementationStatus: "simulated",
    deliveryChannel: "commerce",
    description: "Product catalog and order status lookup (Simulated store data).",
    lastChecked: "15 mins ago"
  }
];

export const initialAuditEvents: AuditEvent[] = [
  {
    id: "aud-1",
    actor: "Sarah Jenkins",
    action: "Operator Takeover",
    resource: "Conversation #conv-101",
    timestamp: "2026-10-15T10:28:00Z",
    outcome: "Success",
    details: "Operator took over conversation from AI assistant."
  }
];

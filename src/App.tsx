import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/public/Navbar';
import { LandingPage } from './components/public/LandingPage';
import { ProductFeaturesPage } from './components/public/ProductFeaturesPage';
import { InteractiveDemoPage } from './components/public/InteractiveDemoPage';
import { HowItWorksPage } from './components/public/HowItWorksPage';
import { PrivacyPage } from './components/public/PrivacyPage';

import { Sidebar } from './components/dashboard/Sidebar';
import { Header } from './components/dashboard/Header';
import { OverviewTab } from './components/dashboard/OverviewTab';
import { ConversationsTab } from './components/dashboard/ConversationsTab';
import { EnquiriesTab } from './components/dashboard/EnquiriesTab';
import { KnowledgeTab } from './components/dashboard/KnowledgeTab';
import { AssistantsTab } from './components/dashboard/AssistantsTab';
import { ApprovalsTab } from './components/dashboard/ApprovalsTab';
import { InsightsTab } from './components/dashboard/InsightsTab';
import { SettingsTab } from './components/dashboard/SettingsTab';
import { CrmTab } from './components/dashboard/CrmTab';
import { ProposalsTab } from './components/dashboard/ProposalsTab';
import { ProjectsTasksTab } from './components/dashboard/ProjectsTasksTab';
import { AiAgentsTab } from './components/dashboard/AiAgentsTab';
import { FlowEngineTab } from './components/dashboard/FlowEngineTab';
import { ClientPortalTab } from './components/dashboard/ClientPortalTab';
import { CatalogueTab } from './components/dashboard/CatalogueTab';
import { ReviewsTab } from './components/dashboard/ReviewsTab';
import { BusinessRegistrationWizard } from './components/dashboard/BusinessRegistrationWizard';
import { PublicBusinessSite } from './components/public/PublicBusinessSite';
import { CustomerChatWidget } from './components/CustomerChatWidget';
import { AuthModal } from './components/auth/AuthModal';
import { CipherWatermarkBackground } from './components/dashboard/CipherWatermarkBackground';

import {
  initialBusinessProfile,
  initialCatalogueItems,
  initialReviews,
  initialKnowledgeEntries,
  initialConversations,
  initialEnquiries,
  initialCrmContacts,
  initialProposals,
  initialProjects,
  initialTasks,
  initialWorkflowExecutions,
  initialAssistantConfig,
  initialApprovals,
  initialIntegrations,
  initialAuditEvents
} from './mockData';
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
  AuditEvent,
  User as UserType,
  Workspace,
  WorkspaceRole
} from './types';

const DEFAULT_DEMO_TOKEN = 'demo-sarah-session-token-2026';

export default function App() {
  const [appMode, setAppMode] = useState<'public' | 'dashboard' | 'published-site' | 'wizard'>('dashboard');
  const [currentView, setCurrentView] = useState<string>('landing');
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Multi-Tenant Authentication & Workspace State
  const [sessionToken, setSessionToken] = useState<string>(() => {
    return localStorage.getItem('cipher_session_token') || DEFAULT_DEMO_TOKEN;
  });
  const [currentUser, setCurrentUser] = useState<UserType>({
    id: 'user-sarah',
    email: 'sarah.jenkins@mapleandmossgoods.com',
    name: 'Sarah Jenkins',
    createdAt: '2026-10-01T09:00:00.000Z'
  });
  const [currentRole, setCurrentRole] = useState<WorkspaceRole>('Owner');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: 'ws-maple-and-moss',
      name: 'Maple & Moss Home Goods',
      slug: 'maple-and-moss',
      ownerId: 'user-sarah',
      profile: initialBusinessProfile,
      createdAt: '2026-10-01T09:00:00.000Z'
    }
  ]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>({
    id: 'ws-maple-and-moss',
    name: 'Maple & Moss Home Goods',
    slug: 'maple-and-moss',
    ownerId: 'user-sarah',
    profile: initialBusinessProfile,
    createdAt: '2026-10-01T09:00:00.000Z'
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Business Operational Data
  const [profile, setProfile] = useState<BusinessProfile>(initialBusinessProfile);
  const [catalogue, setCatalogue] = useState<CatalogueItem[]>(initialCatalogueItems);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>(initialKnowledgeEntries);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [enquiries, setEnquiries] = useState<CustomerEnquiry[]>(initialEnquiries);
  const [crmContacts, setCrmContacts] = useState<CrmContact[]>(initialCrmContacts);
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tasks, setTasks] = useState<ProjectTask[]>(initialTasks);
  const [workflowExecutions, setWorkflowExecutions] = useState<WorkflowExecution[]>(initialWorkflowExecutions);
  const [assistant, setAssistant] = useState<AssistantConfig>(initialAssistantConfig);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(initialApprovals);
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(initialAuditEvents);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

  // Authenticated and Workspace-Scoped Fetch Wrapper
  const apiFetch = useCallback(async (url: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers || {});
    if (sessionToken) {
      headers.set('Authorization', `Bearer ${sessionToken}`);
    }
    const wsId = currentWorkspace?.id || profile.workspaceId || 'ws-maple-and-moss';
    headers.set('x-workspace-id', wsId);
    return fetch(url, { ...init, headers });
  }, [sessionToken, currentWorkspace?.id, profile.workspaceId]);

  // Load all data for the active workspace
  const loadWorkspaceData = useCallback(async (wsId?: string) => {
    setIsDataLoading(true);
    setDataLoadError(null);
    try {
      const targetWsId = wsId || currentWorkspace?.id;
      const headers: Record<string, string> = {};
      if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
      if (targetWsId) headers['x-workspace-id'] = targetWsId;

      const [
        profileRes,
        catRes,
        revRes,
        kbRes,
        convRes,
        enqRes,
        crmRes,
        propRes,
        projRes,
        taskRes,
        wfRes,
        astRes,
        apprRes,
        integRes,
        audRes
      ] = await Promise.all([
        fetch('/api/workspace', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/catalogue', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/reviews', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/knowledge', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/conversations', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/enquiries', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/crm', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/proposals', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/projects', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/tasks', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/workflows/executions', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/assistant', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/approvals', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/integrations', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/audit', { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);

      if (profileRes && profileRes.name) setProfile(profileRes);
      if (Array.isArray(catRes)) setCatalogue(catRes);
      if (Array.isArray(revRes)) setReviews(revRes);
      if (Array.isArray(kbRes)) setKnowledge(kbRes);
      if (Array.isArray(convRes)) {
        const normalized = convRes.map(c => ({
          ...c,
          customerName: c.customerName || 'Customer',
          messages: Array.isArray(c.messages) ? c.messages : []
        }));
        setConversations(normalized);
      }
      if (Array.isArray(enqRes)) setEnquiries(enqRes);
      if (Array.isArray(crmRes)) setCrmContacts(crmRes);
      if (Array.isArray(propRes)) setProposals(propRes);
      if (Array.isArray(projRes)) setProjects(projRes);
      if (Array.isArray(taskRes)) setTasks(taskRes);
      if (Array.isArray(wfRes)) setWorkflowExecutions(wfRes);
      if (astRes && astRes.name) setAssistant(astRes);
      if (Array.isArray(apprRes)) setApprovals(apprRes);
      if (Array.isArray(integRes)) setIntegrations(integRes);
      if (Array.isArray(audRes)) setAuditEvents(audRes);
    } catch (err: any) {
      console.error('Error loading workspace data:', err);
      setDataLoadError(err?.message || 'Unable to synchronize workspace operational data.');
    } finally {
      setIsDataLoading(false);
    }
  }, [sessionToken, currentWorkspace?.id]);

  // Initial authentication check & workspace discovery
  useEffect(() => {
    async function verifyAuth() {
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setCurrentRole(data.role || 'Owner');
          if (Array.isArray(data.workspaces) && data.workspaces.length > 0) {
            setWorkspaces(data.workspaces);
            const active = data.currentWorkspace || data.workspaces[0];
            setCurrentWorkspace(active);
            if (active.profile) setProfile(active.profile);
          }
        }
      } catch (err) {
        console.warn('Initial auth verification fallback:', err);
      } finally {
        loadWorkspaceData();
      }
    }

    verifyAuth();
  }, [sessionToken, loadWorkspaceData]);

  // Handle Switch Workspace
  const handleSelectWorkspace = (ws: Workspace) => {
    setCurrentWorkspace(ws);
    if (ws.profile) {
      setProfile(ws.profile);
    }
    loadWorkspaceData(ws.id);
  };

  // Handle Login Success
  const handleLoginSuccess = (authData: {
    user: UserType;
    token: string;
    workspaces: Workspace[];
    currentWorkspace: Workspace;
    role: WorkspaceRole;
  }) => {
    setSessionToken(authData.token);
    localStorage.setItem('cipher_session_token', authData.token);
    setCurrentUser(authData.user);
    setWorkspaces(authData.workspaces || []);
    setCurrentWorkspace(authData.currentWorkspace);
    setCurrentRole(authData.role);
    if (authData.currentWorkspace?.profile) {
      setProfile(authData.currentWorkspace.profile);
    }
    loadWorkspaceData(authData.currentWorkspace?.id);
  };

  // Handle Sign Out
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: sessionToken })
      });
    } catch (_) {}

    // Reset to demo Sarah Jenkins
    localStorage.removeItem('cipher_session_token');
    setSessionToken(DEFAULT_DEMO_TOKEN);
    setCurrentRole('Owner');
    loadWorkspaceData('ws-maple-and-moss');
  };

  const handleToggleEmergencyStop = async () => {
    const updated = !profile.emergencyStopActive;
    const newProfile = { ...profile, emergencyStopActive: updated };
    setProfile(newProfile);
    await apiFetch('/api/workspace', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProfile)
    });
  };

  const handleUpdateProfile = async (updates: Partial<BusinessProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    await apiFetch('/api/workspace', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProfile)
    });
  };

  const handleAddCatalogueItem = async (item: Omit<CatalogueItem, 'id'>) => {
    const res = await apiFetch('/api/catalogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const created = await res.json();
    setCatalogue(prev => [...prev, created]);
  };

  const handleDeleteCatalogueItem = async (id: string) => {
    await apiFetch(`/api/catalogue/${id}`, { method: 'DELETE' });
    setCatalogue(prev => prev.filter(i => i.id !== id));
  };

  // Detect public storefront access from URL (e.g. /site/:slug or ?site=:slug)
  useEffect(() => {
    const pathname = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const siteSlug = urlParams.get('site') || (pathname.startsWith('/site/') ? pathname.substring(6) : null);

    if (siteSlug) {
      fetch(`/api/public/business/${siteSlug}`)
        .then(r => {
          if (r.ok) return r.json();
          throw new Error('Business website not found or unpublished');
        })
        .then(data => {
          setProfile(data.profile);
          setCatalogue(data.catalogue);
          setReviews(data.reviews);
          setAppMode('published-site');
        })
        .catch(err => {
          console.warn('Could not load public storefront for slug:', siteSlug, err);
        });
    }
  }, []);

  const handleAddEnquiry = async (enquiry: any) => {
    if (appMode === 'published-site' && profile.slug) {
      const res = await fetch(`/api/public/${profile.slug}/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enquiry)
      });
      const created = await res.json();
      setEnquiries(prev => [created, ...prev]);
    } else {
      const res = await apiFetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enquiry)
      });
      const created = await res.json();
      setEnquiries(prev => [created, ...prev]);
    }
  };

  const handleAddReview = async (review: Omit<Review, 'id' | 'date'>) => {
    if (appMode === 'published-site' && profile.slug) {
      const res = await fetch(`/api/public/${profile.slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      });
      const created = await res.json();
      setReviews(prev => [created, ...prev]);
    } else {
      const res = await apiFetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      });
      const created = await res.json();
      setReviews(prev => [created, ...prev]);
    }
  };

  const handleAddResponseToReview = async (id: string, response: string) => {
    const res = await apiFetch(`/api/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessResponse: response })
    });
    const updated = await res.json();
    setReviews(prev => prev.map(r => r.id === id ? updated : r));
  };

  const unreadHandoffCount = (Array.isArray(conversations) ? conversations : []).filter(c => c && c.status === 'Needs human').length;

  return (
    <div className="min-h-screen bg-[#F7F9F6] text-[#27332B] font-['Inter',sans-serif]">
      {profile.emergencyStopActive && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2 z-50 sticky top-0">
          <span className="animate-pulse">⚠️ EMERGENCY STOP ACTIVE:</span>
          <span>All AI-powered customer assistant responses are currently paused. Human support queue remains fully operational.</span>
        </div>
      )}

      {/* Role-based Banner if viewing as Client */}
      {currentRole === 'Client' && appMode === 'dashboard' && (
        <div className="bg-amber-500 text-amber-950 px-4 py-1.5 text-center text-xs font-semibold flex items-center justify-center gap-2 z-40 sticky top-0">
          <span>Client Portal Mode: Logged in as Client ({currentUser.name}). Viewing active projects, proposals, and collaborative milestones.</span>
        </div>
      )}

      {/* Auth & Identity Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        currentRole={currentRole}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {appMode === 'published-site' ? (
        <PublicBusinessSite
          profile={profile}
          catalogue={catalogue}
          reviews={reviews}
          onBackToCommand={() => setAppMode('dashboard')}
          onAddEnquiry={handleAddEnquiry}
          onAddReview={handleAddReview}
        />
      ) : appMode === 'wizard' ? (
        <BusinessRegistrationWizard
          onCompleteRegistration={async (newProf) => {
            try {
              // Create new tenant workspace on backend
              const wsRes = await apiFetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: newProf.name,
                  businessType: newProf.type,
                  description: newProf.description
                })
              });

              if (wsRes.ok) {
                const { workspace: newWs } = await wsRes.json();
                const fullProfile = { ...newProf, workspaceId: newWs.id };
                setProfile(fullProfile);

                // Update workspace profile on server
                await fetch('/api/workspace', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`,
                    'x-workspace-id': newWs.id
                  },
                  body: JSON.stringify(fullProfile)
                });

                setWorkspaces(prev => [...prev, newWs]);
                setCurrentWorkspace(newWs);
                loadWorkspaceData(newWs.id);
              } else {
                setProfile(newProf);
              }
            } catch (err) {
              console.error('Failed to create workspace on server:', err);
              setProfile(newProf);
            }
            setAppMode('dashboard');
          }}
          onCancel={() => setAppMode('dashboard')}
        />
      ) : appMode === 'public' ? (
        <div className="min-h-screen flex flex-col">
          <Navbar
            currentView={currentView}
            setCurrentView={setCurrentView}
            onOpenDemo={() => setAppMode('dashboard')}
          />
          <main className="flex-1">
            {currentView === 'landing' && <LandingPage setCurrentView={setCurrentView} onOpenDemo={() => setAppMode('dashboard')} />}
            {currentView === 'features' && <ProductFeaturesPage onOpenDemo={() => setAppMode('dashboard')} />}
            {currentView === 'interactive-demo' && <InteractiveDemoPage onOpenDemo={() => setAppMode('dashboard')} />}
            {currentView === 'how-it-works' && <HowItWorksPage onOpenDemo={() => setAppMode('dashboard')} />}
            {currentView === 'privacy' && <PrivacyPage />}
          </main>
          <CustomerChatWidget businessName={profile.name} />
        </div>
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onReturnToWebsite={() => setAppMode('published-site')}
            onLaunchWizard={() => setAppMode('wizard')}
            unreadHandoffCount={unreadHandoffCount}
            currentUser={currentUser}
            currentRole={currentRole}
            onOpenAuthModal={() => setAuthModalOpen(true)}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header
              profile={profile}
              workspaces={workspaces}
              currentWorkspace={currentWorkspace}
              onSelectWorkspace={handleSelectWorkspace}
              currentUser={currentUser}
              currentRole={currentRole}
              onOpenAuthModal={() => setAuthModalOpen(true)}
              onToggleEmergencyStop={handleToggleEmergencyStop}
              unreadCount={unreadHandoffCount}
              onLaunchNewWorkspace={() => setAppMode('wizard')}
            />
            <main className="flex-1 overflow-y-auto bg-[#F7F9F6] relative">
              <CipherWatermarkBackground />
              <div className="relative z-10 flex flex-col min-h-full">
                {/* If Client role is active and user is on overview or crm, render ClientPortalTab for them */}
                {currentRole === 'Client' && (activeTab === 'overview' || activeTab === 'crm' || activeTab === 'projects') ? (
                  <ClientPortalTab projects={projects} proposals={proposals} />
                ) : (
                  <>
                  {activeTab === 'overview' && (
                    <OverviewTab
                      conversations={conversations}
                      enquiries={enquiries}
                      knowledge={knowledge}
                      approvals={approvals}
                      assistant={assistant}
                      setActiveTab={setActiveTab}
                      isLoading={isDataLoading}
                      loadError={dataLoadError}
                      onRetry={() => loadWorkspaceData()}
                    />
                  )}
                  {activeTab === 'conversations' && (
                    <ConversationsTab
                      conversations={conversations}
                      onUpdateConversation={(id, updates) => setConversations(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))}
                      onAddMessage={async (convId, msg) => {
                        await apiFetch(`/api/conversations/${convId}/messages`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(msg)
                        });
                        const res = await apiFetch('/api/conversations');
                        const data = await res.json();
                        setConversations(data);
                      }}
                    />
                  )}
                  {activeTab === 'catalogue' && (
                    <CatalogueTab
                      items={catalogue}
                      onAddItem={handleAddCatalogueItem}
                      onDeleteItem={handleDeleteCatalogueItem}
                    />
                  )}
                  {activeTab === 'reviews' && (
                    <ReviewsTab
                      reviews={reviews}
                      onUpdateReviewStatus={(id, status) => setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r))}
                      onAddResponse={handleAddResponseToReview}
                    />
                  )}
                  {activeTab === 'crm' && (
                    <CrmTab
                      contacts={crmContacts}
                      onAddContact={(c) => setCrmContacts(prev => [{ ...c, id: `crm-${Date.now()}`, lastInteraction: 'Just now' }, ...prev])}
                      onUpdateContact={(id, u) => setCrmContacts(prev => prev.map(c => c.id === id ? { ...c, ...u } : c))}
                    />
                  )}
                  {activeTab === 'proposals' && (
                    <ProposalsTab
                      proposals={proposals}
                      onAddProposal={(p) => setProposals(prev => [{ ...p, id: `prop-${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] }, ...prev])}
                      onUpdateProposal={(id, u) => setProposals(prev => prev.map(p => p.id === id ? { ...p, ...u } : p))}
                    />
                  )}
                  {activeTab === 'projects' && (
                    <ProjectsTasksTab
                      projects={projects}
                      tasks={tasks}
                      onAddTask={(t) => setTasks(prev => [{ ...t, id: `task-${Date.now()}` }, ...prev])}
                      onUpdateTaskStatus={(id, s) => setTasks(prev => prev.map(t => t.id === id ? { ...t, status: s } : t))}
                    />
                  )}
                  {activeTab === 'knowledge' && (
                    <KnowledgeTab
                      knowledge={knowledge}
                      onAddEntry={async (e) => {
                        const res = await apiFetch('/api/knowledge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
                        const created = await res.json();
                        setKnowledge(prev => [created, ...prev]);
                      }}
                      onUpdateEntry={(id, u) => setKnowledge(prev => prev.map(k => k.id === id ? { ...k, ...u } : k))}
                      onDeleteEntry={(id) => setKnowledge(prev => prev.filter(k => k.id !== id))}
                    />
                  )}
                  {activeTab === 'ai-agents' && <AiAgentsTab />}
                  {activeTab === 'flows' && (
                    <FlowEngineTab
                      executions={workflowExecutions}
                      onTriggerExecution={(e) => setWorkflowExecutions(prev => [{ ...e, id: `wf-${Date.now()}`, executedAt: new Date().toLocaleString() }, ...prev])}
                    />
                  )}
                  {activeTab === 'approvals' && (
                    <ApprovalsTab
                      approvals={approvals}
                      onResolveApproval={(id, decision) => setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: decision } : a))}
                    />
                  )}
                  {activeTab === 'insights' && <InsightsTab auditEvents={auditEvents} />}
                  {activeTab === 'settings' && (
                    <SettingsTab
                      profile={profile}
                      onUpdateProfile={handleUpdateProfile}
                      integrations={integrations}
                      onUpdateIntegration={(id, st) => setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: st } : i))}
                      apiFetch={apiFetch}
                      currentRole={currentRole}
                      onPreviewWebsite={() => setAppMode('published-site')}
                    />
                  )}
                </>
              )}
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Save,
  Globe,
  Sparkles,
  ExternalLink,
  Eye,
  Check,
  AlertTriangle,
  RefreshCw,
  FileText
} from 'lucide-react';
import { BusinessProfile, Integration, WebsiteDraft, WorkspaceRole } from '../../types';

interface SettingsTabProps {
  profile: BusinessProfile;
  onUpdateProfile: (updates: Partial<BusinessProfile>) => void;
  integrations: Integration[];
  onUpdateIntegration: (id: string, status: Integration['status']) => void;
  apiFetch?: (url: string, init?: RequestInit) => Promise<Response>;
  currentRole?: WorkspaceRole;
  onPreviewWebsite?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  profile,
  onUpdateProfile,
  integrations,
  onUpdateIntegration,
  apiFetch,
  currentRole = 'Owner',
  onPreviewWebsite
}) => {
  const [name, setName] = useState(profile.name);
  const [type, setType] = useState(profile.type);
  const [desc, setDesc] = useState(profile.description);
  const [email, setEmail] = useState(profile.contactEmail);
  const [phone, setPhone] = useState(profile.contactPhone);
  const [hours, setHours] = useState(profile.businessHours);
  const [location, setLocation] = useState(profile.location || 'Local & Online');
  const [tagline, setTagline] = useState(profile.tagline || '');
  const [saved, setSaved] = useState(false);

  // Website Lifecycle State
  const [draft, setDraft] = useState<WebsiteDraft | null>(profile.websiteDraft || null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lifecycleFeedback, setLifecycleFeedback] = useState<string | null>(null);

  // Edit Draft Form State
  const [editDraftOpen, setEditDraftOpen] = useState(false);
  const [draftHeadline, setDraftHeadline] = useState('');
  const [draftTagline, setDraftTagline] = useState('');
  const [draftAbout, setDraftAbout] = useState('');

  // Fetch current draft on mount
  useEffect(() => {
    if (apiFetch) {
      apiFetch('/api/website/draft')
        .then(res => res.json())
        .then(data => {
          if (data) {
            setDraft(data);
            setDraftHeadline(data.heroHeadline || profile.name);
            setDraftTagline(data.tagline || profile.tagline || '');
            setDraftAbout(data.aboutText || profile.description);
          }
        })
        .catch(err => console.warn('Could not fetch website draft:', err));
    }
  }, [apiFetch, profile.name, profile.tagline, profile.description]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      type,
      description: desc,
      contactEmail: email,
      contactPhone: phone,
      businessHours: hours,
      location,
      tagline
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleGenerateDraft = async () => {
    if (!apiFetch) return;
    setIsGeneratingDraft(true);
    setLifecycleFeedback(null);
    try {
      const res = await apiFetch('/api/website/draft/generate', { method: 'POST' });
      const newDraft = await res.json();
      setDraft(newDraft);
      setDraftHeadline(newDraft.heroHeadline);
      setDraftTagline(newDraft.tagline);
      setDraftAbout(newDraft.aboutText);
      setLifecycleFeedback('New AI website draft generated and grounded in your approved catalogue facts.');
      setTimeout(() => setLifecycleFeedback(null), 4000);
    } catch (err: any) {
      setLifecycleFeedback(`Failed to generate draft: ${err.message}`);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleSaveDraftEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiFetch) return;
    try {
      const res = await apiFetch('/api/website/draft', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroHeadline: draftHeadline,
          tagline: draftTagline,
          aboutText: draftAbout
        })
      });
      const updated = await res.json();
      setDraft(updated);
      setEditDraftOpen(false);
      setLifecycleFeedback('Draft changes saved successfully.');
      setTimeout(() => setLifecycleFeedback(null), 3000);
    } catch (err: any) {
      setLifecycleFeedback(`Failed to update draft: ${err.message}`);
    }
  };

  const handleApproveDraft = async () => {
    if (!apiFetch) return;
    try {
      const res = await apiFetch('/api/website/draft/approve', { method: 'POST' });
      const data = await res.json();
      if (data.draft) {
        setDraft(data.draft);
        setLifecycleFeedback('Draft approved for publication by authorized owner.');
        setTimeout(() => setLifecycleFeedback(null), 3000);
      }
    } catch (err: any) {
      setLifecycleFeedback(`Failed to approve draft: ${err.message}`);
    }
  };

  const handlePublish = async () => {
    if (!apiFetch) return;
    setIsPublishing(true);
    try {
      const res = await apiFetch('/api/website/publish', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onUpdateProfile({ published: true, ...data.profile });
        if (draft) setDraft({ ...draft, status: 'Published' });
        setLifecycleFeedback('Website published successfully! Public visitors can now access your storefront.');
        setTimeout(() => setLifecycleFeedback(null), 4000);
      }
    } catch (err: any) {
      setLifecycleFeedback(`Failed to publish: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!apiFetch) return;
    setIsPublishing(true);
    try {
      const res = await apiFetch('/api/website/unpublish', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onUpdateProfile({ published: false });
        if (draft) setDraft({ ...draft, status: 'Draft' });
        setLifecycleFeedback('Website unpublished. Public storefront is deactivated while all private workspace records remain intact.');
        setTimeout(() => setLifecycleFeedback(null), 4000);
      }
    } catch (err: any) {
      setLifecycleFeedback(`Failed to unpublish: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <div>
        <h2 className="text-2xl font-bold text-[#26372D]">Settings & Storefront Operations</h2>
        <p className="text-xs text-[#66716A]">Manage workspace identity, AI website draft approval, public publication, and integrations.</p>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Workspace profile saved successfully.</span>
        </div>
      )}

      {lifecycleFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-2 text-sm shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{lifecycleFeedback}</span>
        </div>
      )}

      {/* Website Lifecycle & Storefront Publication Section */}
      <div className="bg-white rounded-3xl p-8 border border-[#DCE2DC] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE2DC] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#497A58]" />
              <h3 className="text-lg font-bold text-[#26372D]">Public Storefront & Website Lifecycle</h3>
            </div>
            <p className="text-xs text-[#66716A]">
              Live URL slug: <code className="bg-[#F0F2EF] px-2 py-0.5 rounded text-[#26372D] font-mono">/site/{profile.slug}</code>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
              profile.published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${profile.published ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'}`} />
              {profile.published ? 'Live & Published' : 'Unpublished (Offline)'}
            </span>
            {onPreviewWebsite && (
              <button
                type="button"
                onClick={onPreviewWebsite}
                className="bg-[#F0F2EF] hover:bg-[#E5EDE5] text-[#26372D] text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 border border-[#DCE2DC]"
              >
                <Eye className="w-3.5 h-3.5 text-[#497A58]" />
                <span>Preview Storefront</span>
              </button>
            )}
          </div>
        </div>

        {/* Current Website Draft Card */}
        <div className="bg-[#F7F9F6] p-6 rounded-2xl border border-[#DCE2DC] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#66716A]">Website Content Draft</span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                  draft?.status === 'Published' ? 'bg-emerald-100 text-emerald-800' :
                  draft?.status === 'Approved' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  Status: {draft?.status || 'Draft'}
                </span>
              </div>
              <p className="text-xs text-[#66716A] mt-1">
                Grounded in your business facts and approved catalogue items. Invented claims are strictly prevented.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={isGeneratingDraft}
                className="bg-white hover:bg-[#F0F2EF] text-[#26372D] text-xs font-semibold px-3.5 py-2 rounded-xl transition-all border border-[#DCE2DC] flex items-center gap-1.5 shadow-sm"
              >
                {isGeneratingDraft ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#497A58]" /> : <Sparkles className="w-3.5 h-3.5 text-[#497A58]" />}
                <span>{isGeneratingDraft ? 'Generating...' : 'Generate AI Draft'}</span>
              </button>
              <button
                type="button"
                onClick={() => setEditDraftOpen(!editDraftOpen)}
                className="bg-white hover:bg-[#F0F2EF] text-[#26372D] text-xs font-semibold px-3.5 py-2 rounded-xl transition-all border border-[#DCE2DC] flex items-center gap-1.5 shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-[#497A58]" />
                <span>{editDraftOpen ? 'Close Editor' : 'Review & Edit'}</span>
              </button>
            </div>
          </div>

          {/* Draft Preview Snippet */}
          <div className="bg-white p-4 rounded-xl border border-[#DCE2DC] space-y-2 text-xs">
            <p><strong className="text-[#26372D]">Hero Headline:</strong> {draft?.heroHeadline || profile.name}</p>
            <p><strong className="text-[#26372D]">Tagline:</strong> {draft?.tagline || profile.tagline || 'Crafted with care.'}</p>
            <p><strong className="text-[#26372D]">About Text:</strong> {draft?.aboutText || profile.description}</p>
          </div>

          {/* Edit Draft Form if expanded */}
          {editDraftOpen && (
            <form onSubmit={handleSaveDraftEdits} className="bg-white p-5 rounded-xl border border-[#DCE2DC] space-y-4">
              <h4 className="text-xs font-bold text-[#26372D] uppercase tracking-wider">Edit Draft Copy Before Approval</h4>
              <div>
                <label className="block text-[11px] font-semibold text-[#66716A] mb-1">Hero Headline</label>
                <input
                  type="text"
                  value={draftHeadline}
                  onChange={(e) => setDraftHeadline(e.target.value)}
                  className="w-full text-xs bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#66716A] mb-1">Tagline</label>
                <input
                  type="text"
                  value={draftTagline}
                  onChange={(e) => setDraftTagline(e.target.value)}
                  className="w-full text-xs bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#66716A] mb-1">About Text</label>
                <textarea
                  rows={3}
                  value={draftAbout}
                  onChange={(e) => setDraftAbout(e.target.value)}
                  className="w-full text-xs bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditDraftOpen(false)}
                  className="px-4 py-1.5 rounded-xl text-xs bg-[#F0F2EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#497A58] text-white"
                >
                  Save Draft Changes
                </button>
              </div>
            </form>
          )}

          {/* Approval & Publication Action Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#DCE2DC]">
            <div className="flex items-center gap-2">
              {draft?.status !== 'Approved' && draft?.status !== 'Published' && (
                <button
                  type="button"
                  onClick={handleApproveDraft}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve Draft</span>
                </button>
              )}
              {draft?.status === 'Approved' && (
                <span className="text-xs text-blue-700 font-medium flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                  <Check className="w-3.5 h-3.5 text-blue-600" />
                  <span>Draft Approved by {draft.approvedBy || 'Owner'}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!profile.published ? (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="bg-[#497A58] hover:bg-[#385f44] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow flex items-center gap-2"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{isPublishing ? 'Publishing...' : 'Publish Website to Live URL'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleUnpublish}
                  disabled={isPublishing}
                  className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all border border-red-200 flex items-center gap-1.5"
                >
                  <span>{isPublishing ? 'Updating...' : 'Unpublish / Deactivate Website'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-3xl p-8 border border-[#DCE2DC] shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-[#26372D]">Business Workspace Profile</h3>
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-[#66716A] mb-1">Business Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#66716A] mb-1">Business Type</label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-[#66716A] mb-1">Tagline / Motto</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Handcrafted Goods for Mindful Living"
                className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#66716A] mb-1">Location / Service Area</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Seattle, WA • Pacific Northwest"
                className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#66716A] mb-1">Description</label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-[#66716A] mb-1">Support Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#66716A] mb-1">Support Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#66716A] mb-1">Business Hours</label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-[#497A58] hover:bg-[#385f44] text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all shadow flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Integrations Status */}
      <div className="bg-white rounded-3xl p-8 border border-[#DCE2DC] shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#26372D]">Integrations & Commercial Controls</h3>
          <p className="text-xs text-[#66716A] mt-1">
            Real integrations require validated provider credentials. In simulated or test modes, messages and transactions are safely recorded locally without external dispatch.
          </p>
        </div>
        <div className="space-y-4">
          {integrations.map((int) => (
            <div key={int.id} className="p-4 rounded-2xl bg-[#F7F9F6] border border-[#DCE2DC] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-[#26372D]">{int.name}</h4>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    int.implementationStatus === 'implemented_and_verified' ? 'bg-emerald-100 text-emerald-800' :
                    int.implementationStatus === 'configured_unverified' ? 'bg-blue-100 text-blue-800' :
                    int.implementationStatus === 'simulated' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {int.implementationStatus === 'implemented_and_verified' ? 'Verified Live' :
                     int.implementationStatus === 'configured_unverified' ? 'Configured (Unverified)' :
                     int.implementationStatus === 'simulated' ? 'Simulated' :
                     'Not Implemented'}
                  </span>
                </div>
                <p className="text-xs text-[#66716A] mt-0.5">{int.description} • Last checked: {int.lastChecked || 'Never'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  int.status === 'Connected and verified' ? 'bg-emerald-100 text-emerald-800' :
                  int.status === 'Test mode' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                }`}>
                  {int.status}
                </span>
                <select
                  value={int.status}
                  onChange={(e) => onUpdateIntegration(int.id, e.target.value as Integration['status'])}
                  className="text-xs bg-white border border-[#DCE2DC] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                >
                  <option value="Not configured">Not configured</option>
                  <option value="Needs credentials">Needs credentials</option>
                  <option value="Test mode">Test mode</option>
                  <option value="Connected and verified">Connected and verified</option>
                  <option value="Error">Error</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

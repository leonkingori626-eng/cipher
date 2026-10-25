import React from 'react';
import {
  MessageSquare,
  Users,
  BookOpen,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Bot
} from 'lucide-react';
import { Conversation, CustomerEnquiry, KnowledgeEntry, ApprovalRequest, AssistantConfig } from '../../types';

interface OverviewTabProps {
  conversations: Conversation[];
  enquiries: CustomerEnquiry[];
  knowledge: KnowledgeEntry[];
  approvals: ApprovalRequest[];
  assistant: AssistantConfig;
  setActiveTab: (tab: string) => void;
  isLoading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  conversations = [],
  enquiries = [],
  knowledge = [],
  approvals = [],
  assistant,
  setActiveTab,
  isLoading = false,
  loadError = null,
  onRetry
}) => {
  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const safeEnquiries = Array.isArray(enquiries) ? enquiries : [];
  const safeKnowledge = Array.isArray(knowledge) ? knowledge : [];
  const safeApprovals = Array.isArray(approvals) ? approvals : [];

  const needsHumanCount = safeConversations.filter(c => c?.status === 'Needs human').length;
  const draftKnowledgeCount = safeKnowledge.filter(k => k?.status === 'Draft').length;
  const pendingApprovalsCount = safeApprovals.filter(a => a?.status === 'Pending').length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Explicit Error State */}
      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between text-sm text-red-800 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load live dashboard data</p>
              <p className="text-xs text-red-700">{loadError}</p>
            </div>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Loading State Banner */}
      {isLoading && !loadError && (
        <div className="bg-[#E5EDE5] border border-[#DCE2DC] rounded-2xl p-3 flex items-center gap-2 text-xs text-[#26372D] animate-pulse">
          <Clock className="w-4 h-4 text-[#497A58]" />
          <span>Synchronizing workspace operational data...</span>
        </div>
      )}

      {/* Friendly Welcome Banner */}
      <div className="bg-[#26372D] text-white p-8 rounded-3xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#497A58] text-emerald-100 px-3.5 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Good morning, Sarah</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">What would you like to take care of today?</h2>
          <p className="text-emerald-200 text-sm max-w-2xl">
            CIPHER Assistant is actively monitoring customer chats and guarding against unsupported claims.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setActiveTab('conversations')}
            className="bg-[#497A58] hover:bg-[#385f44] text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Review Handoff Queue ({needsHumanCount})</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div 
          onClick={() => setActiveTab('conversations')}
          className="bg-white p-6 rounded-2xl border border-[#DCE2DC] shadow-sm space-y-3 cursor-pointer hover:border-[#497A58] transition-all"
        >
          <div className="flex items-center justify-between text-[#66716A]">
            <span className="text-xs font-semibold uppercase tracking-wider">Conversations Needing Attention</span>
            <MessageSquare className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-[#26372D]">{needsHumanCount}</p>
          <p className="text-xs text-[#66716A]">Out of {safeConversations.length} active sessions</p>
        </div>

        <div 
          onClick={() => setActiveTab('enquiries')}
          className="bg-white p-6 rounded-2xl border border-[#DCE2DC] shadow-sm space-y-3 cursor-pointer hover:border-[#497A58] transition-all"
        >
          <div className="flex items-center justify-between text-[#66716A]">
            <span className="text-xs font-semibold uppercase tracking-wider">Customer Enquiries</span>
            <Users className="w-5 h-5 text-[#497A58]" />
          </div>
          <p className="text-3xl font-bold text-[#26372D]">{safeEnquiries.length}</p>
          <p className="text-xs text-[#66716A]">Lead pipeline active</p>
        </div>

        <div 
          onClick={() => setActiveTab('knowledge')}
          className="bg-white p-6 rounded-2xl border border-[#DCE2DC] shadow-sm space-y-3 cursor-pointer hover:border-[#497A58] transition-all"
        >
          <div className="flex items-center justify-between text-[#66716A]">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Knowledge</span>
            <BookOpen className="w-5 h-5 text-[#497A58]" />
          </div>
          <p className="text-3xl font-bold text-[#26372D]">{safeKnowledge.filter(k => k?.status === 'Approved').length}</p>
          <p className="text-xs text-[#66716A]">{draftKnowledgeCount} draft item(s) pending</p>
        </div>

        <div 
          onClick={() => setActiveTab('approvals')}
          className="bg-white p-6 rounded-2xl border border-[#DCE2DC] shadow-sm space-y-3 cursor-pointer hover:border-[#497A58] transition-all"
        >
          <div className="flex items-center justify-between text-[#66716A]">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Approvals</span>
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-[#26372D]">{pendingApprovalsCount}</p>
          <p className="text-xs text-[#66716A]">Required before publishing</p>
        </div>
      </div>

      {/* Two Column Layout: Handoff Queue & Assistant Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Handoff Queue */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#DCE2DC] p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#26372D] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#497A58]" />
              <span>Conversations Needing a Human Touch</span>
            </h3>
            <button
              onClick={() => setActiveTab('conversations')}
              className="text-xs font-semibold text-[#497A58] hover:underline"
            >
              View all
            </button>
          </div>

          <div className="space-y-4">
            {safeConversations
              .filter(c => c?.status === 'Needs human')
              .map((conv) => {
                const msgs = Array.isArray(conv.messages) ? conv.messages : [];
                const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
                return (
                  <div key={conv.id} className="p-4 rounded-2xl bg-[#F7F9F6] border border-[#DCE2DC] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-sm text-[#26372D]">{conv.customerName || 'Customer'}</h4>
                        <p className="text-xs text-[#66716A]">{conv.customerEmail || 'Web Visitor'} • Channel: {conv.channel || 'Web Chat'}</p>
                      </div>
                      <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium">
                        Needs human
                      </span>
                    </div>
                    <p className="text-xs text-[#27332B] italic bg-white p-3 rounded-xl border border-[#DCE2DC]">
                      "{lastMsg?.text || 'No recent messages'}"
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-[#66716A]">Assigned to: {conv.assignedOperator || 'Unassigned'}</span>
                      <button
                        onClick={() => setActiveTab('conversations')}
                        className="bg-[#497A58] hover:bg-[#385f44] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                      >
                        Take over conversation
                      </button>
                    </div>
                  </div>
                );
              })}
            {safeConversations.filter(c => c?.status === 'Needs human').length === 0 && (
              <div className="text-center py-12 text-[#66716A] space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#497A58] mx-auto opacity-70" />
                <p className="text-sm font-medium">All conversations currently resolved or handled by AI.</p>
              </div>
            )}
          </div>
        </div>

        {/* Assistant Status Card */}
        <div className="bg-white rounded-3xl border border-[#DCE2DC] p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-[#26372D] flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#497A58]" />
            <span>Assistant Status</span>
          </h3>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-[#DCE2DC]">
              <span className="text-[#66716A]">Assistant Name</span>
              <span className="font-semibold text-[#27332B]">{assistant?.name || 'Cipher Assistant'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#DCE2DC]">
              <span className="text-[#66716A]">Model</span>
              <span className="font-mono text-xs font-semibold text-[#27332B] bg-[#F0F2EF] px-2 py-1 rounded">{assistant?.model || 'gemini-2.5-flash'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#DCE2DC]">
              <span className="text-[#66716A]">Status</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Active & Grounded
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[#66716A]">Last Security Test</span>
              <span className="text-xs text-[#27332B] text-right font-medium">Passed all 14 assertions</span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('assistants')}
            className="w-full bg-[#F0F2EF] hover:bg-[#E5EDE5] text-[#27332B] text-xs font-semibold py-3 rounded-xl transition-all border border-[#DCE2DC]"
          >
            Configure Assistant Settings
          </button>
        </div>
      </div>
    </div>
  );
};

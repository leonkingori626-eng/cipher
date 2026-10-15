import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  BookOpen,
  Bot,
  Workflow,
  ShieldAlert,
  BarChart3,
  Settings,
  ArrowLeft,
  Shield,
  Package,
  Star,
  Globe,
  PlusCircle,
  FileText,
  Briefcase,
  KeyRound,
  UserCircle
} from 'lucide-react';
import { User as UserType, WorkspaceRole } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onReturnToWebsite: () => void;
  onLaunchWizard: () => void;
  unreadHandoffCount: number;
  currentUser?: UserType | null;
  currentRole?: WorkspaceRole;
  onOpenAuthModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onReturnToWebsite,
  onLaunchWizard,
  unreadHandoffCount,
  currentUser,
  currentRole = 'Owner',
  onOpenAuthModal
}) => {
  const navItems = [
    { id: 'overview', label: 'Command Overview', icon: LayoutDashboard },
    { id: 'conversations', label: 'Conversations & Desk', icon: MessageSquare, badge: unreadHandoffCount > 0 ? unreadHandoffCount : null },
    { id: 'catalogue', label: 'Catalogue & Pricing', icon: Package },
    { id: 'reviews', label: 'Trust & Reviews', icon: Star },
    { id: 'crm', label: 'CRM & Clients', icon: Users },
    { id: 'proposals', label: 'Sales & Proposals', icon: FileText },
    { id: 'projects', label: 'Projects & Tasks', icon: Briefcase },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'ai-agents', label: 'CIPHER Intelligence', icon: Bot },
    { id: 'flows', label: 'CIPHER Flow Engine', icon: Workflow },
    { id: 'approvals', label: 'Approvals & Governance', icon: ShieldAlert },
    { id: 'insights', label: 'Analytics & Insights', icon: BarChart3 },
    { id: 'settings', label: 'Settings & Integrations', icon: Settings },
  ];

  return (
    <aside className="w-68 bg-[#26372D] text-white flex flex-col h-screen shrink-0 border-r border-[#1a261f]">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#354b3d] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#497A58] flex items-center justify-center text-white font-bold">
            <Shield className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight">CIPHER Command</h1>
            <span className="block text-[10px] text-emerald-300 font-medium">Multi-Business Ecosystem</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 pt-4 flex gap-2">
        <button
          onClick={onLaunchWizard}
          className="flex-1 bg-[#497A58] hover:bg-[#385f44] text-white text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Business</span>
        </button>
        <button
          onClick={onReturnToWebsite}
          className="bg-[#32483a] hover:bg-[#3b5545] text-white text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5"
          title="View Published Website"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Site</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#497A58] text-white shadow-sm'
                  : 'text-emerald-100 hover:bg-[#32483a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-300'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge !== null && (
                <span className="bg-amber-400 text-amber-950 font-bold text-[11px] px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom User Role & Switcher Footer */}
      {currentUser && (
        <div className="p-3.5 border-t border-[#354b3d] bg-[#1f2d24]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#497A58] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white truncate">{currentUser.name}</span>
                  <span className="bg-[#497A58]/50 text-emerald-200 text-[9px] px-1.5 py-0.2 rounded font-medium">
                    {currentRole}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-300 block truncate">{currentUser.email}</span>
              </div>
            </div>
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-[#32483a] rounded-lg transition-colors shrink-0"
                title="Switch Account / Role"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

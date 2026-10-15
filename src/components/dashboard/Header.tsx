import React, { useState } from 'react';
import {
  ShieldAlert,
  ChevronDown,
  Building2,
  Check,
  Plus,
  UserCircle,
  Shield,
  KeyRound,
  LogOut,
  Sparkles
} from 'lucide-react';
import { BusinessProfile, Workspace, User as UserType, WorkspaceRole } from '../../types';

interface HeaderProps {
  profile: BusinessProfile;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  onSelectWorkspace: (ws: Workspace) => void;
  currentUser: UserType | null;
  currentRole: WorkspaceRole;
  onOpenAuthModal: () => void;
  onToggleEmergencyStop: () => void;
  unreadCount: number;
  onLaunchNewWorkspace: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  currentUser,
  currentRole,
  onOpenAuthModal,
  onToggleEmergencyStop,
  unreadCount,
  onLaunchNewWorkspace
}) => {
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const roleColors: Record<WorkspaceRole, { bg: string; text: string }> = {
    Owner: { bg: 'bg-purple-100', text: 'text-purple-800' },
    Operator: { bg: 'bg-blue-100', text: 'text-blue-800' },
    Client: { bg: 'bg-amber-100', text: 'text-amber-800' }
  };

  return (
    <header className="bg-white border-b border-[#DCE2DC] h-20 px-8 flex items-center justify-between z-30 relative">
      {/* Left: Workspace Selector Dropdown */}
      <div className="flex items-center gap-4 relative">
        <div className="relative">
          <button
            onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
            className="flex items-center gap-2.5 text-left p-2 -ml-2 rounded-2xl hover:bg-[#F7F9F6] border border-transparent hover:border-[#DCE2DC] transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E5EDE5] border border-[#DCE2DC] flex items-center justify-center text-[#497A58]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#26372D] tracking-tight">{profile.name}</h2>
                <span className="bg-[#E5EDE5] text-[#497A58] text-[10px] px-2 py-0.5 rounded-full font-semibold border border-[#DCE2DC]">
                  Live
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#66716A]" />
              </div>
              <p className="text-[11px] text-[#66716A]">
                Slug: <span className="font-mono text-[#497A58]">/{profile.slug}</span> • {profile.businessHours}
              </p>
            </div>
          </button>

          {/* Workspace Dropdown Menu */}
          {wsDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setWsDropdownOpen(false)} />
              <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#DCE2DC] py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-[#DCE2DC] text-[11px] font-semibold text-[#66716A] uppercase tracking-wider">
                  Your Accessible Workspaces
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {workspaces.map((ws) => {
                    const isSelected = ws.id === (currentWorkspace?.id || profile.workspaceId);
                    return (
                      <button
                        key={ws.id}
                        onClick={() => {
                          onSelectWorkspace(ws);
                          setWsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-[#E5EDE5] text-[#26372D] font-semibold' : 'text-[#26372D] hover:bg-[#F7F9F6]'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="block truncate">{ws.name}</span>
                          <span className="text-[10px] text-[#66716A] font-mono">/{ws.slug}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#497A58] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <div className="pt-1 border-t border-[#DCE2DC] px-2">
                  <button
                    onClick={() => {
                      setWsDropdownOpen(false);
                      onLaunchNewWorkspace();
                    }}
                    className="w-full mt-1 px-3 py-2 text-xs text-[#497A58] hover:bg-[#E5EDE5] font-semibold rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create / Register New Business</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Emergency Stop Toggle */}
        <button
          onClick={onToggleEmergencyStop}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
            profile.emergencyStopActive
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-[#F0F2EF] hover:bg-red-50 text-[#27332B] hover:text-red-700 border border-[#DCE2DC]'
          }`}
          title="Instantly pause AI-powered customer responses"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{profile.emergencyStopActive ? 'AI RESPONSES PAUSED (Emergency Stop)' : 'Emergency Stop AI'}</span>
        </button>

        {/* User Identity & Role Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-3 pl-4 border-l border-[#DCE2DC] py-1 hover:opacity-90 transition-opacity"
          >
            <div className="w-9 h-9 rounded-full bg-[#E5EDE5] flex items-center justify-center text-[#497A58] font-bold border border-[#DCE2DC]">
              <UserCircle className="w-6 h-6" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-[#27332B]">{currentUser?.name || 'Sarah Jenkins'}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${roleColors[currentRole]?.bg || 'bg-purple-100'} ${roleColors[currentRole]?.text || 'text-purple-800'}`}>
                  {currentRole}
                </span>
              </div>
              <p className="text-[11px] text-[#66716A] truncate max-w-[140px]">
                {currentUser?.email || 'sarah.jenkins@mapleandmossgoods.com'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#66716A]" />
          </button>

          {/* User Menu Dropdown */}
          {userDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#DCE2DC] py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-[#DCE2DC]">
                  <p className="text-xs font-bold text-[#26372D]">{currentUser?.name}</p>
                  <p className="text-[11px] text-[#66716A]">{currentUser?.email}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-[10px] text-[#66716A]">Assigned Role:</span>
                    <span className="text-[10px] font-bold text-[#497A58]">{currentRole}</span>
                  </div>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenAuthModal();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#26372D] hover:bg-[#F7F9F6] rounded-xl flex items-center gap-2"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#497A58]" />
                    <span>Switch Role / Sign In</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLaunchNewWorkspace();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#26372D] hover:bg-[#F7F9F6] rounded-xl flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#497A58]" />
                    <span>New Business Setup Wizard</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

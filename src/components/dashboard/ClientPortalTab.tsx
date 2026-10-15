import React from 'react';
import { Users, Shield, CheckCircle2, FileText, Calendar } from 'lucide-react';
import { Project, Proposal } from '../../types';

interface ClientPortalTabProps {
  projects: Project[];
  proposals: Proposal[];
}

export const ClientPortalTab: React.FC<ClientPortalTabProps> = ({ projects, proposals }) => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#26372D]">CIPHER Connect — Client Portal Foundation</h2>
        <p className="text-xs text-[#66716A]">Secure client collaboration portal for project milestones, proposals, and support requests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-[#DCE2DC] space-y-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#26372D]">Client Project Milestones</h3>
          <div className="space-y-4">
            {projects.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-[#F7F9F6] border border-[#DCE2DC] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#27332B]">{p.name}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">{p.status}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#66716A]">
                  <span>Client: {p.clientName}</span>
                  <span>Due: {p.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-[#DCE2DC] space-y-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#26372D]">Active Client Proposals</h3>
          <div className="space-y-4">
            {proposals.map((prop) => (
              <div key={prop.id} className="p-4 rounded-2xl bg-[#F7F9F6] border border-[#DCE2DC] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#27332B]">{prop.title}</span>
                  <span className="text-xs bg-[#E5EDE5] text-[#497A58] px-2 py-0.5 rounded-full font-semibold">${prop.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#66716A]">
                  <span>Status: {prop.status}</span>
                  <span>Valid until: {prop.validUntil}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

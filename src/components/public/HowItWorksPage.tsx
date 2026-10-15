import React from 'react';
import { Shield, CheckCircle2, Cpu, Users, Lock, ArrowRight } from 'lucide-react';

interface HowItWorksPageProps {
  onOpenDemo: () => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onOpenDemo }) => {
  return (
    <div className="bg-[#F7F9F6] text-[#27332B] min-h-screen py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="bg-[#E5EDE5] text-[#26372D] px-4 py-1.5 rounded-full text-xs font-semibold border border-[#DCE2DC]">
          System Architecture & Flow
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-[#26372D]">
          How CIPHER balances AI efficiency with human care
        </h1>
        <p className="text-base text-[#66716A]">
          Our human-centred AI architecture ensures that every customer response is grounded in verified business knowledge with strict safety controls.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-[#DCE2DC] shadow-sm space-y-8">
        <h2 className="text-2xl font-bold text-[#26372D]">Support & Handoff Workflow</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-[#F7F9F6] p-6 rounded-2xl border border-[#DCE2DC] space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#497A58] text-white flex items-center justify-center mx-auto font-bold text-sm">1</div>
            <h3 className="font-semibold text-sm text-[#26372D]">Inbound Message</h3>
            <p className="text-xs text-[#66716A]">Visitor sends query through chat widget or email.</p>
          </div>

          <div className="bg-[#F7F9F6] p-6 rounded-2xl border border-[#DCE2DC] space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#497A58] text-white flex items-center justify-center mx-auto font-bold text-sm">2</div>
            <h3 className="font-semibold text-sm text-[#26372D]">Knowledge Check</h3>
            <p className="text-xs text-[#66716A]">System retrieves approved FAQ & validates safety.</p>
          </div>

          <div className="bg-[#F7F9F6] p-6 rounded-2xl border border-[#DCE2DC] space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#497A58] text-white flex items-center justify-center mx-auto font-bold text-sm">3</div>
            <h3 className="font-semibold text-sm text-[#26372D]">AI Response</h3>
            <p className="text-xs text-[#66716A]">Grounded answer provided or handoff triggered.</p>
          </div>

          <div className="bg-[#F7F9F6] p-6 rounded-2xl border border-[#DCE2DC] space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#497A58] text-white flex items-center justify-center mx-auto font-bold text-sm">4</div>
            <h3 className="font-semibold text-sm text-[#26372D]">Human Review</h3>
            <p className="text-xs text-[#66716A]">Operator takes over complex issues in CIPHER Desk.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-[#DCE2DC] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#E5EDE5] flex items-center justify-center text-[#497A58]">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#26372D]">Workspace Isolation & Security</h3>
          <p className="text-sm text-[#66716A] leading-relaxed">
            Every business workspace is strictly isolated. Tenant data and knowledge entries cannot be accessed across workspaces. Prompt injection attempts inside customer messages are blocked by server-side guardrails.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-[#DCE2DC] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#E5EDE5] flex items-center justify-center text-[#497A58]">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#26372D]">Mandatory Operator Approvals</h3>
          <p className="text-sm text-[#66716A] leading-relaxed">
            Consequential changes—such as publishing new knowledge categories or updating assistant security parameters—require explicit human approval and generate permanent audit event records.
          </p>
        </div>
      </div>

      <div className="text-center pt-6">
        <button
          onClick={onOpenDemo}
          className="bg-[#497A58] hover:bg-[#385f44] text-white font-semibold px-8 py-4 rounded-xl shadow transition-all flex items-center gap-2 mx-auto"
        >
          <span>Explore Operator Workspace</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

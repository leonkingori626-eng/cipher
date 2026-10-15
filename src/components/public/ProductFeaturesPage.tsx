import React from 'react';
import { Sparkles, Headphones, BookOpen, Users, Workflow, ShieldCheck, BarChart3, Settings } from 'lucide-react';

interface ProductFeaturesPageProps {
  onOpenDemo: () => void;
}

export const ProductFeaturesPage: React.FC<ProductFeaturesPageProps> = ({ onOpenDemo }) => {
  return (
    <div className="bg-[#F7F9F6] text-[#27332B] min-h-screen py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="bg-[#E5EDE5] text-[#26372D] px-4 py-1.5 rounded-full text-xs font-semibold border border-[#DCE2DC]">
          CIPHER Desk Features
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-[#26372D]">
          Everything your business needs for calm, grounded customer support
        </h1>
        <p className="text-lg text-[#66716A]">
          Designed specifically for independent tutors, small online retailers, and agencies who want AI efficiency without sacrificing personal care.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-[#DCE2DC] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#E5EDE5] flex items-center justify-center text-[#497A58]">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#26372D]">Approved Knowledge Base</h3>
          <p className="text-sm text-[#66716A] leading-relaxed">
            Maintain strict control over what your assistant says. Categorize FAQs, shipping policies, and product details into Draft, Approved, and Archived states. Only approved knowledge is used in customer answers.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-[#DCE2DC] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#E5EDE5] flex items-center justify-center text-[#497A58]">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#26372D]">Grounded AI Support Assistant</h3>
          <p className="text-sm text-[#66716A] leading-relaxed">
            Powered by server-side Google GenAI with strict grounding rules. The assistant answers routine questions with warmth and clarity, and refuses to fabricate policies or prices.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-[#DCE2DC] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#E5EDE5] flex items-center justify-center text-[#497A58]">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#26372D]">Operational Inbox & Handoff Queue</h3>
          <p className="text-sm text-[#66716A] leading-relaxed">
            When a conversation requires personal attention, it flows into a dedicated human handoff queue. Operators can take over, add private notes, reply directly, and resolve issues.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-[#DCE2DC] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#E5EDE5] flex items-center justify-center text-[#497A58]">
            <Workflow className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#26372D]">Enquiry Pipeline & Lead Management</h3>
          <p className="text-sm text-[#66716A] leading-relaxed">
            Organize customer enquiries and sales leads from initial contact to qualified status, tracking business needs, source, and assigned team owners.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-[#DCE2DC] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#E5EDE5] flex items-center justify-center text-[#497A58]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#26372D]">Approvals & Safety Center</h3>
          <p className="text-sm text-[#66716A] leading-relaxed">
            Human approval is mandatory before publishing material changes to customer-facing assistant behavior or sensitive business policies. Includes a global emergency stop toggle.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-[#DCE2DC] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#E5EDE5] flex items-center justify-center text-[#497A58]">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#26372D]">Insights & Audit Trail</h3>
          <p className="text-sm text-[#66716A] leading-relaxed">
            Monitor conversation volume, human handoff rates, common unanswered questions, and complete immutable audit logs identifying actors and actions.
          </p>
        </div>
      </div>

      <div className="bg-[#26372D] text-white p-12 rounded-3xl text-center space-y-6">
        <h2 className="text-3xl font-bold">Ready to experience CIPHER Desk?</h2>
        <p className="text-emerald-200 max-w-xl mx-auto text-sm">
          Explore the fully interactive operator workspace preloaded with Maple & Moss Home Goods demo data.
        </p>
        <div>
          <button
            onClick={onOpenDemo}
            className="bg-[#497A58] hover:bg-[#385f44] text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg transition-all"
          >
            Open Operator Workspace
          </button>
        </div>
      </div>
    </div>
  );
};

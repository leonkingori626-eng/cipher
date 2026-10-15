import React from 'react';
import { Workflow, ArrowRight, CheckCircle2, Shield, Bot, Users } from 'lucide-react';

export const WorkflowsTab: React.FC = () => {
  const steps = [
    { num: '01', title: 'Inbound Message', desc: 'Customer submits question via chat or email.', icon: Users },
    { num: '02', title: 'Input & Safety Validation', desc: 'Sanitizes input and guards against prompt injection.', icon: Shield },
    { num: '03', title: 'Knowledge Retrieval', desc: 'Retrieves approved FAQ and policy entries from workspace.', icon: Workflow },
    { num: '04', title: 'AI Generation or Handoff', desc: 'Generates grounded answer or triggers human handoff queue.', icon: Bot },
    { num: '05', title: 'Resolution & Audit Log', desc: 'Operator review, response sent, and immutable audit recorded.', icon: CheckCircle2 }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#26372D]">Support & Escalation Workflow</h2>
        <p className="text-xs text-[#66716A]">Deterministic customer support workflow ensuring safety and clarity.</p>
      </div>

      <div className="space-y-4">
        {steps.map((st, idx) => {
          const Icon = st.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-[#DCE2DC] shadow-sm flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E5EDE5] text-[#497A58] flex items-center justify-center font-bold text-base shrink-0">
                  {st.num}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#26372D] flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#497A58]" />
                    <span>{st.title}</span>
                  </h3>
                  <p className="text-xs text-[#66716A]">{st.desc}</p>
                </div>
              </div>
              <span className="text-xs font-semibold bg-[#F0F2EF] text-[#27332B] px-3 py-1.5 rounded-xl">
                Active
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

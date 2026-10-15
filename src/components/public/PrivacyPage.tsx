import React from 'react';
import { Shield, Lock, CheckCircle2 } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="bg-[#F7F9F6] text-[#27332B] min-h-screen py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <span className="bg-[#E5EDE5] text-[#26372D] px-4 py-1.5 rounded-full text-xs font-semibold border border-[#DCE2DC]">
          Privacy, Safety & Trust
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-[#26372D]">
          Our commitment to your business privacy
        </h1>
        <p className="text-base text-[#66716A]">
          At CIPHER, we believe that privacy and data security are fundamental rights, not optional add-ons.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-[#DCE2DC] space-y-8 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#26372D]">1. Data Minimization & Workspace Isolation</h2>
          <p className="text-sm text-[#66716A] leading-relaxed">
            We only collect the data necessary to operate your business support desk. Your knowledge entries, customer enquiries, and conversation histories are strictly isolated to your workspace and protected by robust server-side authorization checks.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#26372D]">2. AI Grounding & Prompt Safety</h2>
          <p className="text-sm text-[#66716A] leading-relaxed">
            Our AI assistant operates under strict system instructions that prevent it from fabricating policies, prices, or commitments. Customer messages are scanned for prompt injection attacks and quarantined if malicious overrides are detected.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#26372D]">3. Operator Audit Logs</h2>
          <p className="text-sm text-[#66716A] leading-relaxed">
            Every consequential action, knowledge update, and human handoff generates an immutable audit record identifying the actor, timestamp, and outcome. You always know who changed what and when.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#26372D]">4. Global Emergency Stop</h2>
          <p className="text-sm text-[#66716A] leading-relaxed">
            Administrators can activate the global emergency stop at any time in Settings. This instantly pauses all AI-powered customer responses without deleting conversation history, ensuring you retain absolute control.
          </p>
        </div>
      </div>
    </div>
  );
};

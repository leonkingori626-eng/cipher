import React, { useState } from 'react';
import { Bot, Sparkles, Send, User, ShieldCheck } from 'lucide-react';

export const AiAgentsTab: React.FC = () => {
  const agents = [
    { id: 'Support', name: 'CIPHER Support Agent', purpose: 'Answers routine customer questions using approved knowledge-base content.' },
    { id: 'LeadQualification', name: 'Lead Qualification Agent', purpose: 'Classifies enquiries, identifies missing info, and recommends next steps.' },
    { id: 'ProposalAssistant', name: 'Proposal Assistant', purpose: 'Drafts commercial proposals using approved service and pricing info.' },
    { id: 'OperationsAnalyst', name: 'Operations Analyst', purpose: 'Summarizes actual business activity, overdue work, and bottlenecks.' }
  ];

  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [input, setInput] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'agent'; text: string }[]>([
    { sender: 'agent', text: `Hello! I am ${selectedAgent.name}. How can I assist you with ${selectedAgent.purpose.toLowerCase()}` }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setChatLog(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, agentRole: selectedAgent.id })
      });
      const data = await res.json();
      setChatLog(prev => [...prev, { sender: 'agent', text: data.reply }]);
    } catch (err) {
      setChatLog(prev => [...prev, { sender: 'agent', text: "Error communicating with AI agent service." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#26372D]">CIPHER Intelligence — Specialized AI Agents</h2>
        <p className="text-xs text-[#66716A]">Interact with specialized role-based agents operating under strict workspace permissions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Agent Selectors */}
        <div className="lg:col-span-4 space-y-4">
          {agents.map((ag) => (
            <div
              key={ag.id}
              onClick={() => {
                setSelectedAgent(ag);
                setChatLog([{ sender: 'agent', text: `Switched to ${ag.name}. Ready to assist.` }]);
              }}
              className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                selectedAgent.id === ag.id
                  ? 'bg-[#E5EDE5] border-[#497A58] shadow-sm'
                  : 'bg-white border-[#DCE2DC] hover:bg-[#F7F9F6]'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#497A58] text-white flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#26372D]">{ag.name}</h3>
                  <span className="text-[11px] text-[#497A58] font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Secure Sandbox
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#66716A]">{ag.purpose}</p>
            </div>
          ))}
        </div>

        {/* Agent Test Bench / Chat */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#DCE2DC] overflow-hidden flex flex-col h-[550px] shadow-sm">
          <div className="p-4 border-b border-[#DCE2DC] bg-[#26372D] text-white flex items-center justify-between">
            <span className="font-bold text-sm">{selectedAgent.name} Test Bench</span>
            <span className="text-xs text-emerald-200">Model: gemini-2.5-flash (Grounded)</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F7F9F6]">
            {chatLog.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-2xl text-sm max-w-[85%] leading-relaxed ${
                  m.sender === 'user' ? 'bg-[#497A58] text-white rounded-tr-none' : 'bg-white text-[#27332B] border border-[#DCE2DC] rounded-tl-none shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-xs text-[#66716A] bg-white p-3 rounded-2xl w-fit border border-[#DCE2DC]">
                Agent is thinking and validating context...
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 bg-white border-t border-[#DCE2DC] flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${selectedAgent.name}...`}
              className="flex-1 text-sm bg-[#F0F2EF] border border-transparent focus:border-[#497A58] focus:bg-white rounded-xl px-4 py-3 outline-none transition-all text-[#27332B]"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-[#497A58] hover:bg-[#385f44] disabled:opacity-50 text-white px-6 py-3 rounded-xl transition-all font-medium flex items-center gap-2"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

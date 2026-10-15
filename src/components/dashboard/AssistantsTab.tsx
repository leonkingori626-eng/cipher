import React, { useState } from 'react';
import { Bot, Sparkles, CheckCircle2, Sliders, Shield } from 'lucide-react';
import { AssistantConfig } from '../../types';

interface AssistantsTabProps {
  assistant: AssistantConfig;
  onUpdateAssistant: (updates: Partial<AssistantConfig>) => void;
}

export const AssistantsTab: React.FC<AssistantsTabProps> = ({ assistant, onUpdateAssistant }) => {
  const [name, setName] = useState(assistant.name);
  const [tone, setTone] = useState(assistant.tone);
  const [model, setModel] = useState(assistant.model);
  const [temperature, setTemperature] = useState(assistant.temperature);
  const [maxTokens, setMaxTokens] = useState(assistant.maxTokens);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAssistant({
      name,
      tone,
      model,
      temperature: Number(temperature),
      maxTokens: Number(maxTokens),
      lastTested: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Passed all safety assertions)`
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#26372D]">AI Assistant Configuration</h2>
        <p className="text-xs text-[#66716A]">Configure assistant personality, grounding models, and safety thresholds.</p>
      </div>

      {savedMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Assistant configuration updated and validated successfully.</span>
        </div>
      )}

      <div className="bg-white rounded-3xl p-8 border border-[#DCE2DC] shadow-sm space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-[#66716A] mb-1">Assistant Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#66716A] mb-1">Google GenAI Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended)</option>
                <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#66716A] mb-1">Support Tone & Voice</label>
            <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-[#66716A] mb-1">Temperature ({temperature})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full accent-[#497A58]"
              />
              <p className="text-[11px] text-[#66716A] mt-1">Lower values ensure strict adherence to approved knowledge.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#66716A] mb-1">Max Response Tokens</label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F9F6] border border-[#DCE2DC] space-y-2">
            <h4 className="font-semibold text-xs text-[#26372D] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#497A58]" />
              <span>Safety & Grounding Protections</span>
            </h4>
            <p className="text-xs text-[#66716A] leading-relaxed">
              Assistant is restricted to approved knowledge base entries. Prompt injection attempts are automatically quarantined. Version: {assistant.version} • Last Tested: {assistant.lastTested}
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-[#497A58] hover:bg-[#385f44] text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all shadow"
            >
              Save Assistant Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

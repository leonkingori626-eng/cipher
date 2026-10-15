import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Message } from '../../types';

interface InteractiveDemoPageProps {
  onOpenDemo: () => void;
}

export const InteractiveDemoPage: React.FC<InteractiveDemoPageProps> = ({ onOpenDemo }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'demo-init',
      sender: 'assistant',
      senderName: 'Maple & Moss Support AI',
      text: "Hello! Welcome to Maple & Moss Home Goods. I'm your AI support assistant, trained on our approved shipping, return, and ceramic care guides. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAiGenerated: true
    }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sampleQuestions = [
    "What is your return policy on ceramics?",
    "How much is standard shipping?",
    "Are your stoneware mugs dishwasher safe?",
    "Can I change the shipping address on order #4892?"
  ];

  const handleSendText = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    const userMessage: Message = {
      id: `m-${Date.now()}`,
      sender: 'customer',
      senderName: 'Demo Visitor',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: updatedMessages
        })
      });
      const data = await res.json();

      const assistantMessage: Message = {
        id: `m-${Date.now() + 1}`,
        sender: 'assistant',
        senderName: 'Maple & Moss Support AI',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiGenerated: data.isAiGenerated,
        needsHandoff: data.needsHandoff
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `m-${Date.now() + 1}`,
          sender: 'assistant',
          senderName: 'Maple & Moss Support AI',
          text: "I'm having a brief connection issue. A human specialist has been notified.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          needsHandoff: true
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'demo-init',
        sender: 'assistant',
        senderName: 'Maple & Moss Support AI',
        text: "Conversation reset. How can I assist you with Maple & Moss products today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiGenerated: true
      }
    ]);
  };

  return (
    <div className="bg-[#F7F9F6] text-[#27332B] min-h-screen py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="bg-[#E5EDE5] text-[#26372D] px-4 py-1.5 rounded-full text-xs font-semibold border border-[#DCE2DC]">
          Interactive AI Demo
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-[#26372D]">
          Test the Maple & Moss AI Assistant
        </h1>
        <p className="text-base text-[#66716A]">
          Try asking a routine question answered by approved knowledge, or test an address change to see the automatic human handoff in action.
        </p>
      </div>

      {/* Suggested Questions */}
      <div className="bg-white p-6 rounded-2xl border border-[#DCE2DC] shadow-sm space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#66716A]">Suggested Test Questions:</p>
        <div className="flex flex-wrap gap-2">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendText(q)}
              className="text-xs bg-[#F0F2EF] hover:bg-[#E5EDE5] text-[#27332B] px-3.5 py-2 rounded-xl transition-all border border-[#DCE2DC] font-medium"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Box */}
      <div className="bg-white rounded-3xl shadow-xl border border-[#DCE2DC] overflow-hidden flex flex-col h-[600px]">
        {/* Header */}
        <div className="bg-[#26372D] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#497A58] flex items-center justify-center text-white font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Maple & Moss Support AI</h3>
              <p className="text-xs text-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Grounded in 5 Approved Knowledge Entries
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F7F9F6]">
          {messages.map((msg) => {
            const isCust = msg.sender === 'customer';
            return (
              <div key={msg.id} className={`flex flex-col ${isCust ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-1 text-xs text-[#66716A]">
                  {isCust ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-[#497A58]" />}
                  <span className="font-medium">{msg.senderName}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div
                  className={`p-4 rounded-2xl text-sm max-w-[80%] leading-relaxed ${
                    isCust
                      ? 'bg-[#497A58] text-white rounded-tr-none'
                      : 'bg-white text-[#27332B] border border-[#DCE2DC] rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                  {msg.needsHandoff && (
                    <div className="mt-3 pt-3 border-t border-amber-200 text-xs text-amber-800 flex items-center gap-2 bg-amber-50 p-2 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-semibold">Human Handoff Triggered:</span> This conversation has been queued for operator review in CIPHER Desk.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {isSending && (
            <div className="flex items-center gap-2 text-xs text-[#66716A] bg-white p-4 rounded-2xl w-fit border border-[#DCE2DC] shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-[#497A58] animate-bounce"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#497A58] animate-bounce delay-100"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#497A58] animate-bounce delay-200"></div>
              <span>Checking approved business knowledge...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendText(input);
          }}
          className="p-4 bg-white border-t border-[#DCE2DC] flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question for Maple & Moss Home Goods..."
            className="flex-1 text-sm bg-[#F0F2EF] border border-transparent focus:border-[#497A58] focus:bg-white rounded-xl px-4 py-3 outline-none transition-all text-[#27332B]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="bg-[#497A58] hover:bg-[#385f44] disabled:opacity-50 text-white px-6 py-3 rounded-xl transition-all font-medium flex items-center gap-2 focus:ring-2 focus:ring-[#497A58]"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="text-center pt-4">
        <p className="text-xs text-[#66716A] mb-4">Like how this works? Open the operator workspace to see how team members manage conversations and approvals.</p>
        <button
          onClick={onOpenDemo}
          className="bg-[#26372D] hover:bg-[#1a261f] text-white text-sm font-semibold px-8 py-3 rounded-xl shadow transition-all"
        >
          Open CIPHER Desk Operator Workspace
        </button>
      </div>
    </div>
  );
};

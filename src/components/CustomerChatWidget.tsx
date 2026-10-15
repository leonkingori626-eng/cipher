import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import { Message } from '../types';

interface CustomerChatWidgetProps {
  businessName?: string;
}

export const CustomerChatWidget: React.FC<CustomerChatWidgetProps> = ({ businessName = "Maple & Moss Home Goods" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-init',
      sender: 'assistant',
      senderName: 'CIPHER Support AI',
      text: `Hello! Welcome to ${businessName}. How can we help you with our products, shipping, or returns today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAiGenerated: true
    }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [customerName, setCustomerName] = useState('Visitor');
  const [promptConsent, setPromptConsent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userMsgText = input.trim();
    setInput('');

    const userMessage: Message = {
      id: `m-${Date.now()}`,
      sender: 'customer',
      senderName: customerName,
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsgText,
          conversationHistory: updatedMessages
        })
      });
      const data = await res.json();

      const assistantMessage: Message = {
        id: `m-${Date.now() + 1}`,
        sender: 'assistant',
        senderName: 'CIPHER Support AI',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiGenerated: data.isAiGenerated,
        needsHandoff: data.needsHandoff
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Also persist conversation to backend
      await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          channel: 'Web Chat',
          messages: [...updatedMessages, assistantMessage]
        })
      });

    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `m-${Date.now() + 1}`,
          sender: 'assistant',
          senderName: 'CIPHER Support AI',
          text: "I'm having a brief connection issue. A human team member has been notified to assist you.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          needsHandoff: true
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#497A58] hover:bg-[#385f44] text-white p-4 rounded-full shadow-lg flex items-center gap-3 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#497A58] focus:ring-offset-2"
          aria-label="Open support chat"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="font-medium pr-1">Chat with {businessName}</span>
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
          </span>
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-96 max-w-[92vw] h-[540px] flex flex-col border border-[#DCE2DC] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-[#26372D] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#497A58] flex items-center justify-center text-white font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{businessName}</h3>
                <p className="text-xs text-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Assistant (Human-backed)
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-emerald-200 hover:text-white p-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-300"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Consent / Name bar if first time */}
          {!promptConsent && (
            <div className="bg-[#E5EDE5] px-4 py-2.5 text-xs text-[#27332B] border-b border-[#DCE2DC] flex items-center justify-between">
              <span>Chatting as <strong>{customerName}</strong></span>
              <button 
                onClick={() => setPromptConsent(true)} 
                className="text-[#497A58] font-medium hover:underline"
              >
                Change name
              </button>
            </div>
          )}

          {promptConsent && (
            <div className="bg-[#E5EDE5] p-3 border-b border-[#DCE2DC] flex items-center gap-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className="text-xs px-2.5 py-1 bg-white border border-[#DCE2DC] rounded focus:outline-none focus:ring-1 focus:ring-[#497A58] flex-1"
              />
              <button
                onClick={() => setPromptConsent(false)}
                className="bg-[#497A58] text-white text-xs px-3 py-1 rounded hover:bg-[#385f44]"
              >
                Save
              </button>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F7F9F6]">
            {messages.map((msg) => {
              const isCust = msg.sender === 'customer';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCust ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] text-[#66716A]">
                    {isCust ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-[#497A58]" />}
                    <span>{msg.senderName}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-sm max-w-[85%] leading-relaxed ${
                      isCust
                        ? 'bg-[#497A58] text-white rounded-tr-none'
                        : 'bg-white text-[#27332B] border border-[#DCE2DC] rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.text}
                    {msg.needsHandoff && (
                      <div className="mt-2 pt-2 border-t border-amber-200 text-xs text-amber-800 flex items-center gap-1.5 bg-amber-50 p-1.5 rounded">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Flagged for human support review.</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isSending && (
              <div className="flex items-center gap-2 text-xs text-[#66716A] bg-white p-3 rounded-2xl w-fit border border-[#DCE2DC] shadow-sm">
                <div className="w-2 h-2 rounded-full bg-[#497A58] animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-[#497A58] animate-bounce delay-100"></div>
                <div className="w-2 h-2 rounded-full bg-[#497A58] animate-bounce delay-200"></div>
                <span>Assistant is drafting response...</span>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#DCE2DC] flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about shipping, returns, products..."
              className="flex-1 text-sm bg-[#F0F2EF] border border-transparent focus:border-[#497A58] focus:bg-white rounded-xl px-4 py-2.5 outline-none transition-all text-[#27332B]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="bg-[#497A58] hover:bg-[#385f44] disabled:opacity-50 text-white p-2.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#497A58]"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="bg-[#F0F2EF] px-3 py-1 text-[10px] text-center text-[#66716A] border-t border-[#DCE2DC]">
            Powered by CIPHER Human-Centred AI • Grounded in approved business policies
          </div>
        </div>
      )}
    </div>
  );
};

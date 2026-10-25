import React, { useState } from 'react';
import { MessageSquare, Search, User, Bot, Send, CheckCircle2, AlertCircle, Clock, Shield } from 'lucide-react';
import { Conversation, Message } from '../../types';

interface ConversationsTabProps {
  conversations: Conversation[];
  onUpdateConversation: (id: string, updates: Partial<Conversation>) => void;
  onAddMessage: (convId: string, message: { sender: 'operator'; senderName: string; text: string }) => void;
}

export const ConversationsTab: React.FC<ConversationsTabProps> = ({
  conversations,
  onUpdateConversation,
  onAddMessage
}) => {
  const [selectedConvId, setSelectedConvId] = useState<string>(conversations[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [replyText, setReplyText] = useState('');
  const [operatorNotesInput, setOperatorNotesInput] = useState('');

  const selectedConv = conversations.find(c => c.id === selectedConvId) || conversations[0];

  const filteredConversations = conversations.filter(c => {
    if (statusFilter === 'All') return true;
    return c.status === statusFilter;
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;

    onAddMessage(selectedConv.id, {
      sender: 'operator',
      senderName: 'Sarah Jenkins',
      text: replyText.trim()
    });

    onUpdateConversation(selectedConv.id, {
      status: 'In progress',
      assignedOperator: 'Sarah Jenkins'
    });

    setReplyText('');
  };

  const handleStatusChange = (newStatus: Conversation['status']) => {
    if (!selectedConv) return;
    onUpdateConversation(selectedConv.id, { status: newStatus });
  };

  const handleSaveNotes = () => {
    if (!selectedConv) return;
    onUpdateConversation(selectedConv.id, { operatorNotes: operatorNotesInput });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#26372D]">Conversation Inbox</h2>
          <p className="text-xs text-[#66716A]">Manage live customer chats, AI assistance sessions, and human handoffs.</p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-[#DCE2DC]">
          {['All', 'Needs human', 'AI assisted', 'In progress', 'Resolved'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === filter
                  ? 'bg-[#497A58] text-white shadow-sm'
                  : 'text-[#66716A] hover:text-[#27332B]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Conversation List */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#DCE2DC] overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 border-b border-[#DCE2DC] bg-[#F7F9F6]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#66716A]">Queue ({filteredConversations.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#DCE2DC]">
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConv?.id;
              const needsHandoff = conv.status === 'Needs human';
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setSelectedConvId(conv.id);
                    setOperatorNotesInput(conv.operatorNotes || '');
                  }}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected ? 'bg-[#E5EDE5]/70 border-l-4 border-l-[#497A58]' : 'hover:bg-[#F7F9F6]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm text-[#26372D]">{conv.customerName}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      needsHandoff ? 'bg-amber-100 text-amber-800' : 'bg-[#E5EDE5] text-[#497A58]'
                    }`}>
                      {conv.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#66716A] truncate mb-2">
                    {Array.isArray(conv.messages) && conv.messages.length > 0
                      ? conv.messages[conv.messages.length - 1]?.text || 'No messages yet'
                      : 'No messages yet'}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-[#66716A]">
                    <span>{conv.channel}</span>
                    <span>{conv.lastActive}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversation Detail & Reply Pane */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#DCE2DC] overflow-hidden flex flex-col shadow-sm">
          {selectedConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-[#DCE2DC] bg-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-[#26372D]">{selectedConv.customerName}</h3>
                  <p className="text-xs text-[#66716A]">
                    {selectedConv.customerEmail || 'No email supplied'} • Channel: {selectedConv.channel}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedConv.status}
                    onChange={(e) => handleStatusChange(e.target.value as Conversation['status'])}
                    className="text-xs bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  >
                    <option value="New">New</option>
                    <option value="AI assisted">AI assisted</option>
                    <option value="Needs human">Needs human</option>
                    <option value="In progress">In progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F7F9F6]">
                {(Array.isArray(selectedConv.messages) ? selectedConv.messages : []).map((msg) => {
                  const isCust = msg.sender === 'customer';
                  const isOp = msg.sender === 'operator';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isCust ? 'items-start' : 'items-end'}`}>
                      <div className="flex items-center gap-1.5 mb-1 text-xs text-[#66716A]">
                        <span className="font-medium">{msg.senderName}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div
                        className={`p-4 rounded-2xl text-sm max-w-[80%] leading-relaxed ${
                          isCust
                            ? 'bg-white text-[#27332B] border border-[#DCE2DC] rounded-tl-none shadow-sm'
                            : isOp
                            ? 'bg-[#26372D] text-white rounded-tr-none'
                            : 'bg-[#497A58] text-white rounded-tr-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Operator Notes Drawer */}
              <div className="px-6 py-3 bg-[#E5EDE5] border-t border-[#DCE2DC] flex items-center gap-3">
                <span className="text-xs font-semibold text-[#26372D] shrink-0">Operator Notes:</span>
                <input
                  type="text"
                  value={operatorNotesInput}
                  onChange={(e) => setOperatorNotesInput(e.target.value)}
                  placeholder="Add private operator notes for this session..."
                  className="flex-1 text-xs bg-white border border-[#DCE2DC] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                />
                <button
                  onClick={handleSaveNotes}
                  className="bg-[#497A58] hover:bg-[#385f44] text-white text-xs px-4 py-2 rounded-xl transition-all"
                >
                  Save Notes
                </button>
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-[#DCE2DC] flex items-center gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type operator reply to customer..."
                  className="flex-1 text-sm bg-[#F0F2EF] border border-transparent focus:border-[#497A58] focus:bg-white rounded-xl px-4 py-3 outline-none transition-all text-[#27332B]"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="bg-[#497A58] hover:bg-[#385f44] disabled:opacity-50 text-white px-6 py-3 rounded-xl transition-all font-medium flex items-center gap-2"
                >
                  <span>Send Reply</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#66716A] text-sm">
              Select a conversation from the left queue to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

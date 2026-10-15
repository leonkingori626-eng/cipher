import React, { useState } from 'react';
import { FileText, Plus, CheckCircle2, DollarSign, Calendar } from 'lucide-react';
import { Proposal } from '../../types';

interface ProposalsTabProps {
  proposals: Proposal[];
  onAddProposal: (proposal: Omit<Proposal, 'id' | 'createdAt'>) => void;
  onUpdateProposal: (id: string, updates: Partial<Proposal>) => void;
}

export const ProposalsTab: React.FC<ProposalsTabProps> = ({ proposals, onAddProposal, onUpdateProposal }) => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [amount, setAmount] = useState(1500);
  const [scope, setScope] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim()) return;
    onAddProposal({
      title: title.trim(),
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || 'client@example.com',
      amount: Number(amount),
      currency: 'USD',
      scope: scope.trim() || 'Standard deliverables and terms.',
      status: 'Pending Approval',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setTitle('');
    setClientName('');
    setClientEmail('');
    setScope('');
    setShowModal(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#26372D]">Sales & Proposals</h2>
          <p className="text-xs text-[#66716A]">Draft commercial proposals, specify deliverables, and manage approval status.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#497A58] hover:bg-[#385f44] text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Proposal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {proposals.map((prop) => (
          <div key={prop.id} className="bg-white rounded-3xl p-6 border border-[#DCE2DC] shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold bg-[#E5EDE5] text-[#497A58] px-2.5 py-1 rounded-full">
                  ${prop.amount.toLocaleString()} {prop.currency}
                </span>
                <select
                  value={prop.status}
                  onChange={(e) => onUpdateProposal(prop.id, { status: e.target.value as Proposal['status'] })}
                  className="text-xs bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-2.5 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Sent">Sent</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Declined">Declined</option>
                </select>
              </div>

              <h3 className="font-bold text-base text-[#26372D]">{prop.title}</h3>
              <p className="text-xs font-semibold text-[#66716A]">Client: {prop.clientName} ({prop.clientEmail})</p>
              <p className="text-xs text-[#66716A] bg-[#F7F9F6] p-3 rounded-xl border border-[#DCE2DC]">{prop.scope}</p>
            </div>

            <div className="pt-4 border-t border-[#DCE2DC] flex items-center justify-between text-xs text-[#66716A]">
              <span>Valid until: {prop.validUntil}</span>
              <span>Created: {prop.createdAt}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl border border-[#DCE2DC]">
            <h3 className="text-xl font-bold text-[#26372D]">Create Sales Proposal</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#66716A] mb-1">Proposal Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Corporate Gifting Set"
                  className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Client Name</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Samantha Reed"
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Amount ($)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#66716A] mb-1">Client Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#66716A] mb-1">Scope & Deliverables</label>
                <textarea
                  rows={3}
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  placeholder="Describe agreed scope..."
                  className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#F0F2EF]">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#497A58] text-white">Save Proposal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

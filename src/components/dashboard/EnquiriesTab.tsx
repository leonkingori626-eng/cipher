import React, { useState } from 'react';
import { Users, Search, Plus, Mail, Phone, Calendar, CheckCircle2 } from 'lucide-react';
import { CustomerEnquiry } from '../../types';

interface EnquiriesTabProps {
  enquiries: CustomerEnquiry[];
  onAddEnquiry: (enquiry: Omit<CustomerEnquiry, 'id'>) => void;
  onUpdateEnquiry: (id: string, updates: Partial<CustomerEnquiry>) => void;
}

export const EnquiriesTab: React.FC<EnquiriesTabProps> = ({
  enquiries,
  onAddEnquiry,
  onUpdateEnquiry
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNeed, setNewNeed] = useState('');
  const [newSource, setNewSource] = useState('Manual Entry');

  const filtered = enquiries.filter(e => {
    if (statusFilter === 'All') return true;
    return e.status === statusFilter;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newNeed.trim()) return;

    onAddEnquiry({
      customerName: newName.trim(),
      customerEmail: newEmail.trim() || 'Not provided',
      customerPhone: newPhone.trim(),
      businessNeed: newNeed.trim(),
      source: newSource,
      dateReceived: new Date().toISOString().split('T')[0],
      status: 'New',
      assignedOwner: 'Sarah Jenkins',
      notes: 'Manually created enquiry lead.'
    });

    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewNeed('');
    setShowNewModal(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#26372D]">Customer Enquiries & Lead Pipeline</h2>
          <p className="text-xs text-[#66716A]">Organize customer leads, wholesale orders, and service requests.</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="bg-[#497A58] hover:bg-[#385f44] text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Enquiry</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-[#DCE2DC] w-fit overflow-x-auto">
        {['All', 'New', 'Reviewing', 'Contacted', 'Qualified', 'Proposal pending', 'Won', 'Lost'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              statusFilter === st
                ? 'bg-[#497A58] text-white shadow-sm'
                : 'text-[#66716A] hover:text-[#27332B]'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Enquiries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((enq) => (
          <div key={enq.id} className="bg-white rounded-3xl p-6 border border-[#DCE2DC] shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-[#26372D]">{enq.customerName}</h3>
                <select
                  value={enq.status}
                  onChange={(e) => onUpdateEnquiry(enq.id, { status: e.target.value as CustomerEnquiry['status'] })}
                  className="text-xs bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-2.5 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                >
                  <option value="New">New</option>
                  <option value="Reviewing">Reviewing</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Proposal pending">Proposal pending</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <p className="text-xs text-[#66716A] bg-[#F7F9F6] p-3 rounded-xl border border-[#DCE2DC]">
                {enq.businessNeed}
              </p>

              <div className="space-y-1.5 text-xs text-[#66716A]">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#497A58]" />
                  <span>{enq.customerEmail}</span>
                </div>
                {enq.customerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#497A58]" />
                    <span>{enq.customerPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#497A58]" />
                  <span>Received: {enq.dateReceived} • {enq.source}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#DCE2DC] flex items-center justify-between text-xs text-[#66716A]">
              <span>Owner: {enq.assignedOwner}</span>
              <span className="italic">{enq.notes}</span>
            </div>
          </div>
        ))}
      </div>

      {/* New Enquiry Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl border border-[#DCE2DC]">
            <h3 className="text-xl font-bold text-[#26372D]">Create Customer Enquiry</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#66716A] mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Samantha Reed"
                  className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Phone</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+1 (555) ..."
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#66716A] mb-1">Business Need / Inquiry Description</label>
                <textarea
                  required
                  rows={3}
                  value={newNeed}
                  onChange={(e) => setNewNeed(e.target.value)}
                  placeholder="Describe customer requirements..."
                  className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#F0F2EF] text-[#27332B] hover:bg-[#E5EDE5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#497A58] text-white hover:bg-[#385f44]"
                >
                  Save Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Users, Plus, Mail, Phone, Building, DollarSign } from 'lucide-react';
import { CrmContact } from '../../types';

interface CrmTabProps {
  contacts: CrmContact[];
  onAddContact: (contact: Omit<CrmContact, 'id' | 'lastInteraction'>) => void;
  onUpdateContact: (id: string, updates: Partial<CrmContact>) => void;
}

export const CrmTab: React.FC<CrmTabProps> = ({ contacts, onAddContact, onUpdateContact }) => {
  const [stageFilter, setStageFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [value, setValue] = useState(1000);
  const [stage, setStage] = useState<CrmContact['stage']>('New');

  const filtered = contacts.filter(c => stageFilter === 'All' || c.stage === stageFilter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddContact({
      name: name.trim(),
      company: company.trim() || 'Independent',
      email: email.trim() || 'no-email@example.com',
      phone: phone.trim() || 'Not provided',
      status: 'Lead',
      stage,
      value: Number(value),
      assignedOwner: 'Sarah Jenkins'
    });
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setShowModal(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#26372D]">CRM & Client Relationships</h2>
          <p className="text-xs text-[#66716A]">Manage client accounts, lead stages, deal values, and interaction history.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#497A58] hover:bg-[#385f44] text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add CRM Contact</span>
        </button>
      </div>

      {/* Stage Filters */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-[#DCE2DC] w-fit overflow-x-auto">
        {['All', 'New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'].map((st) => (
          <button
            key={st}
            onClick={() => setStageFilter(st)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              stageFilter === st ? 'bg-[#497A58] text-white shadow-sm' : 'text-[#66716A] hover:text-[#27332B]'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-3xl border border-[#DCE2DC] overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F7F9F6] text-[#66716A] border-b border-[#DCE2DC]">
            <tr>
              <th className="p-4 font-semibold">Client Name</th>
              <th className="p-4 font-semibold">Company</th>
              <th className="p-4 font-semibold">Contact Details</th>
              <th className="p-4 font-semibold">Stage</th>
              <th className="p-4 font-semibold">Deal Value</th>
              <th className="p-4 font-semibold">Owner</th>
              <th className="p-4 font-semibold">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE2DC]">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-[#F7F9F6]">
                <td className="p-4 font-bold text-[#27332B]">{c.name}</td>
                <td className="p-4 text-[#66716A] flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-[#497A58]" />{c.company}</td>
                <td className="p-4 text-[#66716A]">
                  <div>{c.email}</div>
                  <div>{c.phone}</div>
                </td>
                <td className="p-4">
                  <select
                    value={c.stage}
                    onChange={(e) => onUpdateContact(c.id, { stage: e.target.value as any })}
                    className="text-xs bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-2.5 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </td>
                <td className="p-4 font-semibold text-[#27332B]">${c.value.toLocaleString()}</td>
                <td className="p-4 text-[#66716A]">{c.assignedOwner}</td>
                <td className="p-4 text-[#66716A]">{c.lastInteraction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl border border-[#DCE2DC]">
            <h3 className="text-xl font-bold text-[#26372D]">Add CRM Contact</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#66716A] mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marcus Vance"
                  className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Studio Name"
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Deal Value ($)</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#F0F2EF]">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#497A58] text-white">Save Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

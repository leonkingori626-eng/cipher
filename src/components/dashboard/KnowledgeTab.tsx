import React, { useState } from 'react';
import { BookOpen, Plus, Search, CheckCircle2, Clock, Trash2, Edit3 } from 'lucide-react';
import { KnowledgeEntry } from '../../types';

interface KnowledgeTabProps {
  knowledge: KnowledgeEntry[];
  onAddEntry: (entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateEntry: (id: string, updates: Partial<KnowledgeEntry>) => void;
  onDeleteEntry: (id: string) => void;
}

export const KnowledgeTab: React.FC<KnowledgeTabProps> = ({
  knowledge,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<KnowledgeEntry['category']>('General FAQ');
  const [status, setStatus] = useState<KnowledgeEntry['status']>('Draft');
  const [source, setSource] = useState('Operator Knowledge Base');

  const filtered = knowledge.filter(k => {
    const matchesStatus = statusFilter === 'All' || k.status === statusFilter;
    const matchesSearch = k.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          k.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setCategory('General FAQ');
    setStatus('Draft');
    setSource('Operator Knowledge Base');
    setShowModal(true);
  };

  const handleOpenEdit = (item: KnowledgeEntry) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category);
    setStatus(item.status);
    setSource(item.source);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (editingId) {
      onUpdateEntry(editingId, {
        title: title.trim(),
        content: content.trim(),
        category,
        status,
        source
      });
    } else {
      onAddEntry({
        title: title.trim(),
        content: content.trim(),
        category,
        status,
        source,
        effectiveDate: new Date().toISOString().split('T')[0]
      });
    }

    setShowModal(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#26372D]">Knowledge Base</h2>
          <p className="text-xs text-[#66716A]">Manage approved business policies, shipping guides, and FAQ entries used by the AI.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-[#497A58] hover:bg-[#385f44] text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Knowledge Entry</span>
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#DCE2DC] shadow-sm">
        <div className="flex items-center gap-2 bg-[#F0F2EF] px-3.5 py-2 rounded-xl w-full sm:w-80">
          <Search className="w-4 h-4 text-[#66716A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search knowledge entries..."
            className="bg-transparent text-xs text-[#27332B] outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          {['All', 'Approved', 'Draft', 'Archived'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'bg-[#497A58] text-white shadow-sm'
                  : 'text-[#66716A] hover:text-[#27332B] bg-[#F0F2EF]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Knowledge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((item) => {
          const isApproved = item.status === 'Approved';
          return (
            <div key={item.id} className="bg-white rounded-3xl p-6 border border-[#DCE2DC] shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold bg-[#E5EDE5] text-[#497A58] px-2.5 py-1 rounded-full border border-[#DCE2DC]">
                    {item.category}
                  </span>
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                    isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-[#26372D]">{item.title}</h3>
                <p className="text-xs text-[#66716A] leading-relaxed bg-[#F7F9F6] p-4 rounded-2xl border border-[#DCE2DC]">
                  {item.content}
                </p>
              </div>

              <div className="pt-4 border-t border-[#DCE2DC] flex items-center justify-between text-xs text-[#66716A]">
                <span>Source: {item.source}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 bg-[#F0F2EF] hover:bg-[#E5EDE5] text-[#27332B] rounded-lg transition-all"
                    title="Edit entry"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteEntry(item.id)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl border border-[#DCE2DC]">
            <h3 className="text-xl font-bold text-[#26372D]">
              {editingId ? 'Edit Knowledge Entry' : 'Create Knowledge Entry'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#66716A] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Return Policy Details"
                  className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  >
                    <option value="Shipping & Delivery">Shipping & Delivery</option>
                    <option value="Returns & Refunds">Returns & Refunds</option>
                    <option value="Products & Pricing">Products & Pricing</option>
                    <option value="Policies">Policies</option>
                    <option value="General FAQ">General FAQ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Approved">Approved</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#66716A] mb-1">Content / Policy Details</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter precise policy information..."
                  className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#66716A] mb-1">Source / Origin</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Operations Handbook v2"
                  className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#F0F2EF] text-[#27332B] hover:bg-[#E5EDE5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#497A58] text-white hover:bg-[#385f44]"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

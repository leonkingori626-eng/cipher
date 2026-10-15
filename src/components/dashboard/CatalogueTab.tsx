import React, { useState } from 'react';
import { Package, Plus, DollarSign, Tag, Trash2, Edit3 } from 'lucide-react';
import { CatalogueItem } from '../../types';

interface CatalogueTabProps {
  items: CatalogueItem[];
  onAddItem: (item: Omit<CatalogueItem, 'id'>) => void;
  onDeleteItem: (id: string) => void;
}

export const CatalogueTab: React.FC<CatalogueTabProps> = ({ items, onAddItem, onDeleteItem }) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(35);
  const [pricingMethod, setPricingMethod] = useState<CatalogueItem['pricingMethod']>('Fixed');
  const [variants, setVariants] = useState('Standard');
  const [availability, setAvailability] = useState<CatalogueItem['availability']>('In Stock');
  const [discountConditions, setDiscountConditions] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddItem({
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      price: Number(price),
      pricingMethod,
      variants: variants.trim(),
      availability,
      discountConditions: discountConditions.trim() || undefined
    });
    setName('');
    setDescription('');
    setDiscountConditions('');
    setShowModal(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#26372D]">CIPHER Catalogue — Products & Services</h2>
          <p className="text-xs text-[#66716A]">Manage items, services, pricing methods, and variants displayed on your public website and AI guide.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#497A58] hover:bg-[#385f44] text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Catalogue Item</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-3xl p-6 border border-[#DCE2DC] shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold bg-[#E5EDE5] text-[#497A58] px-2.5 py-1 rounded-full">
                  {item.category}
                </span>
                <span className="text-xs font-bold text-[#26372D]">
                  ${item.price} {item.pricingMethod === 'Hourly' ? '/ hr' : item.pricingMethod === 'From' ? 'from' : ''}
                </span>
              </div>
              <h3 className="font-bold text-base text-[#26372D]">{item.name}</h3>
              <p className="text-xs text-[#66716A] leading-relaxed bg-[#F7F9F6] p-3 rounded-xl border border-[#DCE2DC]">
                {item.description}
              </p>
              <p className="text-[11px] text-[#66716A]">Variants: {item.variants}</p>
              {item.discountConditions && (
                <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  Special Condition: {item.discountConditions}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#DCE2DC] flex items-center justify-between text-xs text-[#66716A]">
              <span className="text-emerald-700 font-medium">{item.availability}</span>
              <button
                onClick={() => onDeleteItem(item.id)}
                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl border border-[#DCE2DC]">
            <h3 className="text-xl font-bold text-[#26372D]">Add Catalogue Item</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#66716A] mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Handmade Ceramic Vase"
                  className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Price ($)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#66716A] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe item..."
                  className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Pricing Method</label>
                  <select
                    value={pricingMethod}
                    onChange={(e) => setPricingMethod(e.target.value as any)}
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  >
                    <option value="Fixed">Fixed Price</option>
                    <option value="From">Starting From</option>
                    <option value="Hourly">Hourly Rate</option>
                    <option value="Quote Required">Quote Required</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Discount Conditions</label>
                  <input
                    type="text"
                    value={discountConditions}
                    onChange={(e) => setDiscountConditions(e.target.value)}
                    placeholder="e.g. 10% off for bundle orders"
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Variants / Sizes</label>
                  <input
                    type="text"
                    value={variants}
                    onChange={(e) => setVariants(e.target.value)}
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Availability</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as any)}
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Made to Order">Made to Order</option>
                    <option value="Available">Available</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#F0F2EF]">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#497A58] text-white">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

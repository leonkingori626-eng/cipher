import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, CheckCircle2, ArrowRight, ArrowLeft, RefreshCw, Layers, Clock, HeartHandshake, Eye, Check } from 'lucide-react';
import { BusinessProfile } from '../../types';

interface BusinessRegistrationWizardProps {
  onCompleteRegistration: (profile: BusinessProfile) => void;
  onCancel: () => void;
}

export interface ProfileSuggestion {
  id: string;
  archetype: string;
  badge: string;
  tagline: string;
  description: string;
  supportTone: string;
  template: 'Maple Botanical' | 'Modern Clean' | 'Warm Artisan';
  recommendedHours: string;
  highlights: string[];
}

export const BusinessRegistrationWizard: React.FC<BusinessRegistrationWizardProps> = ({ onCompleteRegistration, onCancel }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [type, setType] = useState('Small Online Retailer & Handcrafted Goods');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [supportTone, setSupportTone] = useState('Warm, thoughtful, and personal');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [hours, setHours] = useState('Monday - Friday, 9:00 AM - 6:00 PM EST');
  const [template, setTemplate] = useState<'Maple Botanical' | 'Modern Clean' | 'Warm Artisan'>('Maple Botanical');

  // Suggestions state
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Context-aware fallback generator
  const generateContextualSuggestions = (bizNameRaw: string, bizType: string): ProfileSuggestion[] => {
    const bizName = bizNameRaw.trim() || 'Our Business';

    if (bizType.includes('Retailer') || bizType.includes('Handcrafted')) {
      return [
        {
          id: 'sug-1',
          archetype: 'Artisanal & Sustainable',
          badge: 'Most Popular',
          tagline: 'Thoughtfully crafted goods for mindful everyday spaces.',
          description: `${bizName} curates premium handcrafted goods and sustainable essentials made with timeless design and ethical craftsmanship. Every piece is selected to bring warmth, comfort, and character into your home.`,
          supportTone: 'Warm, thoughtful, and personal',
          template: 'Maple Botanical',
          recommendedHours: 'Monday - Friday, 9:00 AM - 6:00 PM EST',
          highlights: ['Small-batch studio craft', 'Eco-friendly sustainable packaging', 'Dedicated human customer care']
        },
        {
          id: 'sug-2',
          archetype: 'Modern Minimalist Studio',
          badge: 'Sleek & Contemporary',
          tagline: 'Elevated design meets everyday functional elegance.',
          description: `${bizName} is a contemporary online destination delivering clean aesthetic decor and handcrafted pieces designed for modern living. We prioritize quality materials, functional beauty, and seamless customer service.`,
          supportTone: 'Clear, courteous, and efficient',
          template: 'Modern Clean',
          recommendedHours: 'Monday - Saturday, 10:00 AM - 7:00 PM EST',
          highlights: ['Contemporary minimalist aesthetic', 'Fast dependable fulfillment', 'Hassle-free return policy']
        },
        {
          id: 'sug-3',
          archetype: 'Heritage & Community Workshop',
          badge: 'Artisan Heritage',
          tagline: 'Rooted in authentic tradition and studio craftsmanship.',
          description: `Founded on a passion for authentic studio craft, ${bizName} connects independent artisans with customers who cherish original workmanship. From custom orders to limited seasonal releases, we honor genuine craft.`,
          supportTone: 'Friendly, welcoming, and knowledgeable',
          template: 'Warm Artisan',
          recommendedHours: 'Tuesday - Saturday, 10:00 AM - 5:00 PM EST',
          highlights: ['Direct studio artisan access', 'Custom gift boxing available', 'Authentic material provenance']
        }
      ];
    }

    if (bizType.includes('Consulting') || bizType.includes('Professional')) {
      return [
        {
          id: 'sug-1',
          archetype: 'Strategic Advisory & Growth',
          badge: 'Executive Focus',
          tagline: 'Empowering visionary leaders with actionable strategic clarity.',
          description: `${bizName} provides specialized consulting services that help businesses navigate growth, streamline operations, and unlock sustainable value. We combine deep domain expertise with tailored, hands-on guidance.`,
          supportTone: 'Insightful, consultative, and strategic',
          template: 'Modern Clean',
          recommendedHours: 'Monday - Friday, 8:30 AM - 5:30 PM EST',
          highlights: ['Senior executive advisory', 'Measurable milestone frameworks', 'Confidential partnership']
        },
        {
          id: 'sug-2',
          archetype: 'Boutique Client Partner',
          badge: 'High-Touch Care',
          tagline: 'Dedicated consultative care tailored to your unique challenges.',
          description: `At ${bizName}, we believe transformative consulting starts with listening. We work side-by-side with your team to craft practical solutions, eliminate bottlenecks, and build lasting organizational capability.`,
          supportTone: 'Collaborative, empathetic, and attentive',
          template: 'Maple Botanical',
          recommendedHours: 'Monday - Friday, 9:00 AM - 6:00 PM EST',
          highlights: ['1-on-1 advisor access', 'Bespoke strategic engagements', 'Transparent milestone delivery']
        },
        {
          id: 'sug-3',
          archetype: 'Agile Innovation Specialist',
          badge: 'Fast & Dynamic',
          tagline: 'Modern solutions designed for rapid execution and market impact.',
          description: `${bizName} delivers agile advisory and specialized project consulting to help ambitious businesses adapt, innovate, and execute with confidence in evolving markets.`,
          supportTone: 'Dynamic, direct, and solution-focused',
          template: 'Warm Artisan',
          recommendedHours: 'Monday - Friday, 9:00 AM - 5:00 PM EST',
          highlights: ['Rapid turnaround delivery', 'Practical actionable playbooks', 'Continuous advisory support']
        }
      ];
    }

    if (bizType.includes('Food') || bizType.includes('Café') || bizType.includes('Restaurant')) {
      return [
        {
          id: 'sug-1',
          archetype: 'Artisan Farm-to-Table',
          badge: "Chef's Selection",
          tagline: 'Fresh local ingredients, handcrafted flavors, and warm hospitality.',
          description: `${bizName} is dedicated to serving fresh, seasonal culinary creations and specialty beverages made with care. We partner with local producers to celebrate quality ingredients and community dining.`,
          supportTone: 'Warm, hospitable, and vibrant',
          template: 'Maple Botanical',
          recommendedHours: 'Daily, 7:00 AM - 8:00 PM EST',
          highlights: ['100% locally sourced produce', 'Daily seasonal specials', 'Cozy community seating']
        },
        {
          id: 'sug-2',
          archetype: 'Modern Gourmet & Espresso Bar',
          badge: 'Urban Flavor',
          tagline: 'Exceptional specialty roasts, culinary craft, and vibrant energy.',
          description: `Experience the craft of specialty coffee and contemporary artisan dining at ${bizName}. From morning roasts to afternoon treats, we craft every bite and brew with passion.`,
          supportTone: 'Upbeat, friendly, and welcoming',
          template: 'Modern Clean',
          recommendedHours: 'Monday - Sunday, 6:30 AM - 6:00 PM EST',
          highlights: ['Single-origin espresso bar', 'Fresh daily artisan bakery', 'Convenient online ordering']
        },
        {
          id: 'sug-3',
          archetype: 'Cozy Neighborhood Haven',
          badge: 'Neighborhood Gem',
          tagline: 'Your comfortable local retreat for comforting classics.',
          description: `Welcome home to ${bizName}. We are your neighborhood spot for comforting favorites, welcoming smiles, and memorable shared moments with friends and family.`,
          supportTone: 'Comforting, cheerful, and attentive',
          template: 'Warm Artisan',
          recommendedHours: 'Tuesday - Sunday, 8:00 AM - 9:00 PM EST',
          highlights: ['Comfort dining favorites', 'Community gathering events', 'Warm welcoming atmosphere']
        }
      ];
    }

    if (bizType.includes('Repair') || bizType.includes('Local Service')) {
      return [
        {
          id: 'sug-1',
          archetype: 'Certified Master Excellence',
          badge: 'Top Reliability',
          tagline: 'Dependable, transparent, and certified local service excellence.',
          description: `${bizName} delivers prompt, certified repair and maintenance services backed by honest upfront estimates and a quality guarantee. We treat your property with the utmost care and respect.`,
          supportTone: 'Honest, reliable, and straightforward',
          template: 'Modern Clean',
          recommendedHours: 'Monday - Saturday, 8:00 AM - 6:00 PM EST',
          highlights: ['Upfront transparent pricing', 'Fully licensed and insured', 'Workmanship guarantee']
        },
        {
          id: 'sug-2',
          archetype: 'Rapid Response Specialist',
          badge: 'Fast Dispatch',
          tagline: 'Fast diagnostics, skilled repairs, and dedicated local support.',
          description: `When you need fast and dependable service, ${bizName} is there. Our experienced technicians provide prompt diagnostics, clear communication, and durable repairs you can count on.`,
          supportTone: 'Responsive, reassuring, and professional',
          template: 'Warm Artisan',
          recommendedHours: 'Monday - Friday, 7:30 AM - 6:30 PM (Emergency on-call)',
          highlights: ['Same-day emergency response', 'Direct technician communication', 'No surprise diagnostic fees']
        },
        {
          id: 'sug-3',
          archetype: 'Complete Care & Maintenance',
          badge: 'Long-term Care',
          tagline: 'Protecting your investment with thorough care and trusted solutions.',
          description: `${bizName} provides holistic service packages and preventive maintenance to keep your equipment running smoothly and prevent costly future breakdowns.`,
          supportTone: 'Knowledgeable, thorough, and helpful',
          template: 'Maple Botanical',
          recommendedHours: 'Monday - Friday, 8:00 AM - 5:00 PM EST',
          highlights: ['Comprehensive preventative checkups', 'Detailed maintenance records', 'Dedicated support specialist']
        }
      ];
    }

    // Default / Custom category
    return [
      {
        id: 'sug-1',
        archetype: 'Premium & Client-Focused',
        badge: 'Recommended',
        tagline: `Exceptional ${bizType.toLowerCase()} delivered with integrity and care.`,
        description: `${bizName} is committed to delivering outstanding ${bizType.toLowerCase()} with precision and personalized client service. We prioritize lasting quality and customer satisfaction in everything we do.`,
        supportTone: 'Warm, professional, and attentive',
        template: 'Maple Botanical',
        recommendedHours: 'Monday - Friday, 9:00 AM - 5:00 PM EST',
        highlights: ['Quality assurance guarantee', 'Tailored customer solutions', 'Fast and responsive support']
      },
      {
        id: 'sug-2',
        archetype: 'Modern & Scalable Solutions',
        badge: 'Contemporary',
        tagline: `Innovative approaches to ${bizType.toLowerCase()} for modern needs.`,
        description: `At ${bizName}, we bring modern methodology and fresh thinking to ${bizType.toLowerCase()}. Our team ensures seamless experiences, clear communication, and consistent results.`,
        supportTone: 'Clear, courteous, and efficient',
        template: 'Modern Clean',
        recommendedHours: 'Monday - Friday, 8:30 AM - 5:30 PM EST',
        highlights: ['Streamlined digital processes', 'Transparent project tracking', 'Professional expertise']
      },
      {
        id: 'sug-3',
        archetype: 'Trusted Community Partner',
        badge: 'Community-First',
        tagline: `Your trusted local partner for dependable ${bizType.toLowerCase()}.`,
        description: `Proudly serving our clients with dedication, ${bizName} offers dependable ${bizType.toLowerCase()} built on trust, transparency, and personal relationships.`,
        supportTone: 'Friendly, welcoming, and helpful',
        template: 'Warm Artisan',
        recommendedHours: 'Monday - Saturday, 9:00 AM - 6:00 PM EST',
        highlights: ['Locally owned and operated', 'Dedicated personal assistance', 'Proven customer track record']
      }
    ];
  };

  // Generate suggestions on load or when moving to Step 2
  const loadSuggestions = async (forceAi = false) => {
    // Immediate contextual defaults
    const contextDefaults = generateContextualSuggestions(name, type);
    
    if (!forceAi && suggestions.length > 0) return;

    if (forceAi) {
      setIsGeneratingAi(true);
      try {
        const res = await fetch('/api/ai/suggest-profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, type })
        });
        const data = await res.json();
        if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length >= 3) {
          setSuggestions(data.suggestions);
          applySuggestion(data.suggestions[0]);
          setIsGeneratingAi(false);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch AI suggestions, using context defaults:', err);
      }
      setIsGeneratingAi(false);
    }

    setSuggestions(contextDefaults);
    if (!selectedSuggestionId || forceAi) {
      applySuggestion(contextDefaults[0]);
    }
  };

  const applySuggestion = (sug: ProfileSuggestion) => {
    setSelectedSuggestionId(sug.id);
    setTagline(sug.tagline);
    setDescription(sug.description);
    setSupportTone(sug.supportTone);
    setTemplate(sug.template);
    setHours(sug.recommendedHours);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) return;
      loadSuggestions(false);
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!description.trim() && suggestions.length > 0) {
        applySuggestion(suggestions[0]);
      }
      setStep(3);
      return;
    }
  };

  const handleFinish = () => {
    const generatedSlug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const finalProfile: BusinessProfile = {
      name: name.trim() || 'My New Business',
      slug: generatedSlug || 'my-business',
      tagline: tagline.trim() || 'Professional services & quality products',
      published: true,
      template,
      type,
      description: description.trim() || (suggestions[0]?.description ?? 'Providing exceptional services and products.'),
      contactEmail: email.trim() || 'contact@business.com',
      contactPhone: phone.trim() || '+1 (555) 000-0000',
      businessHours: hours,
      timeZone: 'America/New_York',
      supportTone: supportTone || 'Warm, helpful, professional, and clear',
      escalationInstructions: 'Flag urgent inquiries for human review.',
      emergencyStopActive: false
    };
    onCompleteRegistration(finalProfile);
  };

  const selectedProfile = suggestions.find(s => s.id === selectedSuggestionId) || suggestions[0];

  return (
    <div className="fixed inset-0 z-50 bg-[#26372D]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-8 space-y-8 shadow-2xl border border-[#DCE2DC] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DCE2DC] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#497A58] flex items-center justify-center text-white font-bold shadow-sm">
              <Shield className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#26372D]">CIPHER Launch • Business Registration</h2>
              <p className="text-xs text-[#66716A]">Step {step} of 3 • Smart Profile Assistant</p>
            </div>
          </div>
          <button 
            onClick={onCancel} 
            className="text-[#66716A] hover:text-[#27332B] p-2 rounded-xl hover:bg-[#F0F2EF] transition-colors font-bold text-sm"
            aria-label="Close setup"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`h-2 rounded-full transition-all ${step >= 1 ? 'bg-[#497A58]' : 'bg-[#DCE2DC]'}`} />
          <div className={`h-2 rounded-full transition-all ${step >= 2 ? 'bg-[#497A58]' : 'bg-[#DCE2DC]'}`} />
          <div className={`h-2 rounded-full transition-all ${step >= 3 ? 'bg-[#497A58]' : 'bg-[#DCE2DC]'}`} />
        </div>

        {/* Step 1: Business Identity */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#26372D]">1. Business Identity</h3>
              <p className="text-xs text-[#66716A]">Enter your trading name and category. In the next step, CIPHER will automatically generate 3 tailored business profile suggestions for you to choose from.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#66716A] mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alpine Coffee Roasters or Meadow & Pine Studio"
                  className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#497A58] focus:bg-white transition-all text-[#27332B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#66716A] mb-1">Business Category / Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#497A58] focus:bg-white transition-all text-[#27332B]"
                >
                  <option value="Small Online Retailer & Handcrafted Goods">Small Online Retailer & Handcrafted Goods</option>
                  <option value="Professional Services & Consulting">Professional Services & Consulting</option>
                  <option value="Café, Restaurant or Food Service">Café, Restaurant or Food Service</option>
                  <option value="Local Service Business & Repairs">Local Service Business & Repairs</option>
                  <option value="Independent Creative Agency">Independent Creative Agency</option>
                  <option value="Health & Wellness Practice">Health & Wellness Practice</option>
                  <option value="Education & Private Tutoring">Education & Private Tutoring</option>
                </select>
              </div>

              <div className="bg-[#E5EDE5] p-4 rounded-2xl border border-[#DCE2DC] text-xs text-[#26372D] flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#497A58] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Smart Profile Generator</p>
                  <p className="text-[#66716A] text-xs mt-0.5">When you proceed, CIPHER will automatically construct 3 context-aware profile suggestions (complete with taglines, descriptions, support tone, and recommended templates) so you don't have to write anything from scratch!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Smart Profile Suggestions & Contact */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[#26372D] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#497A58]" />
                  <span>3 Smart Profile Suggestions for {name || 'Your Business'}</span>
                </h3>
                <p className="text-xs text-[#66716A]">Select one of CIPHER's tailored profiles below to instantly pre-fill your business details.</p>
              </div>

              <button
                type="button"
                onClick={() => loadSuggestions(true)}
                disabled={isGeneratingAi}
                className="bg-[#E5EDE5] hover:bg-[#d5e3d5] text-[#26372D] text-xs font-semibold px-3.5 py-2 rounded-xl transition-all border border-[#DCE2DC] flex items-center gap-1.5 shrink-0 self-start sm:self-auto disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#497A58] ${isGeneratingAi ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAi ? 'Generating...' : 'Regenerate with AI'}</span>
              </button>
            </div>

            {/* 3 Smart Profile Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suggestions.map((sug) => {
                const isSelected = selectedSuggestionId === sug.id;
                return (
                  <div
                    key={sug.id}
                    onClick={() => applySuggestion(sug)}
                    className={`rounded-2xl p-5 border cursor-pointer transition-all flex flex-col justify-between relative shadow-sm ${
                      isSelected
                        ? 'bg-[#F7F9F6] border-[#497A58] ring-2 ring-[#497A58] shadow-md'
                        : 'bg-white border-[#DCE2DC] hover:border-[#497A58]/50 hover:bg-[#F7F9F6]/50'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E5EDE5] text-[#497A58] px-2.5 py-0.5 rounded-full border border-[#DCE2DC]">
                          {sug.badge}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#497A58] bg-emerald-100 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-[#26372D] leading-snug">{sug.archetype}</h4>
                      
                      <p className="text-xs text-[#497A58] font-medium italic border-l-2 border-[#497A58] pl-2">
                        "{sug.tagline}"
                      </p>

                      <p className="text-xs text-[#66716A] leading-relaxed line-clamp-4">
                        {sug.description}
                      </p>

                      <div className="pt-2 border-t border-[#DCE2DC] space-y-1.5">
                        <div className="text-[11px] text-[#26372D]">
                          <strong className="text-[#66716A]">Tone:</strong> {sug.supportTone}
                        </div>
                        <div className="text-[11px] text-[#26372D]">
                          <strong className="text-[#66716A]">Theme:</strong> {sug.template}
                        </div>
                        <ul className="text-[11px] text-[#66716A] space-y-1 pt-1">
                          {sug.highlights.map((h, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-[#497A58] shrink-0" />
                              <span className="truncate">{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-4 mt-3 border-t border-[#DCE2DC]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          applySuggestion(sug);
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#497A58] text-white shadow-sm'
                            : 'bg-[#F0F2EF] text-[#27332B] hover:bg-[#E5EDE5]'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Selected Profile</span>
                          </>
                        ) : (
                          <span>Apply This Profile</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Editable Profile Inputs (Pre-filled) */}
            <div className="bg-[#F7F9F6] p-6 rounded-2xl border border-[#DCE2DC] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#26372D] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#497A58]" />
                  <span>Applied Profile Details (You can freely customize):</span>
                </span>
                <span className="text-[11px] text-[#66716A]">Archetype: {selectedProfile?.archetype}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#66716A] mb-1">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Inspirational 1-sentence motto..."
                  className="w-full text-sm bg-white border border-[#DCE2DC] rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-[#497A58] text-[#27332B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#66716A] mb-1">Business Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your business mission, products, and values..."
                  className="w-full text-sm bg-white border border-[#DCE2DC] rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-[#497A58] text-[#27332B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Public Support Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@business.com"
                    className="w-full text-sm bg-white border border-[#DCE2DC] rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-[#497A58] text-[#27332B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Public Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full text-sm bg-white border border-[#DCE2DC] rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-[#497A58] text-[#27332B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Business Hours</label>
                  <input
                    type="text"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-full text-sm bg-white border border-[#DCE2DC] rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-[#497A58] text-[#27332B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Support Tone</label>
                  <input
                    type="text"
                    value={supportTone}
                    onChange={(e) => setSupportTone(e.target.value)}
                    className="w-full text-sm bg-white border border-[#DCE2DC] rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-[#497A58] text-[#27332B]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Template & Launch Confirmation */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#26372D]">3. Choose Website Theme & Launch</h3>
              <p className="text-xs text-[#66716A]">Confirm your visual style. CIPHER will automatically generate your published site and online workspace.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['Maple Botanical', 'Modern Clean', 'Warm Artisan'] as const).map((tmpl) => (
                <div
                  key={tmpl}
                  onClick={() => setTemplate(tmpl)}
                  className={`p-4 rounded-2xl border cursor-pointer text-center transition-all ${
                    template === tmpl ? 'bg-[#E5EDE5] border-[#497A58] ring-2 ring-[#497A58]' : 'bg-[#F0F2EF] border-[#DCE2DC] hover:bg-white'
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-[#497A58] mx-auto mb-2" />
                  <span className="font-bold text-xs text-[#26372D] block">{tmpl}</span>
                  <span className="text-[10px] text-[#66716A] mt-1 block">
                    {tmpl === 'Maple Botanical' && 'Soft sage & organic greens'}
                    {tmpl === 'Modern Clean' && 'High-contrast minimalist'}
                    {tmpl === 'Warm Artisan' && 'Warm earthy craft tones'}
                  </span>
                </div>
              ))}
            </div>

            {/* Launch Summary Card */}
            <div className="bg-[#E5EDE5] p-5 rounded-2xl border border-[#DCE2DC] text-xs text-[#26372D] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE2DC]">
                <p className="font-bold text-sm text-[#26372D] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#497A58]" />
                  <span>Launch Summary for {name}</span>
                </p>
                <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-[#DCE2DC]">
                  /sites/{name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#66716A] block">Category:</span>
                  <span className="font-semibold text-[#26372D]">{type}</span>
                </div>
                <div>
                  <span className="text-[#66716A] block">Tagline:</span>
                  <span className="font-semibold text-[#26372D] italic">"{tagline}"</span>
                </div>
                <div>
                  <span className="text-[#66716A] block">Support Tone:</span>
                  <span className="font-semibold text-[#26372D]">{supportTone}</span>
                </div>
                <div>
                  <span className="text-[#66716A] block">Website Theme:</span>
                  <span className="font-semibold text-[#26372D]">{template}</span>
                </div>
              </div>

              <p className="text-[11px] text-[#66716A] pt-1">
                Clicking "Launch Business Workspace" will establish your business website, configure your CIPHER Guide AI assistant, initialize your catalogue, and open your central operations command desk.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#DCE2DC]">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#F0F2EF] text-[#27332B] hover:bg-[#E5EDE5] flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={step === 1 && !name.trim()}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#497A58] hover:bg-[#385f44] text-white flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-sm"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-8 py-3 rounded-xl text-xs font-semibold bg-[#497A58] hover:bg-[#385f44] text-white flex items-center gap-2 shadow-md transition-all transform hover:scale-[1.01]"
            >
              <span>Launch Business Workspace</span>
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

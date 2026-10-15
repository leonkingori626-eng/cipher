import React from 'react';
import { Shield, Sparkles, CheckCircle2, ArrowRight, Users, Lock, HeartHandshake, Headphones, BarChart3 } from 'lucide-react';

interface LandingPageProps {
  setCurrentView: (view: string) => void;
  onOpenDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setCurrentView, onOpenDemo }) => {
  return (
    <div className="bg-[#F7F9F6] text-[#27332B] min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 bg-[#E5EDE5] text-[#26372D] px-4 py-2 rounded-full text-xs font-semibold tracking-wide border border-[#DCE2DC]">
              <Sparkles className="w-4 h-4 text-[#497A58]" />
              <span>Human-Centred AI for Growing Businesses</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#26372D] leading-[1.15]">
              Better support. <br />
              <span className="text-[#497A58]">More room to grow.</span>
            </h1>

            <p className="text-lg text-[#66716A] leading-relaxed max-w-2xl font-normal">
              CIPHER helps your business respond to everyday questions, organize customer enquiries, and bring in a person whenever a conversation needs a human touch.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={() => setCurrentView('interactive-demo')}
                className="bg-[#497A58] hover:bg-[#385f44] text-white font-semibold px-8 py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-3 text-base focus:ring-2 focus:ring-[#497A58] focus:ring-offset-2"
              >
                <span>Explore the live demo</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentView('how-it-works')}
                className="bg-white hover:bg-[#E5EDE5] text-[#26372D] font-semibold px-8 py-4 rounded-xl border border-[#DCE2DC] shadow-sm transition-all flex items-center justify-center gap-2 text-base"
              >
                <span>See how it works</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[#DCE2DC] text-left">
              <div>
                <p className="text-2xl font-bold text-[#26372D]">100%</p>
                <p className="text-xs text-[#66716A]">Grounded in your policies</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#26372D]">Seamless</p>
                <p className="text-xs text-[#66716A]">Human handoff queue</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#26372D]">Secure</p>
                <p className="text-xs text-[#66716A]">Workspace isolation</p>
              </div>
            </div>
          </div>

          {/* Hero Visual Card / Preview */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-[#DCE2DC] relative">
              <div className="absolute -top-3 -right-3 bg-[#497A58] text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                Maple & Moss Demo
              </div>
              <div className="flex items-center gap-3 pb-4 border-b border-[#DCE2DC]">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-xs text-[#66716A] ml-2 font-mono">cipher-desk-preview.app</span>
              </div>

              <div className="py-4 space-y-4">
                <div className="bg-[#F7F9F6] p-3 rounded-2xl text-xs space-y-2 border border-[#DCE2DC]">
                  <p className="font-semibold text-[#26372D]">Customer (Elena):</p>
                  <p className="text-[#66716A]">"What is your return policy on handcrafted ceramics?"</p>
                </div>

                <div className="bg-[#E5EDE5] p-3 rounded-2xl text-xs space-y-2 border border-[#DCE2DC]">
                  <div className="flex items-center gap-1.5 text-[#497A58] font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>CIPHER Assistant (Verified Policy):</span>
                  </div>
                  <p className="text-[#27332B]">"We accept unwashed, undamaged items in original packaging within 30 days of delivery for a full refund minus original shipping costs ($5 return label fee)."</p>
                </div>

                <div className="bg-amber-50 p-3 rounded-2xl text-xs space-y-1.5 border border-amber-200">
                  <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>Handoff Triggered:</span>
                  </div>
                  <p className="text-amber-900">"Customer requested order address modification. Assigned to Sarah Jenkins."</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onOpenDemo}
                  className="w-full bg-[#26372D] hover:bg-[#1a261f] text-white text-xs font-semibold py-3 rounded-xl transition-all text-center flex items-center justify-center gap-2"
                >
                  <span>Open Operator Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-white py-20 border-y border-[#DCE2DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#26372D]">
              Built around five human values
            </h2>
            <p className="text-[#66716A] text-base">
              Technology should respect people. Here is how CIPHER keeps human dignity and clarity at the heart of your business ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F7F9F6] p-8 rounded-2xl border border-[#DCE2DC] space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#E5EDE5] flex items-center justify-center text-[#497A58]">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#26372D]">1. People come first</h3>
              <p className="text-sm text-[#66716A] leading-relaxed">
                AI handles routine questions instantly so your team can focus on meaningful relationships and complex problem-solving.
              </p>
            </div>

            <div className="bg-[#F7F9F6] p-8 rounded-2xl border border-[#DCE2DC] space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#E5EDE5] flex items-center justify-center text-[#497A58]">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#26372D]">2. AI helps, never dominates</h3>
              <p className="text-sm text-[#66716A] leading-relaxed">
                The assistant never invents policies or prices. If certainty is missing, it transparently hands over to a human operator.
              </p>
            </div>

            <div className="bg-[#F7F9F6] p-8 rounded-2xl border border-[#DCE2DC] space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#E5EDE5] flex items-center justify-center text-[#497A58]">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#26372D]">3. Privacy, safety & trust</h3>
              <p className="text-sm text-[#66716A] leading-relaxed">
                Workspace isolation, rigorous prompt-injection defense, and complete audit trails ensure your business data remains protected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three Step Workflow */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-[#26372D]">
            How CIPHER Desk works for your business
          </h2>
          <p className="text-[#66716A] text-base">
            From inbound question to verified resolution in three calm steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-[#DCE2DC] space-y-4 relative shadow-sm">
            <span className="absolute top-6 right-6 text-2xl font-bold text-[#DCE2DC]">01</span>
            <div className="w-10 h-10 rounded-lg bg-[#497A58] text-white flex items-center justify-center font-bold">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#26372D]">Organize your knowledge</h3>
            <p className="text-sm text-[#66716A] leading-relaxed">
              Add your shipping rates, return policies, and product details into approved knowledge categories.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#DCE2DC] space-y-4 relative shadow-sm">
            <span className="absolute top-6 right-6 text-2xl font-bold text-[#DCE2DC]">02</span>
            <div className="w-10 h-10 rounded-lg bg-[#497A58] text-white flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#26372D]">Ground AI responses</h3>
            <p className="text-sm text-[#66716A] leading-relaxed">
              The support assistant answers routine customer enquiries instantly using only your verified policies.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#DCE2DC] space-y-4 relative shadow-sm">
            <span className="absolute top-6 right-6 text-2xl font-bold text-[#DCE2DC]">03</span>
            <div className="w-10 h-10 rounded-lg bg-[#497A58] text-white flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#26372D]">Human handoff when needed</h3>
            <p className="text-sm text-[#66716A] leading-relaxed">
              Complex or sensitive issues flow directly into an operator queue for personal attention and resolution.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#26372D] text-white py-12 px-4 sm:px-6 lg:px-8 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-[#3b5243]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#497A58] flex items-center justify-center text-white font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg">CIPHER</span>
            </div>
            <p className="text-xs text-emerald-200 leading-relaxed">
              Human-centred AI business ecosystem helping independent tutors, retailers, and agencies support customers with clarity and respect.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-emerald-100">Product</h4>
            <ul className="space-y-2 text-xs text-emerald-200">
              <li><button onClick={() => setCurrentView('features')} className="hover:text-white">CIPHER Desk</button></li>
              <li><button onClick={() => setCurrentView('interactive-demo')} className="hover:text-white">Live AI Demo</button></li>
              <li><button onClick={() => setCurrentView('how-it-works')} className="hover:text-white">Architecture</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-emerald-100">Trust & Safety</h4>
            <ul className="space-y-2 text-xs text-emerald-200">
              <li><button onClick={() => setCurrentView('privacy')} className="hover:text-white">Privacy Policy</button></li>
              <li><button onClick={() => setCurrentView('privacy')} className="hover:text-white">Data Protection</button></li>
              <li><button onClick={() => setCurrentView('how-it-works')} className="hover:text-white">Prompt Guardrails</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-emerald-100">Operator Workspace</h4>
            <p className="text-xs text-emerald-200 mb-4">Access your business workspace to manage conversations and knowledge.</p>
            <button
              onClick={onOpenDemo}
              className="bg-[#497A58] hover:bg-[#385f44] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
            >
              Open CIPHER Desk
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300">
          <p>© 2026 CIPHER Ecosystem Inc. All rights reserved.</p>
          <p>Designed with maple green, calm daylight, and human respect.</p>
        </div>
      </footer>
    </div>
  );
};

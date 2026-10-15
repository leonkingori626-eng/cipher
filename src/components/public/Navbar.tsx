import React from 'react';
import { Shield, Sparkles, LayoutDashboard, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onOpenDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView, onOpenDemo }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#DCE2DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#26372D] flex items-center justify-center text-white font-bold shadow-sm transition-transform group-hover:scale-105">
            <Shield className="w-5 h-5 text-[#497A58]" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-[#26372D]">CIPHER</span>
            <span className="block text-[11px] text-[#66716A] font-medium tracking-wide">Human-Centred AI Ecosystem</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#27332B]">
          <button 
            onClick={() => setCurrentView('landing')} 
            className={`transition-colors hover:text-[#497A58] ${currentView === 'landing' ? 'text-[#497A58] font-semibold' : ''}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setCurrentView('features')} 
            className={`transition-colors hover:text-[#497A58] ${currentView === 'features' ? 'text-[#497A58] font-semibold' : ''}`}
          >
            Product & Features
          </button>
          <button 
            onClick={() => setCurrentView('interactive-demo')} 
            className={`transition-colors hover:text-[#497A58] ${currentView === 'interactive-demo' ? 'text-[#497A58] font-semibold' : ''}`}
          >
            Live Demo
          </button>
          <button 
            onClick={() => setCurrentView('how-it-works')} 
            className={`transition-colors hover:text-[#497A58] ${currentView === 'how-it-works' ? 'text-[#497A58] font-semibold' : ''}`}
          >
            How It Works
          </button>
          <button 
            onClick={() => setCurrentView('privacy')} 
            className={`transition-colors hover:text-[#497A58] ${currentView === 'privacy' ? 'text-[#497A58] font-semibold' : ''}`}
          >
            Privacy & Safety
          </button>
        </nav>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => setCurrentView('interactive-demo')}
            className="text-sm font-medium text-[#27332B] hover:text-[#497A58] px-3 py-2"
          >
            Explore Demo
          </button>
          <button
            onClick={onOpenDemo}
            className="bg-[#497A58] hover:bg-[#385f44] text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#497A58] focus:ring-offset-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Open CIPHER Desk</span>
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#27332B] p-2 rounded-lg focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#DCE2DC] px-4 pt-2 pb-6 space-y-3">
          <button 
            onClick={() => { setCurrentView('landing'); setMobileMenuOpen(false); }} 
            className="block w-full text-left py-2 text-[#27332B] font-medium"
          >
            Overview
          </button>
          <button 
            onClick={() => { setCurrentView('features'); setMobileMenuOpen(false); }} 
            className="block w-full text-left py-2 text-[#27332B] font-medium"
          >
            Product & Features
          </button>
          <button 
            onClick={() => { setCurrentView('interactive-demo'); setMobileMenuOpen(false); }} 
            className="block w-full text-left py-2 text-[#27332B] font-medium"
          >
            Live Demo
          </button>
          <button 
            onClick={() => { setCurrentView('how-it-works'); setMobileMenuOpen(false); }} 
            className="block w-full text-left py-2 text-[#27332B] font-medium"
          >
            How It Works
          </button>
          <button 
            onClick={() => { setCurrentView('privacy'); setMobileMenuOpen(false); }} 
            className="block w-full text-left py-2 text-[#27332B] font-medium"
          >
            Privacy & Safety
          </button>
          <div className="pt-2 border-t border-[#DCE2DC] flex flex-col gap-2">
            <button
              onClick={() => { onOpenDemo(); setMobileMenuOpen(false); }}
              className="w-full bg-[#497A58] text-white text-center py-2.5 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Open CIPHER Desk</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

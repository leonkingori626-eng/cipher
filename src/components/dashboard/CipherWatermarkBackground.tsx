import React from 'react';

export const CipherWatermarkBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Sage Mist & Touch of Color Atmospheric Gradients matching the user's uploaded image */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-emerald-600/6 blur-[120px]" />
      <div className="absolute top-1/4 -left-40 w-[700px] h-[700px] rounded-full bg-teal-800/6 blur-[140px]" />
      <div className="absolute -bottom-40 right-1/3 w-[800px] h-[800px] rounded-full bg-[#3b5c46]/6 blur-[150px]" />

      {/* Subtle Central Watermark Logo / Emblem matching the user's uploaded image style */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.045]">
        <div className="flex flex-col items-center text-center transform scale-125">
          <svg className="w-[420px] h-[420px] text-emerald-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.6">
            <path d="M12 2l7 4v5c0 5.25-3.5 10.15-7 11.25C8.5 21.15 5 16.25 5 11V6l7-4z" />
            <circle cx="12" cy="7" r="1.5" fill="currentColor" />
            <circle cx="8.5" cy="13" r="1.5" fill="currentColor" />
            <circle cx="15.5" cy="13" r="1.5" fill="currentColor" />
            <circle cx="12" cy="17.5" r="1.5" fill="currentColor" />
            <line x1="12" y1="8.5" x2="8.5" y2="11.5" stroke="currentColor" strokeWidth="0.5" />
            <line x1="12" y1="8.5" x2="15.5" y2="11.5" stroke="currentColor" strokeWidth="0.5" />
            <line x1="8.5" y1="14.5" x2="12" y2="16" stroke="currentColor" strokeWidth="0.5" />
            <line x1="15.5" y1="14.5" x2="12" y2="16" stroke="currentColor" strokeWidth="0.5" />
          </svg>
          <span className="font-serif font-bold text-7xl tracking-[0.35em] text-emerald-950 mt-6">CIPHER</span>
          <span className="text-sm uppercase tracking-[0.3em] text-emerald-900 font-medium mt-2">Premium Business Ecosystem Software</span>
        </div>
      </div>
    </div>
  );
};

'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenDemo = localStorage.getItem('settleiq-welcome-dismissed');
    if (!hasSeenDemo) {
      const timer = setTimeout(() => setIsVisible(true), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('settleiq-welcome-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="relative mb-6 p-4 border border-[#DEDBD1] bg-[#FAF9F5] text-[#2B2D27] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3">
        <div className="grid h-8 w-8 place-items-center bg-[#20231C] text-[#C7F36B] shrink-0 mt-0.5 sm:mt-0 shadow-[2px_2px_0_#C7F36B]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#2B2D27]">
            Welcome to SettleIQ — Autonomous Revenue Recovery OS
          </h4>
          <p className="text-xs text-[#85867E] mt-0.5">
            A bounded autonomy agent for finance and growth teams that intercepts involuntary payment failures across Indian payment rails.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          onClick={handleDismiss}
          className="p-1 text-[#85867E] hover:text-[#2B2D27] transition-colors cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}



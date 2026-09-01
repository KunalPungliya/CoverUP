'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenDemo = localStorage.getItem('vaultback-welcome-dismissed');
    if (!hasSeenDemo) {
      const timer = setTimeout(() => setIsVisible(true), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('vaultback-welcome-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="relative mb-6 p-4 rounded-xl border border-[#E2E5EB] bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3">
        <div className="p-2 rounded-lg bg-zinc-950 text-[#FDDD35] shrink-0 mt-0.5 sm:mt-0 border border-zinc-800">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-zinc-950">
            Welcome to VaultBack — Autonomous AI Revenue Recovery
          </h4>
          <p className="text-xs text-zinc-600 mt-0.5">
            Click <strong>&quot;Seed Data&quot;</strong> to populate curated at-risk subscriptions, then <strong>&quot;Run Recovery&quot;</strong> to watch the agent intercept failed payments in real-time.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          onClick={handleDismiss}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-slate-100 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}


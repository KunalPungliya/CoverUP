'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenDemo = localStorage.getItem('coverup-demo-banner-dismissed');
    if (!hasSeenDemo) {
      const timer = setTimeout(() => setIsVisible(true), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('coverup-demo-banner-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="relative mb-6 p-4 rounded-xl border border-gray-200 bg-gray-50/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0 mt-0.5 sm:mt-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">
            Welcome to CoverUP — Autonomous AI Revenue Recovery
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Click <strong>&quot;Seed Data&quot;</strong> to populate curated at-risk subscriptions, then <strong>&quot;Run Recovery&quot;</strong> to watch the agent intercept failed payments in real-time.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
        <Link
          href="/demo"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
        >
          View Demo Guide <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

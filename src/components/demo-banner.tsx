'use client';

import { useState, useEffect } from 'react';
import { X, Rocket } from 'lucide-react';

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenDemo = localStorage.getItem('coverup-demo-banner-dismissed');
    if (!hasSeenDemo) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('coverup-demo-banner-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl mb-8 shadow-md relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-4 pr-8 relative z-10">
        <div className="bg-white/20 p-2 rounded-full shrink-0">
          <Rocket className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="font-semibold text-white">🚀 Welcome to CoverUP</p>
          <p className="text-blue-50 text-sm mt-1">
            Click 'Seed Data' to generate test subscriptions, then 'Run Recovery' to see the AI in action!
          </p>
        </div>
      </div>
      
      <button 
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-blue-100 hover:text-white transition-colors z-10 p-1 rounded-md hover:bg-white/20"
        aria-label="Dismiss demo banner"
      >
        <X className="h-5 w-5" />
      </button>
      
      {/* Decorative background elements */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-400 opacity-20 rounded-full blur-2xl"></div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Activity, Radio, RefreshCw, Check, Zap, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HeartbeatPulse() {
  const [pulseTime, setPulseTime] = useState('12:04:18');
  const [isPulsing, setIsPulsing] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [eventCount, setEventCount] = useState(100);

  useEffect(() => {
    const triggerPulse = () => {
      const now = new Date();
      setPulseTime(now.toTimeString().split(' ')[0]);
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 2500);
    };

    triggerPulse();
    const interval = setInterval(triggerPulse, 28000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-30 hidden sm:block animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className={cn(
        "border border-[#30342C] bg-[#171914]/95 text-[#F2F0E6] shadow-xl backdrop-blur transition-all duration-200",
        minimized ? "px-3 py-1.5 rounded-full" : "p-3 rounded-xs max-w-xs"
      )}>
        {minimized ? (
          <button 
            onClick={() => setMinimized(false)}
            className="flex items-center gap-2 font-mono text-[10px] text-[#A2A699] hover:text-[#C7F36B] cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C7F36B] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C7F36B]" />
            </span>
            <span>Gateway Stream Active · {pulseTime}</span>
          </button>
        ) : (
          <div className="space-y-1.5 font-mono text-[10px]">
            <div className="flex items-center justify-between gap-2 border-b border-[#2C3026] pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {isPulsing && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C7F36B] opacity-90" />
                  )}
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C7F36B]" />
                </span>
                <span className="font-bold text-white uppercase text-[9px] tracking-wider">
                  Razorpay Stream
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "px-1 py-0.2 rounded-xs text-[8px] uppercase tracking-wider font-bold transition-colors",
                  isPulsing ? "bg-[#2B3420] text-[#C7F36B]" : "bg-[#20241C] text-[#818679]"
                )}>
                  {isPulsing ? 'Synced' : 'Listening'}
                </span>
                <button
                  onClick={() => setMinimized(true)}
                  className="text-[#7D8174] hover:text-white px-1 cursor-pointer"
                  title="Minimize"
                >
                  −
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[#85877D] text-[9px] pt-0.5">
              <span>Evaluated: <strong className="text-[#E4E7D7]">{eventCount} cases</strong></span>
              <span>Drop: <strong className="text-[#C7F36B]">0ms</strong></span>
              <span>Sync: <strong className="text-[#E4E7D7]">{pulseTime}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

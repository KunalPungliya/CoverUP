'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ListFilter, 
  BarChart3, 
  Zap, 
  FileClock, 
  Menu, 
  X,
  MoreHorizontal,
  ChevronRight,
  ShieldCheck,
  Activity,
  BellRing,
  GitBranch,
  Command,
  Keyboard
} from 'lucide-react';
import { DemoBanner } from './demo-banner';

interface NavItem {
  href: string;
  label: string;
  count?: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
}

const mainNavItems: NavItem[] = [
  { href: '/', label: 'Overview', shortcut: 'G O', icon: LayoutDashboard },
  { href: '/subscriptions', label: 'Recovery queue', count: '148', shortcut: 'G Q', icon: ListFilter },
  { href: '/recovery', label: 'Recovery batches', shortcut: 'G R', icon: GitBranch },
  { href: '/simulator', label: 'Developer Sandbox', shortcut: 'G S', icon: Zap },
  { href: '/analytics', label: 'Analytics & ROI', shortcut: 'G A', icon: BarChart3 },
  { href: '/audit', label: 'Audit trail', shortcut: 'G L', icon: FileClock },
];

export function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNav, setMobileNav] = useState(false);
  const [currentTime, setCurrentTime] = useState('09:42:18');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    let keyTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setShowShortcutsModal(false);
        return;
      }

      if (e.key.toLowerCase() === 'g') {
        setLastKey('g');
        clearTimeout(keyTimeout);
        keyTimeout = setTimeout(() => setLastKey(null), 1200);
        return;
      }

      if (lastKey === 'g') {
        setLastKey(null);
        const key = e.key.toLowerCase();
        if (key === 'o') router.push('/');
        else if (key === 'q') router.push('/subscriptions');
        else if (key === 'r') router.push('/recovery');
        else if (key === 's') router.push('/simulator');
        else if (key === 'a') router.push('/analytics');
        else if (key === 'l') router.push('/audit');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(keyTimeout);
    };
  }, [lastKey, router]);

  return (
    <div className="min-h-screen bg-[#171914] text-[#F2F0E6] selection:bg-[#C7F36B] selection:text-[#1C2016]">
      {/* Persistent Desktop Navigation Rail */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-[244px] flex-col border-r border-[#2B2D27] bg-[#171914] px-5 py-6 text-[#F4F0E5] transition-transform duration-200 lg:translate-x-0",
        mobileNav ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-1">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="grid h-9 w-9 place-items-center bg-[#C7F36B] text-[#171914] shadow-[4px_4px_0_#5E6F31] transition-transform group-hover:scale-105">
              <span className="font-display font-black text-xl tracking-tighter text-[#171914]">R</span>
            </div>
            <div>
              <p className="font-display text-[15px] font-bold tracking-[-0.04em] text-white">
                recover<span className="text-[#C7F36B]">/</span>y
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#7D8174]">
                Revenue OS
              </p>
            </div>
          </Link>
          {mobileNav && (
            <button
              onClick={() => setMobileNav(false)}
              className="ml-auto p-1.5 text-zinc-400 hover:text-white lg:hidden cursor-pointer"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Workspace Nav Header */}
        <div className="mt-10 px-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#71766A]">
          Workspace
        </div>

        {/* Primary Navigation Links */}
        <nav className="mt-3 space-y-1" aria-label="Primary navigation">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNav(false)}
                className={cn(
                  "group flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors duration-150 rounded-xs",
                  isActive
                    ? "bg-[#242820] text-[#F8F5EC] font-medium"
                    : "text-[#A3A79B] hover:bg-[#20231D] hover:text-[#F8F5EC]"
                )}
              >
                <span className="flex items-center gap-3">
                  <span className={cn(
                    "transition-colors",
                    isActive ? "text-[#C7F36B]" : "text-[#7C8274] group-hover:text-[#C7F36B]"
                  )}>
                    <Icon size={17} strokeWidth={1.8} />
                  </span>
                  {item.label}
                </span>
                <div className="flex items-center gap-1.5">
                  {item.count && (
                    <span className="font-mono text-[10px] text-[#7D8174]">
                      {item.count}
                    </span>
                  )}
                  {item.shortcut && (
                    <span className="hidden lg:inline-block font-mono text-[9px] text-[#55584E] opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.shortcut}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Rail: Live Guardrail Status & User Profile */}
        <div className="mt-auto border-t border-[#30342C] pt-5 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#71766A]">
              Live guardrail
            </div>
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="flex items-center gap-1 text-[10px] font-mono text-[#7D8174] hover:text-[#C7F36B] transition-colors cursor-pointer"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard size={12} />
              <span>?</span>
            </button>
          </div>

          <div className="flex items-center gap-3 px-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C7F36B] opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#C7F36B]" />
            </span>
            <div>
              <p className="text-xs font-medium text-[#D7D8CC]">Agent online</p>
              <p className="mt-0.5 font-mono text-[9px] text-[#7D8174]">
                last sync {currentTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 text-left text-[#9FA297]">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-[#34382F] text-[10px] font-semibold text-white">
              AK
            </div>
            <div>
              <span className="text-xs text-[#E4E7D7] font-medium block">Aarav Kapoor</span>
              <span className="text-[10px] font-mono text-[#7D8174]">Revenue Lead</span>
            </div>
            <MoreHorizontal size={15} className="ml-auto text-[#7D8174]" />
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {mobileNav && (
        <div
          className="fixed inset-0 z-30 bg-[#11130F]/70 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}

      {/* Main Operating Area */}
      <div className="min-h-screen lg:pl-[244px] flex flex-col">
        {/* Top Operational Bar */}
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#30342C] bg-[#171914]/95 px-5 text-[#F2F0E6] backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="grid h-9 w-9 place-items-center border border-[#3C4135] bg-[#242820] text-[#C7F36B] lg:hidden"
              onClick={() => setMobileNav(true)}
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2.5 pr-3 sm:border-r sm:border-[#30342C]">
              <div className="grid h-7 w-7 place-items-center bg-[#C7F36B] text-[#171914]">
                <span className="font-display font-black text-xs text-[#171914]">R</span>
              </div>
              <span className="hidden font-display text-sm font-bold tracking-[-0.05em] sm:block">
                recover<span className="text-[#C7F36B]">/</span>y
              </span>
            </div>
            <div className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.17em] text-[#858D7E] sm:flex">
              <span>Workspace</span>
              <ChevronRight size={12} />
              <span className="text-[#E9E6DC]">
                {pathname === '/' ? 'Recovery Overview' : pathname.replace('/', '').replace(/-/g, ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="hidden lg:flex items-center gap-1.5 border border-[#30342C] bg-[#20231C] px-2.5 py-1.5 font-mono text-[10px] text-[#9FA297] hover:text-[#C7F36B] transition-colors cursor-pointer"
            >
              <Keyboard size={12} />
              <span>Shortcuts</span>
              <kbd className="px-1 bg-[#171914] text-[9px] text-[#C7F36B] border border-[#3C4135]">?</kbd>
            </button>

            <span className="hidden items-center gap-2 border border-[#D8D5CB] bg-[#FAF9F5] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#777970] md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9BBD49]" />
              Demo data · 04 Sep 2026
            </span>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#30342C] bg-[#20231C] text-[11px] font-mono text-[#E4E7D7]">
              <span className="h-2 w-2 rounded-full bg-[#C7F36B]" />
              <span className="hidden sm:inline text-[#9FA297]">Autonomous Engine:</span>
              <span className="font-bold text-[#C7F36B]">Active</span>
            </div>
          </div>
        </header>

        {/* Page Children Container */}
        <main className="flex-1 p-5 md:p-8">
          <DemoBanner />
          {children}
        </main>
      </div>

      {/* Global Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#11130F]/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#FAF9F5] border border-[#DEDBD1] text-[#2B2D27] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E1D8] pb-3">
              <div className="flex items-center gap-2">
                <Keyboard size={18} className="text-[#6B8E21]" />
                <h3 className="font-display text-base font-bold text-[#2B2D27]">
                  Keyboard Shortcuts
                </h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 text-[#85867E] hover:text-[#2B2D27] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <p className="text-[10px] uppercase font-bold text-[#85877D] tracking-wider mb-2">Navigation</p>
              {[
                { keys: ['g', 'o'], label: 'Go to Overview' },
                { keys: ['g', 'q'], label: 'Go to Recovery Queue' },
                { keys: ['g', 'r'], label: 'Go to Recovery Batches' },
                { keys: ['g', 's'], label: 'Go to Developer Sandbox' },
                { keys: ['g', 'a'], label: 'Go to Analytics & ROI' },
                { keys: ['g', 'l'], label: 'Go to Audit Ledger' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-1 border-b border-[#EBE8DF]">
                  <span className="text-[#474941]">{item.label}</span>
                  <div className="flex items-center gap-1">
                    {item.keys.map(k => (
                      <kbd key={k} className="px-1.5 py-0.5 bg-[#E8E5DB] text-[#2B2D27] border border-[#D8D5CB] text-[10px] font-bold uppercase">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}

              <p className="text-[10px] uppercase font-bold text-[#85877D] tracking-wider pt-2 mb-2">Global Actions</p>
              <div className="flex items-center justify-between py-1 border-b border-[#EBE8DF]">
                <span className="text-[#474941]">Toggle this cheat sheet</span>
                <kbd className="px-1.5 py-0.5 bg-[#E8E5DB] text-[#2B2D27] border border-[#D8D5CB] text-[10px] font-bold">?</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[#474941]">Close drawer or modal</span>
                <kbd className="px-1.5 py-0.5 bg-[#E8E5DB] text-[#2B2D27] border border-[#D8D5CB] text-[10px] font-bold">Esc</kbd>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E4E1D8] text-[11px] font-mono text-[#85867E] text-center">
              Press any shortcut sequence to navigate instantaneously.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

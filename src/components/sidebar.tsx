'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  CreditCard, 
  BarChart3, 
  Zap, 
  ClipboardList, 
  Menu, 
  X,
  Activity
} from 'lucide-react';
import { DemoBanner } from './demo-banner';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/subscriptions', label: 'Subscriptions & Ledger', icon: CreditCard },
  { href: '/analytics', label: 'Analytics & ROI', icon: BarChart3 },
  { href: '/simulator', label: 'Developer Sandbox', icon: Zap },
  { href: '/audit', label: 'Audit Trail', icon: ClipboardList },
];

export function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0A0D14] flex flex-col selection:bg-[#FDDD35]/40 selection:text-zinc-950">
      {/* Paddle-Styled Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E2E5EB] shadow-2xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Extreme Left: VaultBack Brand Logo */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="h-9 w-9 rounded-xl bg-zinc-950 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 border border-zinc-800">
                  <ShieldCheck className="h-5 w-5 text-[#FDDD35]" />
                </div>
                <span className="text-lg font-bold tracking-tight text-zinc-950">
                  VaultBack
                </span>
              </Link>

              {/* Desktop Cockpits Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {mainNavItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all',
                        isActive
                          ? 'bg-zinc-950 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80'
                      )}
                    >
                      <Icon className={cn('h-4 w-4', isActive ? 'text-[#FDDD35]' : 'text-zinc-400')} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Side Header: Engine Live Status Pill */}
            <div className="hidden md:flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950 text-white text-[11px] font-medium border border-zinc-800 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00EB88] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00EB88]"></span>
                </span>
                <span className="text-zinc-300">Autonomous Engine:</span>
                <span className="font-bold text-[#00EB88]">Active</span>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-slate-100"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E2E5EB] bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top duration-200">
            <div className="text-[11px] font-semibold text-zinc-400 px-3 uppercase tracking-wider">Navigation</div>
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                    isActive ? 'bg-zinc-950 text-white font-semibold' : 'text-zinc-700 hover:bg-slate-100'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive ? 'text-[#FDDD35]' : 'text-zinc-400')} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full bg-[#F7F8FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <DemoBanner />
          {children}
        </div>
      </main>
    </div>
  );
}


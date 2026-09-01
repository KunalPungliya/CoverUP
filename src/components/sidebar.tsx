'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  LayoutDashboard, 
  CreditCard, 
  RefreshCw, 
  BarChart3, 
  ChevronDown, 
  Zap, 
  Calculator, 
  Mail, 
  ClipboardList, 
  Settings, 
  Presentation,
  Menu, 
  X 
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
];

const toolNavItems: NavItem[] = [
  { href: '/simulator', label: 'Webhook Simulator', icon: Zap },
  { href: '/roi', label: 'ROI Calculator', icon: Calculator },
  { href: '/templates', label: 'Message Previews', icon: Mail },
  { href: '/audit', label: 'Audit Trail', icon: ClipboardList },
  { href: '/settings', label: 'Pipeline Settings', icon: Settings },
  { href: '/demo', label: 'Demo Guide', icon: Presentation },
];

export function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isToolActive = toolNavItems.some(
    (item) => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-2xs transition-transform group-hover:scale-105">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-base font-bold tracking-tight text-slate-900">CoverUP</span>
                  <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    AI Recovery
                  </span>
                </div>
              </Link>

              {/* Desktop 4 Core Cockpits */}
              <nav className="hidden md:flex items-center gap-1">
                {mainNavItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      )}
                    >
                      <Icon className={cn('h-4 w-4', isActive ? 'text-blue-600' : 'text-slate-400')} />
                      {item.label}
                    </Link>
                  );
                })}

                {/* More Tools Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setToolsOpen(!toolsOpen)}
                    onBlur={() => setTimeout(() => setToolsOpen(false), 200)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    )}
                  >
                    <span>More Tools</span>
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', toolsOpen && 'rotate-180')} />
                  </button>

                  {/* Dropdown Menu */}
                  {toolsOpen && (
                    <div className="absolute left-0 mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in-80 slide-in-from-top-2 duration-150">
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        Direct Feature Links
                      </div>
                      {toolNavItems.map((tool) => {
                        const isToolCurrent = pathname === tool.href;
                        const ToolIcon = tool.icon;
                        return (
                          <Link
                            key={tool.href}
                            href={tool.href}
                            onClick={() => setToolsOpen(false)}
                            className={cn(
                              'flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors',
                              isToolCurrent
                                ? 'bg-blue-50 text-blue-600 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                            )}
                          >
                            <ToolIcon className={cn('h-4 w-4', isToolCurrent ? 'text-blue-600' : 'text-slate-400')} />
                            {tool.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </nav>
            </div>

            {/* Right Side Header CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/simulator">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors shadow-2xs">
                  <Zap className="h-3.5 w-3.5 text-blue-600" />
                  Live Webhook Simulator
                </span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top duration-200">
            <div className="text-xs font-semibold text-slate-400 px-3 uppercase tracking-wider">Main Cockpits</div>
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                    isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}

            <div className="text-xs font-semibold text-slate-400 px-3 pt-3 uppercase tracking-wider border-t border-slate-100">
              Direct Feature Links
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {toolNavItems.map((tool) => {
                const isToolCurrent = pathname === tool.href;
                const ToolIcon = tool.icon;
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium',
                      isToolCurrent ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <ToolIcon className="h-3.5 w-3.5 text-slate-400" />
                    {tool.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <DemoBanner />
          {children}
        </div>
      </main>
    </div>
  );
}

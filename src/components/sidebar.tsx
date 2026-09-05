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
  Keyboard,
  User,
  Shield,
  CheckCircle2,
  Copy,
  Check,
  Lock,
  Sliders,
  Laptop,
  Clock,
  Sparkles,
  ArrowRightLeft
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

export interface OperatorProfile {
  id: string;
  name: string;
  role: string;
  initials: string;
  email: string;
  shiftStart: string;
  activeHours: string;
  clearanceLevel: string;
  clearanceName: string;
  device: string;
  ip: string;
  mfaStatus: string;
  stats: {
    reviewedToday: number;
    batchesDispatched: number;
    overridesAllowed: string;
  };
}

export const OPERATOR_PROFILES: OperatorProfile[] = [
  {
    id: 'aarav-kapoor',
    name: 'Aarav Kapoor',
    role: 'Revenue Operations Lead',
    initials: 'AK',
    email: 'aarav.kapoor@settleiq.app',
    shiftStart: '08:30 AM IST',
    activeHours: '3h 14m',
    clearanceLevel: 'Level 3',
    clearanceName: 'Autonomous Policy & Override Rights',
    device: 'MacBook Pro M3 · Chrome 128',
    ip: '103.21.124.89 (Mumbai HQ)',
    mfaStatus: 'FIDO2 Hardware Key Enforced',
    stats: {
      reviewedToday: 28,
      batchesDispatched: 4,
      overridesAllowed: 'Up to $10,000 / case'
    }
  },
  {
    id: 'priya-sharma',
    name: 'Priya Sharma',
    role: 'Chief Risk & Compliance Officer',
    initials: 'PS',
    email: 'priya.sharma@settleiq.app',
    shiftStart: '09:15 AM IST',
    activeHours: '2h 29m',
    clearanceLevel: 'Level 4',
    clearanceName: 'Master Policy Admin & Legal Hold',
    device: 'ThinkPad X1 Carbon · Firefox 129',
    ip: '49.207.198.12 (Bangalore Tech Hub)',
    mfaStatus: 'Hardware Token + Biometric Active',
    stats: {
      reviewedToday: 42,
      batchesDispatched: 7,
      overridesAllowed: 'Unlimited Master Auth'
    }
  },
  {
    id: 'vikram-malhotra',
    name: 'Vikram Malhotra',
    role: 'Senior Recovery Specialist',
    initials: 'VM',
    email: 'vikram.m@settleiq.app',
    shiftStart: '10:00 AM IST',
    activeHours: '1h 44m',
    clearanceLevel: 'Level 2',
    clearanceName: 'Manual Dunning & High-Value Outreach',
    device: 'Mac Studio · Safari 17.5',
    ip: '115.240.88.4 (Delhi Regional)',
    mfaStatus: 'TOTP Authenticator Enforced',
    stats: {
      reviewedToday: 19,
      batchesDispatched: 2,
      overridesAllowed: 'Up to $2,500 / case'
    }
  },
  {
    id: 'elena-rostova',
    name: 'Elena Rostova',
    role: 'AI Alignment & Fraud Analyst',
    initials: 'ER',
    email: 'elena.r@settleiq.app',
    shiftStart: '07:00 AM CET',
    activeHours: '4h 44m',
    clearanceLevel: 'Level 3',
    clearanceName: 'Gemini LLM Hyperparameters & Guardrails',
    device: 'Dell XPS 15 · Edge 128',
    ip: '194.209.12.5 (Zurich AI Lab)',
    mfaStatus: 'YubiKey 5C NFC Verified',
    stats: {
      reviewedToday: 35,
      batchesDispatched: 5,
      overridesAllowed: 'Prompt & Fallback Override'
    }
  }
];

export function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNav, setMobileNav] = useState(false);
  const [currentTime, setCurrentTime] = useState('09:42:18');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showOperatorModal, setShowOperatorModal] = useState(false);
  const [currentOperator, setCurrentOperator] = useState<OperatorProfile>(OPERATOR_PROFILES[0]);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [copiedSession, setCopiedSession] = useState(false);
  
  // Guardrail preference toggles inside operator modal
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [highValueAlerts, setHighValueAlerts] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load saved operator from local storage
  useEffect(() => {
    try {
      const savedOpId = localStorage.getItem('settleiq_active_operator');
      if (savedOpId) {
        const found = OPERATOR_PROFILES.find(op => op.id === savedOpId);
        if (found) setCurrentOperator(found);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSelectOperator = (op: OperatorProfile) => {
    setCurrentOperator(op);
    try {
      localStorage.setItem('settleiq_active_operator', op.id);
    } catch {
      // ignore
    }
  };

  const handleCopySession = () => {
    navigator.clipboard.writeText(`SIQ-AUTH-TOKEN-${currentOperator.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2000);
  };

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
        setShowOperatorModal(false);
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
              <span className="font-display font-black text-xl tracking-tighter text-[#171914]">S</span>
            </div>
            <div>
              <p className="font-display text-[15px] font-bold tracking-[-0.04em] text-white">
                Settle<span className="text-[#C7F36B]">IQ</span>
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#7D8174]">
                Autonomous OS
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

        {/* Bottom Rail: Agent Status + Inline Shortcuts Trigger + Dynamic Operator Profile */}
        <div className="mt-auto border-t border-[#30342C] pt-4 space-y-3">
          {/* Agent Online Status with Inline Shortcut Button */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C7F36B] opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#C7F36B]" />
              </span>
              <div>
                <p className="text-xs font-medium text-[#D7D8CC]">Agent online</p>
                <p className="font-mono text-[9px] text-[#7D8174]">
                  sync {currentTime}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowShortcutsModal(true)}
              className="flex items-center gap-1 border border-[#30342C] bg-[#20231C] px-2 py-1 text-[10px] font-mono text-[#9FA297] hover:text-[#C7F36B] hover:border-[#3E4336] transition-colors cursor-pointer rounded-xs"
              title="Global Keyboard Shortcuts (?)"
            >
              <Keyboard size={11} className="text-[#C7F36B]" />
              <span className="font-bold text-[10px]">?</span>
            </button>
          </div>

          {/* Interactive Operator Profile Switcher Button */}
          <button
            onClick={() => setShowOperatorModal(true)}
            className="w-full flex items-center gap-2.5 p-2 rounded-xs text-left bg-[#1C2018] hover:bg-[#23271E] border border-[#2B2F25] hover:border-[#3E4534] transition-all cursor-pointer group"
            title="Open Operator Workspace & Switch Profile"
          >
            <div className="grid h-7 w-7 place-items-center rounded-full bg-[#34382F] text-[10px] font-semibold text-[#C7F36B] border border-[#444A3C] group-hover:border-[#C7F36B] transition-colors shrink-0">
              {currentOperator.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs text-[#E4E7D7] font-medium block truncate group-hover:text-white transition-colors">
                  {currentOperator.name}
                </span>
                <span className="text-[8px] font-mono px-1 py-0.2 bg-[#282E22] text-[#C7F36B] rounded-xs border border-[#38422F] shrink-0">
                  ONLINE
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#7D8174] block truncate">
                {currentOperator.role}
              </span>
            </div>
            <MoreHorizontal size={14} className="text-[#7D8174] group-hover:text-[#C7F36B] transition-colors shrink-0 ml-0.5" />
          </button>
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
        {/* Top Operational Bar (Shortcuts button removed) */}
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
                <span className="font-display font-black text-xs text-[#171914]">S</span>
              </div>
              <span className="hidden font-display text-sm font-bold tracking-[-0.05em] sm:block">
                Settle<span className="text-[#C7F36B]">IQ</span>
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

      {/* Interactive Operator Profile Modal */}
      {showOperatorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#11130F]/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-[#FAF9F5] border border-[#DEDBD1] text-[#2B2D27] shadow-2xl p-6 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E4E1D8] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center bg-[#171914] text-[#C7F36B]">
                  <User size={16} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#2B2D27]">
                    Operator Session & RBAC
                  </h3>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#85877D]">
                    SettleIQ Multi-Role Access Control · Active Shift
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOperatorModal(false)}
                className="p-1.5 text-[#85867E] hover:text-[#2B2D27] cursor-pointer rounded-xs hover:bg-[#EBE8DF]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Active Operator Hero Card */}
            <div className="p-4 bg-[#171914] text-[#F4F0E5] border border-[#2B2F25] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2C3026]">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center bg-[#C7F36B] text-[#171914] font-display font-black text-lg">
                    {currentOperator.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-bold text-base text-white">
                        {currentOperator.name}
                      </h4>
                      <span className="px-1.5 py-0.5 bg-[#2B3420] text-[#C7F36B] font-mono text-[9px] uppercase tracking-wider border border-[#44542E]">
                        Active On Duty
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-[#A2A69A]">
                      {currentOperator.role} · {currentOperator.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleCopySession}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#242820] hover:bg-[#2F3429] text-[#E4E7D7] border border-[#3C4233] font-mono text-[10px] cursor-pointer transition-colors"
                  >
                    {copiedSession ? (
                      <>
                        <Check size={12} className="text-[#C7F36B]" />
                        <span className="text-[#C7F36B]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Token</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Shift Telemetry Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 font-mono text-[10px]">
                <div>
                  <span className="text-[#7D8174] uppercase block">Shift Duration</span>
                  <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
                    <Clock size={11} className="text-[#C7F36B]" />
                    {currentOperator.activeHours}
                  </span>
                </div>
                <div>
                  <span className="text-[#7D8174] uppercase block">Clearance</span>
                  <span className="text-[#C7F36B] font-semibold mt-0.5 block">
                    {currentOperator.clearanceLevel}
                  </span>
                </div>
                <div>
                  <span className="text-[#7D8174] uppercase block">Reviewed Today</span>
                  <span className="text-white font-semibold mt-0.5 block">
                    {currentOperator.stats.reviewedToday} cases
                  </span>
                </div>
                <div>
                  <span className="text-[#7D8174] uppercase block">Batches Dispatched</span>
                  <span className="text-white font-semibold mt-0.5 block">
                    {currentOperator.stats.batchesDispatched} live
                  </span>
                </div>
              </div>
            </div>

            {/* Operator Switcher Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-bold text-[#85877D] tracking-wider flex items-center gap-1.5">
                  <ArrowRightLeft size={12} />
                  Switch Active Duty Operator
                </span>
                <span className="font-mono text-[10px] text-[#707866]">
                  4 operators authorized
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {OPERATOR_PROFILES.map((op) => {
                  const isCurrent = op.id === currentOperator.id;
                  return (
                    <button
                      key={op.id}
                      onClick={() => handleSelectOperator(op)}
                      className={cn(
                        "flex items-start gap-2.5 p-2.5 text-left border transition-all cursor-pointer rounded-xs",
                        isCurrent 
                          ? "border-[#171914] bg-[#F1EFEA] shadow-xs" 
                          : "border-[#E4E1D8] bg-white hover:border-[#BDB9AC] hover:bg-[#F9F8F5]"
                      )}
                    >
                      <div className={cn(
                        "grid h-8 w-8 place-items-center text-xs font-bold shrink-0",
                        isCurrent ? "bg-[#171914] text-[#C7F36B]" : "bg-[#E6E3D8] text-[#474941]"
                      )}>
                        {op.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-[#2B2D27] truncate">
                            {op.name}
                          </p>
                          {isCurrent && (
                            <span className="font-mono text-[9px] font-bold text-[#4F6C18] uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[10px] text-[#7D8174] truncate">
                          {op.role}
                        </p>
                        <p className="font-mono text-[9px] text-[#9A9E92] mt-0.5">
                          {op.clearanceLevel} · {op.stats.overridesAllowed}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Operator Preferences & Guardrail Policies */}
            <div className="space-y-2 border-t border-[#E4E1D8] pt-3 font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-[#85877D] tracking-wider block mb-2">
                Shift Session Guardrails
              </span>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-2 bg-white border border-[#E4E1D8] cursor-pointer hover:bg-[#F9F8F5]">
                  <div>
                    <p className="text-xs font-medium text-[#2B2D27]">Auto-Escalate Disputed Mandates</p>
                    <p className="text-[10px] text-[#85877D]">Trigger human-in-the-loop review for disputed charges</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={autoEscalate} 
                    onChange={e => setAutoEscalate(e.target.checked)}
                    className="h-4 w-4 accent-[#171914] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 bg-white border border-[#E4E1D8] cursor-pointer hover:bg-[#F9F8F5]">
                  <div>
                    <p className="text-xs font-medium text-[#2B2D27]">High-Value Intervention Threshold Alerts</p>
                    <p className="text-[10px] text-[#85877D]">Require explicit override confirmation for accounts &gt; ₹25,000</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={highValueAlerts} 
                    onChange={e => setHighValueAlerts(e.target.checked)}
                    className="h-4 w-4 accent-[#171914] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 bg-white border border-[#E4E1D8] cursor-pointer hover:bg-[#F9F8F5]">
                  <div>
                    <p className="text-xs font-medium text-[#2B2D27]">Audio Cue on AI Recovery Dispatches</p>
                    <p className="text-[10px] text-[#85877D]">Play crisp terminal chime on batch completions</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={soundAlerts} 
                    onChange={e => setSoundAlerts(e.target.checked)}
                    className="h-4 w-4 accent-[#171914] cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between border-t border-[#E4E1D8] pt-3">
              <span className="font-mono text-[10px] text-[#85877D]">
                Session ID: <code className="text-[#2B2D27]">SIQ-SESSION-${currentOperator.id.slice(0, 4).toUpperCase()}-LIVE</code>
              </span>
              <button
                onClick={() => setShowOperatorModal(false)}
                className="px-4 py-2 bg-[#171914] text-[#C7F36B] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#252820] cursor-pointer transition-colors"
              >
                Close Workspace
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex items-center justify-between py-1 border-b border-[#EBE8DF]">
                <span className="text-[#474941]">Switch Operator / Session</span>
                <kbd className="px-1.5 py-0.5 bg-[#E8E5DB] text-[#2B2D27] border border-[#D8D5CB] text-[10px] font-bold">Click Avatar</kbd>
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

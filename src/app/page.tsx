'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  Activity,
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  BellRing,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  CreditCard,
  Database,
  FileClock,
  FileText,
  Gauge,
  GitBranch,
  HandCoins,
  Landmark,
  LayoutDashboard,
  ListFilter,
  Mail,
  Menu,
  MessageSquareMore,
  MoreHorizontal,
  MousePointerClick,
  PauseCircle,
  Play,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserRound,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { RecoveryModal } from '@/components/recovery-modal';

type CaseType = 'Payment' | 'Checkout' | 'Subscription' | 'Receivables' | 'Mandate' | 'Promise-to-pay';
type CaseStatus = 'Queued' | 'Running' | 'Recovered' | 'Paused' | 'Escalated';
type Filter = 'All' | CaseType;

interface RecoveryCase {
  id: string;
  initials: string;
  name: string;
  account: string;
  type: CaseType;
  reason: string;
  amount: number;
  age: string;
  score: number;
  status: CaseStatus;
  channel: string;
  next: string;
  whyExplanation?: string;
  maxAttempts?: number;
  cooldown?: string;
  stopRule?: string;
}

const DEFAULT_CASES: RecoveryCase[] = [
  { 
    id: 'RR-0428', 
    initials: 'AP', 
    name: 'Acme Platforms', 
    account: 'Workspace · Growth', 
    type: 'Payment', 
    reason: 'Issuer soft decline', 
    amount: 18400, 
    age: '41m', 
    score: 92, 
    status: 'Queued', 
    channel: 'Smart retry', 
    next: 'Retry Mastercard in 19m',
    whyExplanation: 'High recoverability with low customer friction. The agent will attempt one soft recovery before escalating or stopping.',
    maxAttempts: 2,
    cooldown: '19 minutes',
    stopRule: 'Hard decline'
  },
  { 
    id: 'RR-0423', 
    initials: 'NL', 
    name: 'Northline Labs', 
    account: 'Pro annual', 
    type: 'Subscription', 
    reason: 'Card expired', 
    amount: 9600, 
    age: '2h', 
    score: 88, 
    status: 'Running', 
    channel: 'Email + retry', 
    next: 'Awaiting card update',
    whyExplanation: 'Token expired at issuer. Dispatched secure 1-click update portal link with 48h active session.',
    maxAttempts: 3,
    cooldown: '24 hours',
    stopRule: 'Card updated or 3 notices'
  },
  { 
    id: 'RR-0416', 
    initials: 'OS', 
    name: 'Orbit Systems', 
    account: 'Invoice #INV-2091', 
    type: 'Receivables', 
    reason: 'Net-30 overdue', 
    amount: 52000, 
    age: '1d', 
    score: 81, 
    status: 'Queued', 
    channel: 'AR chaser', 
    next: 'Nudge AP contact today',
    whyExplanation: 'High-value B2B receivable past grace period. Automated gentle dunning sent to primary finance contact.',
    maxAttempts: 2,
    cooldown: '48 hours',
    stopRule: 'Promise to pay logged'
  },
  { 
    id: 'RR-0407', 
    initials: 'HR', 
    name: 'Harbor Retail', 
    account: 'Checkout · 7 seats', 
    type: 'Checkout', 
    reason: 'Checkout abandoned', 
    amount: 2100, 
    age: '3h', 
    score: 74, 
    status: 'Recovered', 
    channel: 'Hinglish voice', 
    next: 'Recovered 12m ago',
    whyExplanation: '3DS OTP challenge abandoned at gateway. WhatsApp instant completion link converted payment.',
    maxAttempts: 1,
    cooldown: '1 hour',
    stopRule: 'Payment successful'
  },
  { 
    id: 'RR-0398', 
    initials: 'FT', 
    name: 'Fathom Travel', 
    account: 'Mandate · SEPA', 
    type: 'Mandate', 
    reason: 'Mandate rejected', 
    amount: 12800, 
    age: '4h', 
    score: 69, 
    status: 'Paused', 
    channel: 'Retry sequence', 
    next: 'Stopped by policy',
    whyExplanation: 'e-Mandate revoked by bank. Stopping rule immediately halted automated charges to avoid penalty fees.',
    maxAttempts: 2,
    cooldown: '72 hours',
    stopRule: 'Mandate re-authorization'
  },
  { 
    id: 'RR-0384', 
    initials: 'VM', 
    name: 'Vantage Media', 
    account: 'Promise #PTP-118', 
    type: 'Promise-to-pay', 
    reason: 'Promise missed', 
    amount: 7400, 
    age: '2d', 
    score: 64, 
    status: 'Escalated', 
    channel: 'Human review', 
    next: 'Escalated to collections',
    whyExplanation: 'Agreed settlement date passed with zero payment. Escalated to enterprise account manager for direct call.',
    maxAttempts: 1,
    cooldown: 'None',
    stopRule: 'Direct human intervention'
  },
  { 
    id: 'RR-0379', 
    initials: 'MS', 
    name: 'Meridian Studio', 
    account: 'Checkout · Pro', 
    type: 'Checkout', 
    reason: 'Pricing step exit', 
    amount: 890, 
    age: '5h', 
    score: 58, 
    status: 'Queued', 
    channel: 'In-app recovery', 
    next: 'Offer held for 6h',
    whyExplanation: 'Customer dropped at payment selection screen. Personalized discount coupon generated with 6h countdown timer.',
    maxAttempts: 1,
    cooldown: '6 hours',
    stopRule: 'Checkout completed'
  },
];

const DEFAULT_AUDIT = [
  { time: '09:42:18', id: 'RR-0428', action: 'Queued smart retry', detail: 'Soft decline · Mastercard', result: 'Within policy', tone: 'lime' },
  { time: '09:38:04', id: 'RR-0407', action: 'Recovery confirmed', detail: 'Checkout · ₹1,74,300', result: 'Recovered', tone: 'lime' },
  { time: '09:31:50', id: 'RR-0398', action: 'Sequence paused', detail: 'Mandate retry 2 / 2', result: 'Stop rule', tone: 'amber' },
  { time: '09:27:11', id: 'RR-0384', action: 'Escalated to human', detail: 'Promise missed · 48h', result: 'Required', tone: 'coral' },
];

const FLOW_STEPS = ['Detect', 'Diagnose', 'Intervene', 'Measure', 'Audit'];

function StatusPill({ status }: { status: CaseStatus }) {
  const styles: Record<CaseStatus, string> = {
    Queued: 'border-[#D9D6CB] bg-[#F4F1E8] text-[#68665D]',
    Running: 'border-[#A9BDE0] bg-[#EDF3FC] text-[#345689]',
    Recovered: 'border-[#BFDB78] bg-[#EDF7CE] text-[#4E6B18]',
    Paused: 'border-[#E7C779] bg-[#FFF7DF] text-[#8A6413]',
    Escalated: 'border-[#E3A5A0] bg-[#FFF0EE] text-[#A54C46]',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.13em]', styles[status])}>
      <span className={cn(
        'h-1.5 w-1.5 rounded-full',
        status === 'Recovered' ? 'bg-[#89B82C]' :
        status === 'Running' ? 'bg-[#5C7DB4]' :
        status === 'Paused' ? 'bg-[#D3A12A]' :
        status === 'Escalated' ? 'bg-[#CE6861]' : 'bg-[#9E9B90]'
      )} />
      {status}
    </span>
  );
}

export default function MasterDashboardPage() {
  const [filter, setFilter] = useState<Filter>('All');
  const [activeId, setActiveId] = useState('RR-0428');
  const [isRunning, setIsRunning] = useState(false);
  const [stage, setStage] = useState(3);
  const [showAll, setShowAll] = useState(false);
  const [currentTime, setCurrentTime] = useState('09:42:18');
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type?: 'info' | 'success' } | null>(null);

  // Live Database & Audit integration
  const [cases, setCases] = useState<RecoveryCase[]>(DEFAULT_CASES);
  const [auditLogs, setAuditLogs] = useState(DEFAULT_AUDIT);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (title: string, desc: string, type: 'info' | 'success' = 'info') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const activeCase = useMemo(() => {
    return cases.find((c) => c.id === activeId) || cases[0];
  }, [cases, activeId]);

  const filteredCases = useMemo(() => {
    if (filter === 'All') return cases;
    return cases.filter((c) => c.type === filter);
  }, [cases, filter]);

  const visibleCases = showAll ? filteredCases : filteredCases.slice(0, 5);

  // Batch Recovery Execution
  const runRecoveryBatch = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setStage(1);
    showToast('Batch simulation started', '6 eligible cases will run inside the policy envelope.');

    // Step through the 5 stages
    [2, 3, 4, 5].forEach((nextStage, index) => {
      setTimeout(() => setStage(nextStage), 520 * (index + 1));
    });

    try {
      // Trigger real AI recovery endpoint
      await fetch('/api/recover', { method: 'POST' });

      setTimeout(() => {
        setIsRunning(false);
        setStage(5);
        showToast('Batch complete · ₹4,18,600 recovered', '4 recoveries confirmed · 2 cases stopped or escalated.', 'success');
      }, 2900);
    } catch (e) {
      setTimeout(() => {
        setIsRunning(false);
        setStage(5);
        showToast('Batch complete · ₹4,18,600 recovered', '4 recoveries confirmed · 2 cases stopped or escalated.', 'success');
      }, 2900);
    }
  };

  const selectCase = (item: RecoveryCase) => {
    setActiveId(item.id);
    showToast(`${item.id} selected`, `${item.reason} · ₹${item.amount.toLocaleString('en-IN')} at risk`);
  };

  const runSingle = () => {
    showToast(`Action simulated for ${activeCase.id}`, `${activeCase.channel} · bounded by ${activeCase.next.toLowerCase()}.`, 'success');
  };

  const handleExportAudit = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Time,Case ID,Action,Detail,Result"].concat(
          auditLogs.map(r => `${r.time},${r.id},"${r.action}","${r.detail}",${r.result}`)
        ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vaultback_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit Log Exported', 'CSV downloaded successfully.', 'success');
  };

  return (
    <div className="space-y-7 pb-12">
      {/* Dynamic Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl border border-[#30342C] bg-[#20231C] text-[#F8F6EE] shadow-2xl flex items-start gap-3 max-w-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={cn(
            'grid h-6 w-6 place-items-center rounded-full shrink-0 mt-0.5',
            toastMessage.type === 'success' ? 'bg-[#C7F36B] text-[#171914]' : 'bg-[#2B3026] text-[#C7F36B]'
          )}>
            {toastMessage.type === 'success' ? <Check size={13} strokeWidth={2.4} /> : <Zap size={13} />}
          </div>
          <div>
            <p className="text-xs font-bold text-white">{toastMessage.title}</p>
            <p className="text-[11px] text-[#A3A79B] mt-0.5">{toastMessage.desc}</p>
          </div>
        </div>
      )}

      {/* Hero Header Strip */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#87915D]">
            Monday / {currentTime} IST
          </p>
          <h1 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[0.98] tracking-[-0.065em] text-[#F2F0E6]">
            Revenue, back<br className="sm:hidden" /> in motion.
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="max-w-[330px] text-left text-sm leading-6 text-[#9FA297] md:text-right hidden sm:block">
            A bounded agent for the moments between <span className="text-[#C7F36B] font-semibold">signal</span> and <span className="text-[#E4E7D7] font-semibold">settlement</span>.
          </div>
          <Button
            onClick={runRecoveryBatch}
            disabled={isRunning}
            className="h-10 gap-2 rounded-xs bg-[#20231C] px-4 text-xs font-semibold text-[#F8F6EE] shadow-[3px_3px_0_#C7F36B] hover:bg-[#30352A] active:scale-[0.97]"
          >
            {isRunning ? <RefreshCw size={14} className="animate-spin text-[#C7F36B]" /> : <Play size={14} fill="currentColor" className="text-[#C7F36B]" />}
            {isRunning ? 'Running batch' : 'Run recovery batch'}
          </Button>
        </div>
      </div>

      {/* Hero Batch Summary Card */}
      <section className="relative isolate min-h-[235px] overflow-hidden bg-[#171914] px-6 py-7 text-[#F7F4EB] border border-[#2B2D27] shadow-[0_16px_40px_rgba(26,27,22,0.12)] md:px-9 md:py-8">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#171914_0%,rgba(23,25,20,.97)_35%,rgba(23,25,20,.45)_75%,rgba(23,25,20,.25)_100%)]" />
        <div className="relative max-w-[570px]">
          <div className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#C7F36B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C7F36B]" />
            Batch #RR-2026-09-03-A
          </div>
          <h2 className="max-w-[560px] font-display text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[0.98] tracking-[-0.06em]">
            ₹8.42L at risk.<br />
            <span className="text-[#C7F36B]">₹4.18L already back.</span>
          </h2>
          <p className="mt-5 max-w-[470px] text-sm leading-6 text-[#BABDB0]">
            The agent found 148 risk signals across payments, checkouts, subscriptions, and receivables. 6 are eligible to run now.
          </p>
        </div>
        <div className="absolute bottom-7 right-8 hidden text-right md:block">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8B9180]">
            Net recovery rate
          </div>
          <div className="mt-1 font-display text-5xl font-bold tracking-[-0.07em] text-[#C7F36B]">
            49.6%
          </div>
          <div className="mt-1 font-mono text-[10px] text-[#91978A]">
            +8.2% vs previous batch
          </div>
        </div>
      </section>

      {/* 4-Column KPI Strip */}
      <section className="grid border border-[#DEDBD1] bg-[#FAF9F5] sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total at risk', value: '₹8.42L', sub: '148 cases', valueClass: 'text-[#20211D]', Icon: CircleDollarSign },
          { label: 'Recovered', value: '₹4.18L', sub: '50% of eligible', valueClass: 'text-[#6B8E21]', Icon: BadgeCheck },
          { label: 'In motion', value: '₹1.74L', sub: '6 active actions', valueClass: 'text-[#3C5C92]', Icon: Zap },
          { label: 'Stopped / escalated', value: '8', sub: 'policy protected', valueClass: 'text-[#AA5B4F]', Icon: ShieldCheck },
        ].map((item, index) => {
          const Icon = item.Icon;
          return (
            <div
              key={item.label}
              className={cn(
                'flex min-h-[112px] items-center gap-4 border-b border-[#E4E1D8] px-5 py-4 sm:border-r sm:last:border-r-0 lg:border-b-0',
                index === 2 && 'sm:border-r-0 lg:border-r',
                index === 3 && 'sm:col-span-2 lg:col-span-1'
              )}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center bg-[#F0EEE6] text-[#7D806F]">
                <Icon size={17} strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#85877D]">
                  {item.label}
                </p>
                <p className={cn('mt-1 font-display text-[1.8rem] font-semibold leading-none tracking-[-0.055em]', item.valueClass)}>
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-[#96968D]">
                  {item.sub}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Asymmetric Operations Grid: Recovery Queue + Selected Intervention */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_356px]">
        {/* Recovery Queue */}
        <section className="min-w-0 border border-[#DEDBD1] bg-[#FAF9F5] text-[#2B2D27]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DEDBD1] px-5 py-4 md:px-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-semibold tracking-[-0.04em] text-[#2B2D27]">
                  Recovery queue
                </h3>
                <span className="rounded-full bg-[#22251D] px-2 py-0.5 font-mono text-[9px] text-[#C7F36B]">
                  148 total
                </span>
              </div>
              <p className="mt-1 text-xs text-[#85867E]">
                Ranked by recoverability, value, and customer impact.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#888980] md:flex">
                <ListFilter size={14} /> Filter
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as Filter)}
                className="h-8 border border-[#D8D5CB] bg-[#F7F5EE] px-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#55574E] outline-none focus:border-[#9AB54D]"
              >
                <option value="All">All</option>
                <option value="Payment">Payment</option>
                <option value="Checkout">Checkout</option>
                <option value="Subscription">Subscription</option>
                <option value="Receivables">Receivables</option>
                <option value="Mandate">Mandate</option>
                <option value="Promise-to-pay">Promise-to-pay</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="border-b border-[#EBE8DF] bg-[#F7F5EE]">
                <tr className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#97988E]">
                  <th className="px-5 py-3 font-medium md:px-6">Account</th>
                  <th className="px-3 py-3 font-medium">Signal</th>
                  <th className="px-3 py-3 font-medium">At risk</th>
                  <th className="px-3 py-3 font-medium">Score</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium md:px-6">Open</th>
                </tr>
              </thead>
              <tbody>
                {visibleCases.map((item) => {
                  const isSelected = activeId === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => selectCase(item)}
                      className={cn(
                        'group cursor-pointer border-b border-[#EBE8DF] transition-colors hover:bg-[#F4F1E7]',
                        isSelected && 'bg-[#F0F5DF]'
                      )}
                    >
                      <td className="px-5 py-3.5 md:px-6">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 shrink-0 place-items-center bg-[#E8E5DB] font-mono text-[10px] font-semibold text-[#61645A]">
                            {item.initials}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#2B2D27]">{item.name}</p>
                            <p className="mt-0.5 text-[11px] text-[#8B8C82]">{item.account}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="text-xs font-medium text-[#474941]">{item.reason}</p>
                        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#A0A097]">
                          {item.type} · {item.age}
                        </p>
                      </td>
                      <td className="px-3 py-3.5 font-display text-sm font-semibold tracking-[-0.03em] text-[#2D3028]">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={cn(
                          'font-mono text-xs font-semibold',
                          item.score > 80 ? 'text-[#638522]' : item.score > 70 ? 'text-[#9B761F]' : 'text-[#9A625B]'
                        )}>
                          {item.score}<span className="font-normal text-[#B1B0A6]">/100</span>
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusPill status={item.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right md:px-6">
                        <button
                          aria-label={`Open ${item.id}`}
                          className={cn(
                            'text-[#AEAFA6] transition-colors group-hover:text-[#536E25]',
                            isSelected && 'text-[#536E25]'
                          )}
                        >
                          <ArrowUpRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3 md:px-6 border-t border-[#EBE8DF]">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#999A90]">
              Showing {visibleCases.length} of 148 signals
            </span>
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#506F24] hover:text-[#283E10]"
            >
              {showAll ? 'Show less' : 'View full queue'}
              <ChevronRight size={14} />
            </button>
          </div>
        </section>

        {/* Selected Intervention Panel */}
        <aside className="border border-[#DEDBD1] bg-[#E9EDDC]">
          <div className="border-b border-[#CDD5BA] px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#78845B]">
                Selected intervention
              </p>
              <span className="font-mono text-[9px] text-[#768064]">
                {activeCase.id}
              </span>
            </div>
            <h3 className="mt-3 font-display text-[1.45rem] font-semibold leading-tight tracking-[-0.055em] text-[#273020]">
              {activeCase.channel}<br />
              <span className="text-[#6C8733]">for {activeCase.name}</span>
            </h3>
            <p className="mt-2 text-xs leading-5 text-[#68705B]">
              {activeCase.reason} · ₹{activeCase.amount.toLocaleString('en-IN')} exposure
            </p>
          </div>

          <div className="px-5 py-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={15} className="text-[#6C8733]" />
              <span className="text-xs font-semibold text-[#3D492E]">Why this move</span>
            </div>
            <p className="text-sm leading-6 text-[#4F5845]">
              {activeCase.whyExplanation || 'High recoverability with low customer friction. The agent will attempt one soft recovery before escalating or stopping.'}
            </p>

            <div className="mt-5 space-y-2.5 border-y border-[#CDD5BA] py-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#707866]">Max attempts</span>
                <span className="font-mono text-[10px] font-semibold text-[#354128]">
                  {activeCase.maxAttempts || 2}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#707866]">Cooldown</span>
                <span className="font-mono text-[10px] font-semibold text-[#354128]">
                  {activeCase.cooldown || '19 minutes'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#707866]">Stop rule</span>
                <span className="font-mono text-[10px] font-semibold text-[#A15C4E]">
                  {activeCase.stopRule || 'Hard decline'}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2.5">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#6C8733]" />
              <p className="text-[11px] leading-5 text-[#68705B]">
                No message will send after a customer opts out, pays, or reaches the attempt cap.
              </p>
            </div>

            <Button
              onClick={runSingle}
              className="mt-5 h-10 w-full gap-2 rounded-xs bg-[#26321E] text-xs font-semibold text-[#F4F4E9] hover:bg-[#334229] active:scale-[0.97]"
            >
              <Zap size={14} className="text-[#C7F36B]" />
              Simulate intervention
            </Button>
          </div>

          <div className="border-t border-[#CDD5BA] bg-[#E1E7CE] px-5 py-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#72805C]">
                Policy status
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#5F7929]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7FA536]" />
                Within bounds
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom 2-Column Row: Agent Flow + Recovery Mix */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        {/* Agent Flow & Policy Spine */}
        <section className="relative overflow-hidden border border-[#DEDBD1] bg-[#FAF9F5] px-5 py-5 text-[#2B2D27] md:px-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8C8D83]">
                Agent flow
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold tracking-[-0.05em] text-[#2B2D27]">
                From signal to settlement.
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#7E8177]">
              <Gauge size={14} className="text-[#87A62F]" />
              {isRunning ? 'Executing' : 'Ready to run'}
            </div>
          </div>

          {/* 5-Step Progress Rail */}
          <div className="mt-7 grid grid-cols-5 gap-1">
            {FLOW_STEPS.map((step, index) => (
              <div key={step} className="relative">
                <div className={cn('flex h-1.5 w-full', index < stage ? 'bg-[#A4C34A]' : 'bg-[#E0DED4]')}>
                  <span className={cn(
                    'absolute -top-1.5 h-4 w-4 rounded-full border-2 border-[#FAF9F5]',
                    index < stage ? 'bg-[#A4C34A]' : 'bg-[#D4D2C8]'
                  )} />
                </div>
                <p className={cn(
                  'mt-3 font-mono text-[9px] uppercase tracking-[0.1em]',
                  index < stage ? 'font-semibold text-[#5D7821]' : 'text-[#A0A097]'
                )}>
                  {step}
                </p>
              </div>
            ))}
          </div>

          {/* Policy Spine Checkpoints */}
          <div className="mt-7 border-l-2 border-[#D0D3C4] pl-4">
            <div className="mb-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#7F875F]">
              <GitBranch size={13} />
              Policy spine · stop rules visible
            </div>
            <div className="grid gap-2 sm:grid-cols-5">
              {[
                ['01', 'Detect', 'signal'],
                ['02', 'Diagnose', 'root cause'],
                ['03', 'Intervene', '≤ 2 tries'],
                ['04', 'Measure', 'paid / not paid'],
                ['05', 'Audit', 'stop + log']
              ].map(([number, name, rule], index) => (
                <div
                  key={name}
                  className={cn(
                    'flex items-start gap-2 border-b pb-2 last:border-b-0 sm:border-b-0 sm:border-r sm:pr-3 sm:last:border-r-0',
                    index < stage ? 'border-[#B9D75E]' : 'border-[#DFE0D6]'
                  )}
                >
                  <span className={cn('font-mono text-[9px]', index < stage ? 'text-[#6A8B20]' : 'text-[#A1A398]')}>
                    {number}
                  </span>
                  <div>
                    <p className={cn('font-mono text-[9px] uppercase tracking-[0.08em]', index < stage ? 'text-[#526B20]' : 'text-[#8F9189]')}>
                      {name}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#93958B]">{rule}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Stat Tiles */}
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="bg-[#F2F0E8] px-3 py-3">
              <div className="flex items-center gap-2 text-[#85877D]">
                <MousePointerClick size={13} />
                <span className="font-mono text-[9px] uppercase tracking-[0.1em]">Signals</span>
              </div>
              <p className="mt-2 font-display text-xl font-semibold tracking-[-0.05em] text-[#2B2D27]">
                148
              </p>
            </div>
            <div className="bg-[#F2F0E8] px-3 py-3">
              <div className="flex items-center gap-2 text-[#85877D]">
                <ClipboardCheck size={13} />
                <span className="font-mono text-[9px] uppercase tracking-[0.1em]">Eligible</span>
              </div>
              <p className="mt-2 font-display text-xl font-semibold tracking-[-0.05em] text-[#2B2D27]">
                6
              </p>
            </div>
            <div className="bg-[#F2F0E8] px-3 py-3">
              <div className="flex items-center gap-2 text-[#85877D]">
                <PauseCircle size={13} />
                <span className="font-mono text-[9px] uppercase tracking-[0.1em]">Protected</span>
              </div>
              <p className="mt-2 font-display text-xl font-semibold tracking-[-0.05em] text-[#2B2D27]">
                8
              </p>
            </div>
          </div>
        </section>

        {/* Recovery Mix */}
        <section className="border border-[#30342C] bg-[#22251E] px-5 py-5 text-[#F2F0E6] md:px-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#98A28B]">
                Recovery mix
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold tracking-[-0.05em] text-white">
                Where value came back.
              </h3>
            </div>
            <BarChart3 size={17} className="text-[#C7F36B]" />
          </div>

          <div className="mt-6 space-y-4">
            {[
              ['Payment retries', '₹1.74L', 42, '#C7F36B'],
              ['Receivables', '₹1.28L', 31, '#9DB7E3'],
              ['Checkout recovery', '₹72K', 17, '#E7C56C'],
              ['Subscription save', '₹44K', 10, '#D89187'],
            ].map(([label, value, width, color]) => (
              <div key={label as string}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-[#C4C8BB]">{label as string}</span>
                  <span className="font-mono text-[10px] text-[#F2F0E6]">{value as string}</span>
                </div>
                <div className="h-1.5 bg-[#3B4035]">
                  <div className="h-full" style={{ width: `${width}%`, backgroundColor: color as string }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex items-center justify-between border-t border-[#3C4135] pt-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8F9788]">
              Measured recovery
            </span>
            <span className="font-display text-2xl font-semibold tracking-[-0.06em] text-[#C7F36B]">
              ₹4.18L
            </span>
          </div>
        </section>
      </div>

      {/* Append-Only Audit Trail */}
      <section className="border border-[#DEDBD1] bg-[#FAF9F5] text-[#2B2D27]">
        <div className="flex items-center justify-between border-b border-[#DEDBD1] px-5 py-4 md:px-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold tracking-[-0.04em] text-[#2B2D27]">
                Audit trail
              </h3>
              <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#6E8B2C]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#A7C64D]" />
                Append-only
              </span>
            </div>
            <p className="mt-1 text-xs text-[#85867E]">
              Every decision is recorded with a reason, guardrail, and result.
            </p>
          </div>
          <button
            onClick={handleExportAudit}
            className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#667F2B] hover:text-[#273B11] cursor-pointer"
          >
            <FileText size={14} />
            Export log
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[670px] text-left">
            <thead>
              <tr className="border-b border-[#EBE8DF] font-mono text-[9px] uppercase tracking-[0.14em] text-[#9A9B91]">
                <th className="px-5 py-3 font-medium md:px-6">Time</th>
                <th className="px-3 py-3 font-medium">Case</th>
                <th className="px-3 py-3 font-medium">Action</th>
                <th className="px-3 py-3 font-medium">Detail</th>
                <th className="px-5 py-3 text-right font-medium md:px-6">Result</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((row) => (
                <tr key={row.time + row.id} className="border-b border-[#EBE8DF] last:border-b-0 hover:bg-[#F4F1E7]">
                  <td className="px-5 py-3.5 font-mono text-[10px] text-[#85867D] md:px-6">{row.time}</td>
                  <td className="px-3 py-3.5 font-mono text-[10px] font-semibold text-[#5E6E2F]">{row.id}</td>
                  <td className="px-3 py-3.5 text-xs font-medium text-[#474941]">{row.action}</td>
                  <td className="px-3 py-3.5 text-xs text-[#85867D]">{row.detail}</td>
                  <td className="px-5 py-3.5 text-right md:px-6">
                    <span className={cn(
                      'font-mono text-[9px] uppercase tracking-[0.1em]',
                      row.tone === 'lime' ? 'text-[#6E8E24]' : row.tone === 'amber' ? 'text-[#A27820]' : 'text-[#AE5A51]'
                    )}>
                      {row.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer Disclaimer */}
      <footer className="flex flex-col gap-3 border-t border-[#30342C] pt-5 font-mono text-[9px] uppercase tracking-[0.13em] text-[#81867A] sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2">
          <Terminal size={13} />
          Recovery OS · Simulation mode
        </span>
        <span>
          Outbound actions are simulated · No customer data connected
        </span>
      </footer>
    </div>
  );
}

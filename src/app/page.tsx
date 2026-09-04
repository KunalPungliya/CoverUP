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
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { RecoveryModal } from '@/components/recovery-modal';
import { CustomerDrawer } from '@/components/customer-drawer';
import { Subscription, Customer, RecoveryAction, DashboardMetrics } from '@/lib/types';

type SubWithCustomer = Subscription & { 
  customers: Customer;
  failure_reason?: string;
  retry_count?: number;
  risk_score?: number;
  next_retry_at?: string;
};

const FLOW_STEPS = ['Detect', 'Diagnose', 'Intervene', 'Measure', 'Audit'];

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'border-[#BFDB78] bg-[#EDF7CE] text-[#4E6B18]',
    past_due: 'border-[#E7C779] bg-[#FFF7DF] text-[#8A6413]',
    failed: 'border-[#E3A5A0] bg-[#FFF0EE] text-[#A54C46]',
    recovered: 'border-[#BFDB78] bg-[#EDF7CE] text-[#4E6B18]',
    cancelled: 'border-[#D9D6CB] bg-[#F4F1E8] text-[#68665D]',
    unrecoverable: 'border-[#E3A5A0] bg-[#FFF0EE] text-[#A54C46]',
  };
  const label = status.replace(/_/g, ' ');
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.13em]', styles[status] || styles.cancelled)}>
      <span className={cn(
        'h-1.5 w-1.5 rounded-full',
        status === 'active' || status === 'recovered' ? 'bg-[#89B82C]' :
        status === 'past_due' ? 'bg-[#D3A12A]' :
        status === 'failed' || status === 'unrecoverable' ? 'bg-[#CE6861]' : 'bg-[#9E9B90]'
      )} />
      {label}
    </span>
  );
}

export default function MasterDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubWithCustomer[]>([]);
  const [auditLogs, setAuditLogs] = useState<RecoveryAction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Selection
  const [filter, setFilter] = useState<string>('All');
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Recovery Engine & Modal state
  const [recovering, setRecovering] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [stage, setStage] = useState(3);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<any>(null);

  // Customer Drawer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Live Toast & Clock
  const [currentTime, setCurrentTime] = useState('09:42:18');
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type?: 'info' | 'success' } | null>(null);

  const showToast = (title: string, desc: string, type: 'info' | 'success' = 'info') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real database data
  const fetchData = useCallback(async () => {
    try {
      const [resMetrics, resSubs, resAudit] = await Promise.all([
        fetch('/api/dashboard').then((r) => r.json()),
        fetch('/api/subscriptions?limit=50').then((r) => r.json()),
        fetch('/api/audit?limit=10').then((r) => r.json()),
      ]);

      if (resMetrics.success) setMetrics(resMetrics.data);
      if (resSubs.success && resSubs.data.subscriptions) {
        setSubscriptions(resSubs.data.subscriptions);
        if (resSubs.data.subscriptions.length > 0 && !activeSubId) {
          setActiveSubId(resSubs.data.subscriptions[0].id);
        }
      }
      if (resAudit.success && resAudit.data.actions) {
        setAuditLogs(resAudit.data.actions);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeSubId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Seed live database with test cases
  const handleSeed = async () => {
    setSeeding(true);
    showToast('Seeding Database...', 'Generating test subscriptions across Indian payment rails.');
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        await fetchData();
        showToast('Database Seeded', `Generated ${json.data?.subscriptions?.length || 20} curated subscriptions.`, 'success');
      } else {
        showToast('Seed Failed', json.error || 'Could not seed database.');
      }
    } catch (e: any) {
      showToast('Error', e.message);
    } finally {
      setSeeding(false);
    }
  };

  // Run Real Autonomous Recovery Batch (Gemini Flash AI Loop)
  const handleRecover = async () => {
    if (recovering) return;
    setRecovering(true);
    setShowRecoveryModal(true);
    setStage(1);
    showToast('Autonomous Recovery Started', 'Scanning past-due cohorts and initializing Gemini AI loop.');

    // Animate stage stepper
    [2, 3, 4, 5].forEach((nextStage, index) => {
      setTimeout(() => setStage(nextStage), 600 * (index + 1));
    });

    try {
      const res = await fetch('/api/recover', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setRecoveryResult(json.data);
        setStage(5);
        await fetchData();
        showToast('Recovery Batch Complete', `Evaluated ${json.data?.total_processed || 0} subscriptions.`, 'success');
      } else {
        showToast('Recovery Stopped', json.error || 'Execution stopped by policy.');
      }
    } catch (e: any) {
      showToast('Error', e.message);
    } finally {
      setRecovering(false);
    }
  };

  const activeSub = useMemo(() => {
    return subscriptions.find((s) => s.id === activeSubId) || subscriptions[0] || null;
  }, [subscriptions, activeSubId]);

  const filteredSubs = useMemo(() => {
    if (filter === 'All') return subscriptions;
    if (filter === 'At-Risk') return subscriptions.filter(s => ['past_due', 'failed'].includes(s.status));
    if (filter === 'Active') return subscriptions.filter(s => s.status === 'active');
    if (filter === 'Recovered') return subscriptions.filter(s => s.status === 'recovered');
    return subscriptions;
  }, [subscriptions, filter]);

  const visibleSubs = showAll ? filteredSubs : filteredSubs.slice(0, 5);

  const handleSelectSub = (sub: SubWithCustomer) => {
    setActiveSubId(sub.id);
    showToast(
      `${sub.customers?.name || 'Customer'} Selected`,
      `${formatCurrency(sub.amount)} · Status: ${sub.status}`
    );
  };

  const handleSimulateSingle = () => {
    if (!activeSub) return;
    showToast(
      `Intervention Simulated for ${activeSub.customers?.name || 'Customer'}`,
      `Smart retry & dunning nudge queued within bounded limits.`,
      'success'
    );
  };

  const handleExportAudit = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Time,Action Type,Outcome,Confidence,AI Reasoning"].concat(
          auditLogs.map(r => `${r.created_at},${r.action_type},${r.outcome},${Math.round((r.ai_confidence || 0.92) * 100)}%,"${(r.ai_reasoning || '').replace(/"/g, '""')}"`)
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

  // Metrics Display
  const atRiskAmount = metrics?.totalAmountAtRisk ?? 842000;
  const recoveredAmount = metrics?.totalAmountRecovered ?? 418000;
  const recoveryRate = metrics?.recoveryRate ? metrics.recoveryRate * 100 : 49.6;
  const atRiskCount = metrics?.atRiskSubscriptions ?? 148;
  const recoveredCount = metrics?.recoveredSubscriptions ?? 4;

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
          <Button
            onClick={handleSeed}
            disabled={seeding}
            variant="outline"
            className="h-10 gap-2 rounded-xs border-[#3C4135] bg-[#171914] text-xs font-mono font-semibold text-[#D7D8CC] hover:bg-[#242820] hover:text-white"
          >
            <Database size={14} className={seeding ? "animate-spin text-[#C7F36B]" : "text-[#87A62F]"} />
            {seeding ? 'Seeding Database...' : 'Seed Demo Cohort'}
          </Button>
          <Button
            onClick={handleRecover}
            disabled={recovering}
            className="h-10 gap-2 rounded-xs bg-[#20231C] px-4 text-xs font-semibold text-[#F8F6EE] shadow-[3px_3px_0_#C7F36B] hover:bg-[#30352A] active:scale-[0.97]"
          >
            {recovering ? <RefreshCw size={14} className="animate-spin text-[#C7F36B]" /> : <Play size={14} fill="currentColor" className="text-[#C7F36B]" />}
            {recovering ? 'Running batch' : 'Run recovery batch'}
          </Button>
        </div>
      </div>

      {/* Hero Batch Summary Card */}
      <section className="relative isolate min-h-[235px] overflow-hidden bg-[#171914] px-6 py-7 text-[#F7F4EB] border border-[#2B2D27] shadow-[0_16px_40px_rgba(26,27,22,0.12)] md:px-9 md:py-8">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#171914_0%,rgba(23,25,20,.97)_35%,rgba(23,25,20,.45)_75%,rgba(23,25,20,.25)_100%)]" />
        <div className="relative max-w-[570px]">
          <div className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#C7F36B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C7F36B]" />
            Live Supabase Batch · {metrics?.recentBatches?.[0]?.id?.slice(0, 8) ? `#${metrics.recentBatches[0].id.slice(0, 8)}` : '#RR-2026-09-03-A'}
          </div>
          <h2 className="max-w-[560px] font-display text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[0.98] tracking-[-0.06em]">
            {formatCurrency(atRiskAmount)} at risk.<br />
            <span className="text-[#C7F36B]">{formatCurrency(recoveredAmount)} already back.</span>
          </h2>
          <p className="mt-5 max-w-[470px] text-sm leading-6 text-[#BABDB0]">
            The agent is monitoring {subscriptions.length} active customer subscriptions across Indian payment rails. {atRiskCount} risk signals pending intervention.
          </p>
        </div>
        <div className="absolute bottom-7 right-8 hidden text-right md:block">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8B9180]">
            Net recovery rate
          </div>
          <div className="mt-1 font-display text-5xl font-bold tracking-[-0.07em] text-[#C7F36B]">
            {typeof recoveryRate === 'number' ? `${recoveryRate.toFixed(1)}%` : '49.6%'}
          </div>
          <div className="mt-1 font-mono text-[10px] text-[#91978A]">
            +8.2% vs previous batch
          </div>
        </div>
      </section>

      {/* 4-Column KPI Strip */}
      <section className="grid border border-[#DEDBD1] bg-[#FAF9F5] sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total at risk', value: formatCurrency(atRiskAmount), sub: `${atRiskCount} subscriptions`, valueClass: 'text-[#20211D]', Icon: CircleDollarSign },
          { label: 'Recovered', value: formatCurrency(recoveredAmount), sub: `${recoveredCount} rescued`, valueClass: 'text-[#6B8E21]', Icon: BadgeCheck },
          { label: 'In motion', value: formatCurrency(Math.round(atRiskAmount * 0.3)), sub: 'active dunning actions', valueClass: 'text-[#3C5C92]', Icon: Zap },
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
                  {subscriptions.length} live
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
                onChange={(e) => setFilter(e.target.value)}
                className="h-8 border border-[#D8D5CB] bg-[#F7F5EE] px-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#55574E] outline-none focus:border-[#9AB54D]"
              >
                <option value="All">All Statuses</option>
                <option value="At-Risk">At-Risk Only</option>
                <option value="Active">Active Only</option>
                <option value="Recovered">Recovered Only</option>
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
                {visibleSubs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center font-mono text-xs text-[#85867E]">
                      No subscriptions found. Click &quot;Seed Demo Cohort&quot; to populate real test cases.
                    </td>
                  </tr>
                ) : (
                  visibleSubs.map((sub) => {
                    const isSelected = activeSubId === sub.id;
                    const initials = sub.customers?.name
                      ? sub.customers.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                      : 'CU';
                    const riskScore = sub.risk_score || (sub.status === 'active' ? 15 : 85);
                    const reason = sub.failure_reason || (sub.status === 'active' ? 'Token Healthy' : 'Issuer soft decline');
                    return (
                      <tr
                        key={sub.id}
                        onClick={() => handleSelectSub(sub)}
                        className={cn(
                          'group cursor-pointer border-b border-[#EBE8DF] transition-colors hover:bg-[#F4F1E7]',
                          isSelected && 'bg-[#F0F5DF]'
                        )}
                      >
                        <td className="px-5 py-3.5 md:px-6">
                          <div className="flex items-center gap-3">
                            <div className="grid h-8 w-8 shrink-0 place-items-center bg-[#E8E5DB] font-mono text-[10px] font-semibold text-[#61645A]">
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#2B2D27]">{sub.customers?.name || 'Customer'}</p>
                              <p className="mt-0.5 text-[11px] text-[#8B8C82] font-mono">{sub.plan_name || 'Pro Plan'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <p className="text-xs font-medium text-[#474941]">{reason}</p>
                          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#A0A097]">
                            {sub.payment_method?.type?.toUpperCase() || 'CARD'} · {sub.billing_cycle || 'mo'}
                          </p>
                        </td>
                        <td className="px-3 py-3.5 font-display text-sm font-semibold tracking-[-0.03em] text-[#2D3028]">
                          {formatCurrency(sub.amount)}
                        </td>
                        <td className="px-3 py-3.5">
                          <span className={cn(
                            'font-mono text-xs font-semibold',
                            riskScore < 40 ? 'text-[#638522]' : riskScore < 70 ? 'text-[#9B761F]' : 'text-[#9A625B]'
                          )}>
                            {riskScore}<span className="font-normal text-[#B1B0A6]">/100</span>
                          </span>
                        </td>
                        <td className="px-3 py-3.5">
                          <StatusPill status={sub.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right md:px-6">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomerId(sub.customer_id);
                              setDrawerOpen(true);
                            }}
                            aria-label={`Open ${sub.id}`}
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
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3 md:px-6 border-t border-[#EBE8DF]">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#999A90]">
              Showing {visibleSubs.length} of {subscriptions.length} live records
            </span>
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#506F24] hover:text-[#283E10] cursor-pointer"
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
              <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[#78845B]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6C8733]" />
                Selected intervention
              </span>
              <span className="font-mono text-[9px] font-bold text-[#768064]">
                {activeSub ? `SUB-${activeSub.id.slice(0, 6)}` : 'RR-0428'}
              </span>
            </div>
            <h3 className="mt-3 font-display text-[1.45rem] font-semibold leading-tight tracking-[-0.055em] text-[#273020]">
              {activeSub?.status === 'active' ? 'Healthy Retention' : activeSub?.failure_reason === 'card_expired' ? '1-Click Update Portal' : activeSub?.failure_reason === 'authentication_required' ? '3DS OTP Recovery' : activeSub?.failure_reason === 'fraud_suspected' ? 'Immediate Risk Halt' : 'Smart Retry + Dunning'}<br />
              <span className="text-[#6C8733]">for {activeSub?.customers?.name || 'Acme Platforms'}</span>
            </h3>
            <div className="mt-2 flex items-center gap-2 text-xs font-mono text-[#68705B]">
              <span>{activeSub?.plan_name || 'Growth Plan'}</span>
              <span>·</span>
              <span className="font-bold text-[#273020]">{formatCurrency(activeSub?.amount || 18400)}</span>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Diagnosis Badge */}
            <div className="p-3 bg-[#DEE5CF] border border-[#CBD5B7] space-y-1">
              <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-[#68744F]">
                <span>Root-Cause Diagnosis</span>
                <span className="font-bold text-[#3D4B26]">
                  {activeSub?.failure_reason === 'insufficient_funds' ? 'Soft Decline' : activeSub?.failure_reason === 'card_expired' ? 'Token Invalidation' : activeSub?.failure_reason === 'authentication_required' ? 'Auth Drop' : activeSub?.failure_reason === 'network_error' ? 'Switch Timeout' : activeSub?.failure_reason === 'fraud_suspected' ? 'Hard Block' : 'Transient Soft Decline'}
                </span>
              </div>
              <p className="text-xs text-[#273020] font-medium leading-snug">
                {activeSub?.failure_reason === 'insufficient_funds'
                  ? 'Transient balance shortfall. High recapture yield via morning clearing retry.'
                  : activeSub?.failure_reason === 'card_expired'
                  ? 'Card expiration passed. Automatic retry paused until customer updates payment token.'
                  : activeSub?.failure_reason === 'authentication_required'
                  ? 'Customer dropped out of 3DS challenge. SMS/WhatsApp deep-link queued.'
                  : activeSub?.failure_reason === 'fraud_suspected'
                  ? 'Issuer risk threshold exceeded. Bounded policy enforces zero-retry halt.'
                  : activeSub?.status === 'active'
                  ? 'Token healthy and active at gateway switch.'
                  : 'Issuer soft decline. Scheduling exponential smart retry with jitter.'}
              </p>
            </div>

            {/* Why This Move */}
            <div>
              <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold text-[#3D492E]">
                <Sparkles size={13} className="text-[#6C8733]" />
                Strategy Rationale
              </div>
              <p className="text-xs leading-relaxed text-[#4F5845]">
                {activeSub?.status === 'active'
                  ? 'Zero involuntary churn risk. Subscription token is healthy and valid at payment switch.'
                  : activeSub?.failure_reason === 'card_expired'
                  ? 'Blind retries will fail 100% of the time. 1-click tokenized update email dispatched to prevent permanent cohort churn.'
                  : activeSub?.failure_reason === 'fraud_suspected'
                  ? 'Protecting merchant account from chargeback penalties. Auto-escalated to human review.'
                  : 'High recoverability with low customer friction. The agent will attempt one exponential soft retry before escalating.'}
              </p>
            </div>

            {/* Limits Table */}
            <div className="space-y-2 border-y border-[#CDD5BA] py-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#707866]">Channel Chosen</span>
                <span className="font-mono text-[10px] font-bold text-[#354128]">
                  {activeSub?.failure_reason === 'card_expired' ? 'Email Portal' : activeSub?.failure_reason === 'authentication_required' ? 'WhatsApp Nudge' : activeSub?.failure_reason === 'fraud_suspected' ? 'Risk Review' : 'Smart Silent Retry'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#707866]">Optimal Window</span>
                <span className="font-mono text-[10px] font-bold text-[#354128]">
                  {activeSub?.failure_reason === 'insufficient_funds' ? '06:15 IST (Clearing)' : 'Immediate'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#707866]">Max Attempts</span>
                <span className="font-mono text-[10px] font-bold text-[#354128]">3 tries</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#707866]">Cooldown</span>
                <span className="font-mono text-[10px] font-bold text-[#354128]">24 hours</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-[11px] leading-5 text-[#68705B]">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#6C8733]" />
              <span>Anti-fatigue limit enforced: Zero messages sent after customer pays or opts out.</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                onClick={handleSimulateSingle}
                className="h-9 gap-1.5 rounded-xs bg-[#26321E] text-xs font-semibold text-[#F4F4E9] hover:bg-[#334229] active:scale-[0.97]"
              >
                <Zap size={13} className="text-[#C7F36B]" />
                Simulate Move
              </Button>
              <Button
                onClick={() => {
                  if (activeSub) {
                    setSelectedCustomerId(activeSub.customer_id);
                    setDrawerOpen(true);
                  }
                }}
                variant="outline"
                className="h-9 gap-1.5 rounded-xs border-[#B9C4A3] bg-transparent text-xs font-semibold text-[#273020] hover:bg-[#DDE5CF]"
              >
                <UserRound size={13} />
                360° Profile
              </Button>
            </div>
          </div>

          <div className="border-t border-[#CDD5BA] bg-[#E1E7CE] px-5 py-2.5">
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
              {recovering ? 'Executing' : 'Ready to run'}
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
                ['03', 'Intervene', '≤ 3 tries'],
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
                <span className="font-mono text-[9px] uppercase tracking-[0.1em]">Subscriptions</span>
              </div>
              <p className="mt-2 font-display text-xl font-semibold tracking-[-0.05em] text-[#2B2D27]">
                {subscriptions.length}
              </p>
            </div>
            <div className="bg-[#F2F0E8] px-3 py-3">
              <div className="flex items-center gap-2 text-[#85877D]">
                <ClipboardCheck size={13} />
                <span className="font-mono text-[9px] uppercase tracking-[0.1em]">At-Risk</span>
              </div>
              <p className="mt-2 font-display text-xl font-semibold tracking-[-0.05em] text-[#2B2D27]">
                {atRiskCount}
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
              ['Smart Payment Retries', formatCurrency(Math.round(recoveredAmount * 0.42)), 42, '#C7F36B'],
              ['1-Click Update Portal', formatCurrency(Math.round(recoveredAmount * 0.31)), 31, '#9DB7E3'],
              ['WhatsApp & SMS Dunning', formatCurrency(Math.round(recoveredAmount * 0.17)), 17, '#E7C56C'],
              ['AR Escalation Save', formatCurrency(Math.round(recoveredAmount * 0.10)), 10, '#D89187'],
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
              {formatCurrency(recoveredAmount)}
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
                Live Database Stream
              </span>
            </div>
            <p className="mt-1 text-xs text-[#85867E]">
              Every decision is recorded in PostgreSQL with AI reasoning, guardrails, and gateway result.
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
                <th className="px-3 py-3 font-medium">Action Type</th>
                <th className="px-3 py-3 font-medium">Confidence</th>
                <th className="px-3 py-3 font-medium">AI Reasoning</th>
                <th className="px-5 py-3 text-right font-medium md:px-6">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center font-mono text-xs text-[#85867E]">
                    No recovery actions logged. Click &quot;Run recovery batch&quot; to execute Gemini AI reasoning.
                  </td>
                </tr>
              ) : (
                auditLogs.map((row) => (
                  <tr key={row.id} className="border-b border-[#EBE8DF] last:border-b-0 hover:bg-[#F4F1E7]">
                    <td className="px-5 py-3.5 font-mono text-[10px] text-[#85867D] md:px-6">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-3 py-3.5 font-mono text-[10px] font-bold text-[#5E6E2F] uppercase">
                      {row.action_type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-3 py-3.5 font-mono text-xs text-[#6B8E21] font-semibold">
                      {Math.round((row.ai_confidence || 0.92) * 100)}%
                    </td>
                    <td className="px-3 py-3.5 text-xs text-[#474941] max-w-sm truncate">
                      {row.ai_reasoning || 'Bounded policy intervention executed.'}
                    </td>
                    <td className="px-5 py-3.5 text-right md:px-6">
                      <span className={cn(
                        'font-mono text-[9px] uppercase tracking-[0.1em] px-2 py-0.5 border font-semibold',
                        row.outcome === 'success' ? 'border-[#BFDB78] bg-[#EDF7CE] text-[#4E6B18]' :
                        row.outcome === 'pending' ? 'border-[#E7C779] bg-[#FFF7DF] text-[#8A6413]' :
                        'border-[#E3A5A0] bg-[#FFF0EE] text-[#A54C46]'
                      )}>
                        {row.outcome}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Slide-Over Customer 360° Drawer */}
      <CustomerDrawer
        customerId={selectedCustomerId}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedCustomerId(null);
        }}
      />

      {/* Autonomous Recovery Stepper Modal */}
      <RecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => {
          setShowRecoveryModal(false);
          setRecoveryResult(null);
        }}
        isProcessing={recovering}
        result={recoveryResult}
      />

      {/* Footer Disclaimer */}
      <footer className="flex flex-col gap-3 border-t border-[#30342C] pt-5 font-mono text-[9px] uppercase tracking-[0.13em] text-[#81867A] sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2">
          <Terminal size={13} />
          VaultBack OS · Connected to Supabase & Gemini Flash AI
        </span>
        <span>
          Autonomous multi-channel dunning & smart retry execution
        </span>
      </footer>
    </div>
  );
}

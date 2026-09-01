'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardMetrics, RecoveryAction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend } from 'recharts';
import { 
  Database, 
  Play, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Banknote, 
  Activity, 
  Clock, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Brain,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { RecoveryModal } from '@/components/recovery-modal';

const ACTION_COLORS = ['#0A0D14', '#FDDD35', '#00BA68', '#2563EB', '#F59E0B', '#EF4444'];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentActions, setRecentActions] = useState<RecoveryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');
  const [recoverMessage, setRecoverMessage] = useState('');
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<any>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const [resMetrics, resAudit] = await Promise.all([
        fetch('/api/dashboard').then((r) => r.json()),
        fetch('/api/audit?limit=5').then((r) => r.json()),
      ]);

      if (resMetrics.success) setMetrics(resMetrics.data);
      if (resAudit.success) setRecentActions(resAudit.data.actions);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMessage('');
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const json = await res.json();
      setSeedMessage(json.success ? `✓ ${json.message}` : `✕ ${json.error}`);
      if (json.success) {
        setLoading(true);
        await fetchMetrics();
      }
    } catch (error) {
      setSeedMessage(`✕ Error: ${error}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleRecover = async () => {
    setShowRecoveryModal(true);
    setRecovering(true);
    setRecoverMessage('');
    try {
      const res = await fetch('/api/recover', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setRecoveryResult(json.data);
        await fetchMetrics();
      } else {
        setRecoverMessage(`✕ ${json.error}`);
        setShowRecoveryModal(false);
      }
    } catch (error) {
      setRecoverMessage(`✕ Error: ${error}`);
      setShowRecoveryModal(false);
    } finally {
      setRecovering(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const getTrendBadge = (isPositive: boolean, pct: string) => {
    return isPositive ? (
      <span className="inline-flex items-center text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-2">
        <TrendingUp className="h-3 w-3 mr-1 text-[#00BA68]" /> +{pct}
      </span>
    ) : (
      <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 mt-2">
        <TrendingDown className="h-3 w-3 mr-1 text-rose-600" /> -{pct}
      </span>
    );
  };

  const metricCards = metrics
    ? [
        {
          title: 'Total Subscriptions',
          value: metrics.totalSubscriptions.toString(),
          icon: <Activity className="h-5 w-5 text-zinc-950" />,
          color: 'text-zinc-950',
          bg: 'bg-zinc-100 border-zinc-200',
          trend: getTrendBadge(true, '8%'),
        },
        {
          title: 'Active Subscriptions',
          value: metrics.activeSubscriptions.toString(),
          icon: <CheckCircle2 className="h-5 w-5 text-[#00BA68]" />,
          color: 'text-[#00BA68]',
          bg: 'bg-emerald-50 border-emerald-200',
          trend: getTrendBadge(true, '12%'),
        },
        {
          title: 'At-Risk Subscriptions',
          value: metrics.atRiskSubscriptions.toString(),
          icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
          color: 'text-amber-600',
          bg: 'bg-amber-50 border-amber-200',
          trend: getTrendBadge(false, '4%'),
        },
        {
          title: 'Recovered Subscriptions',
          value: metrics.recoveredSubscriptions.toString(),
          icon: <ShieldCheck className="h-5 w-5 text-[#00BA68]" />,
          color: 'text-[#00BA68]',
          bg: 'bg-emerald-50 border-emerald-200',
          trend: getTrendBadge(true, '23%'),
        },
        {
          title: 'Total Revenue at Risk',
          value: formatCurrency(metrics.totalAmountAtRisk),
          icon: <Banknote className="h-5 w-5 text-amber-600" />,
          color: 'text-zinc-950',
          bg: 'bg-amber-50 border-amber-200',
          trend: getTrendBadge(false, '15%'),
        },
        {
          title: 'Total Recaptured ARR',
          value: formatCurrency(metrics.totalAmountRecovered),
          icon: <Banknote className="h-5 w-5 text-[#00BA68]" />,
          color: 'text-[#00BA68]',
          bg: 'bg-emerald-50 border-emerald-200',
          trend: getTrendBadge(true, '31%'),
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">Revenue Recovery Cockpit</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Autonomous dunning intelligence for subscription businesses</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" onClick={handleSeed} loading={seeding} className="gap-2 text-xs">
            <Database className="h-4 w-4 text-zinc-700" />
            Seed Demo Cohort
          </Button>
          <Button variant="default" onClick={handleRecover} loading={recovering} className="gap-2 text-xs font-semibold">
            <Play className="h-4 w-4 fill-[#FDDD35] text-[#FDDD35]" />
            Run Autonomous Recovery
          </Button>
        </div>
      </div>

      {/* Action Messages */}
      {seedMessage && (
        <div className="p-3.5 rounded-xl border border-[#E2E5EB] bg-white text-xs font-medium text-zinc-800 shadow-2xs">
          {seedMessage}
        </div>
      )}
      {recoverMessage && (
        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-medium text-rose-800 shadow-2xs">
          {recoverMessage}
        </div>
      )}

      {/* Interactive System Intro: How VaultBack Works (Paddle Architectural Pipeline) */}
      <div className="rounded-2xl border border-[#E2E5EB] bg-white p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#FDDD35]" /> How VaultBack Recovers Failed Payments
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Zero-latency, 3-stage autonomous pipeline powered by Google Gemini AI</p>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono self-start sm:self-auto bg-slate-50">
            End-to-End Latency: &lt; 2.5s
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-zinc-950 text-[#FDDD35] font-bold text-xs flex items-center justify-center">1</span>
              <h3 className="font-bold text-zinc-950 text-xs">Detect</h3>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              Scans past due subscriptions in 0.2s, pulls real gateway decline codes, and computes urgency risk scores.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-zinc-950 text-[#FDDD35] font-bold text-xs flex items-center justify-center">2</span>
              <h3 className="font-bold text-zinc-950 text-xs">Decide</h3>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              Evaluates safety guardrails (0ms), then prompts Google Gemini Flash in parallel workers to formulate optimal actions.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-zinc-950 text-[#FDDD35] font-bold text-xs flex items-center justify-center">3</span>
              <h3 className="font-bold text-zinc-950 text-xs">Execute</h3>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              Dispatches smart retries, payment update links, and SMS nudges while writing an immutable audit log.
            </p>
          </div>
        </div>
      </div>

      {/* 6 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((card, idx) => (
          <Card key={idx} className="hover:border-slate-300 transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500">{card.title}</p>
                  <p className={`text-2xl font-bold mt-1 tracking-tight ${card.color}`}>{card.value}</p>
                  {card.trend}
                </div>
                <div className={`p-2.5 rounded-xl border ${card.bg}`}>{card.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      {metrics && metrics.totalSubscriptions > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/subscriptions?status=past_due" className="block group">
            <Card className="hover:border-zinc-950 transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-950 group-hover:text-zinc-700 transition-colors">
                      At-Risk Subscriptions
                    </p>
                    <p className="text-[11px] text-zinc-500">{metrics.atRiskSubscriptions} accounts requiring intervention</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-0.5 transition-all" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/audit" className="block group">
            <Card className="hover:border-zinc-950 transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-100 border border-zinc-200 p-2 rounded-lg text-zinc-950">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-950 group-hover:text-zinc-700 transition-colors">
                      Audit Trail & AI Log
                    </p>
                    <p className="text-[11px] text-zinc-500">Inspect full Gemini decisioning reasoning</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-0.5 transition-all" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics" className="block group">
            <Card className="hover:border-zinc-950 transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-[#00BA68]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-950 group-hover:text-zinc-700 transition-colors">
                      Analytics & ROI Model
                    </p>
                    <p className="text-[11px] text-zinc-500">Failure breakdown & interactive ROI calculator</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-0.5 transition-all" />
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Charts Row */}
      {metrics && metrics.recoveryByReason.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3 border-b border-[#E2E5EB] bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-zinc-950">Recovery Rate by Failure Type</CardTitle>
              <CardDescription>Performance comparison across reason codes</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.recoveryByReason} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E5EB" />
                    <XAxis dataKey="reason" tick={{ fontSize: 10, fill: '#5A6578' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#5A6578' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E5EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                      cursor={{ fill: '#F7F8FA' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar dataKey="recovered" name="Recovered" fill="#00BA68" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="failed" name="Failed" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-[#E2E5EB] bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-zinc-950">AI Action Distribution</CardTitle>
              <CardDescription>Interventions executed by Google Gemini agent</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.actionDistribution} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E5EB" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#5A6578' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="action" type="category" tick={{ fontSize: 10, fill: '#0A0D14' }} width={120} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E5EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                      cursor={{ fill: '#F7F8FA' }}
                    />
                    <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]} barSize={18}>
                      {metrics.actionDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={ACTION_COLORS[index % ACTION_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Two Column Bottom Row: Batches & Activity */}
      {metrics && metrics.totalSubscriptions > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Batches Table (2 cols) */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E2E5EB] bg-slate-50/50">
              <div>
                <CardTitle className="text-sm font-bold text-zinc-950">Recent Recovery Batches</CardTitle>
                <CardDescription>Historical autonomous runs</CardDescription>
              </div>
              <Link href="/recovery" className="text-xs font-semibold text-zinc-950 hover:underline">
                View All Batches →
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E5EB] bg-slate-50/70">
                      <th className="text-left px-5 py-3 font-semibold text-zinc-500 uppercase tracking-wider">Batch ID</th>
                      <th className="text-left px-5 py-3 font-semibold text-zinc-500 uppercase tracking-wider">Executed</th>
                      <th className="text-left px-5 py-3 font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                      <th className="text-right px-5 py-3 font-semibold text-zinc-500 uppercase tracking-wider">At Risk</th>
                      <th className="text-right px-5 py-3 font-semibold text-zinc-500 uppercase tracking-wider">Recovered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {metrics.recentBatches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-zinc-700">{batch.id.slice(0, 8)}</td>
                        <td className="px-5 py-3.5 text-zinc-600">
                          {new Date(batch.started_at).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={batch.status === 'completed' ? 'success' : 'warning'}>
                            {batch.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right font-medium text-zinc-700">{batch.total_at_risk}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-emerald-800">
                          {batch.total_recovered} <span className="font-normal text-zinc-400">({formatCurrency(batch.total_amount_recovered)})</span>
                        </td>
                      </tr>
                    ))}
                    {metrics.recentBatches.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-zinc-500">
                          No recovery batches run yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Feed (1 col) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E2E5EB] bg-slate-50/50">
              <div>
                <CardTitle className="text-sm font-bold text-zinc-950">Recent Activity</CardTitle>
                <CardDescription>Live audit events</CardDescription>
              </div>
              <Link href="/audit" className="text-xs font-semibold text-zinc-950 hover:underline">
                View Audit Trail →
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3.5">
                {recentActions.map((action) => {
                  const isSuccess = action.outcome === 'success';
                  const isPending = action.outcome === 'pending';
                  const isFailed = action.outcome === 'failed';

                  return (
                    <Link href="/audit" key={action.id} className="block group">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                            isSuccess
                              ? 'bg-emerald-50 text-[#00BA68] border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : isFailed
                              ? 'bg-rose-50 text-rose-600 border-rose-200'
                              : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                          }`}
                        >
                          {isSuccess ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : isPending ? (
                            <Clock className="h-3.5 w-3.5" />
                          ) : (
                            <Activity className="h-3.5 w-3.5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-zinc-950 group-hover:text-zinc-600 transition-colors truncate">
                            {action.action_type.replace(/_/g, ' ')}
                            <span className="font-normal text-zinc-500"> for </span>
                            {action.subscriptions?.customers?.name || 'Customer'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant={isSuccess ? 'success' : isPending ? 'warning' : 'destructive'}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {action.outcome}
                            </Badge>
                            <span className="text-[11px] text-zinc-400">{formatDate(action.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {recentActions.length === 0 && (
                  <p className="text-xs text-zinc-400 text-center py-6">No recent actions logged.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {metrics && metrics.totalSubscriptions === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-[#E2E5EB] text-center shadow-2xs">
          <div className="bg-zinc-100 border border-zinc-200 p-4 rounded-2xl mb-4 text-zinc-950 shadow-2xs">
            <Database className="h-10 w-10 text-[#FDDD35]" />
          </div>
          <h3 className="text-lg font-bold text-zinc-950 mb-1">No subscription data found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mb-6">
            Generate curated test subscriptions with calibrated failure profiles to test autonomous recovery.
          </p>
          <Button variant="default" onClick={handleSeed} loading={seeding} className="gap-2">
            <Database className="h-4 w-4" /> Seed Curated Subscriptions Now
          </Button>
        </div>
      )}

      {/* Recovery Modal */}
      <RecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => {
          setShowRecoveryModal(false);
          setRecoveryResult(null);
        }}
        isProcessing={recovering}
        result={recoveryResult}
      />
    </div>
  );
}

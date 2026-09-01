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
  Users
} from 'lucide-react';
import { RecoveryModal } from '@/components/recovery-modal';

const ACTION_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#10B981', '#F59E0B', '#EF4444'];

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
      <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-2">
        <TrendingUp className="h-3 w-3 mr-1 text-emerald-600" /> +{pct}
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
          icon: <Activity className="h-5 w-5 text-blue-600" />,
          color: 'text-slate-900',
          bg: 'bg-blue-50 border-blue-100',
          trend: getTrendBadge(true, '8%'),
        },
        {
          title: 'Active Subscriptions',
          value: metrics.activeSubscriptions.toString(),
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
          color: 'text-slate-900',
          bg: 'bg-emerald-50 border-emerald-100',
          trend: getTrendBadge(true, '12%'),
        },
        {
          title: 'At Risk (Past Due / Failed)',
          value: metrics.atRiskSubscriptions.toString(),
          icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
          color: 'text-slate-900',
          bg: 'bg-amber-50 border-amber-100',
          subtitle: `At Risk: ${formatCurrency(metrics.totalAmountAtRisk)}`,
          trend: getTrendBadge(false, '4%'),
        },
        {
          title: 'Revenue Recovered',
          value: formatCurrency(metrics.totalAmountRecovered),
          icon: <Banknote className="h-5 w-5 text-emerald-600" />,
          color: 'text-emerald-700 font-extrabold',
          bg: 'bg-emerald-50 border-emerald-100',
          subtitle: `${metrics.recoveredSubscriptions} subscriptions recaptured`,
          trend: getTrendBadge(true, '19%'),
        },
        {
          title: 'Unresolved / Unrecoverable',
          value: metrics.unresolvedSubscriptions.toString(),
          icon: <XCircle className="h-5 w-5 text-rose-600" />,
          color: 'text-rose-600',
          bg: 'bg-rose-50 border-rose-100',
          trend: getTrendBadge(false, '2%'),
        },
        {
          title: 'Autonomous Recovery Rate',
          value: `${(metrics.recoveryRate * 100).toFixed(1)}%`,
          icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
          color: 'text-blue-600 font-extrabold',
          bg: 'bg-blue-50 border-blue-100',
          subtitle: 'Industry benchmark: 35%',
          trend: getTrendBadge(true, '15%'),
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Autonomous revenue recovery & subscription health monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSeed} loading={seeding} className="gap-2">
            <Database className="h-4 w-4 text-slate-500" />
            Seed Data
          </Button>
          <Button variant="default" onClick={handleRecover} loading={recovering} className="gap-2">
            <Play className="h-4 w-4 fill-current" />
            Run Recovery
          </Button>
        </div>
      </div>

      {/* Notification Banners */}
      {seedMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium ${
            seedMessage.includes('✓')
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {seedMessage}
        </div>
      )}
      {recoverMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium ${
            recoverMessage.includes('✓')
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {recoverMessage}
        </div>
      )}

      {/* Metrics 3x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((card) => (
          <Card key={card.title} className="hover:border-slate-300 transition-all">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.title}</p>
                  <p className={`text-2xl sm:text-3xl font-bold mt-1.5 ${card.color}`}>{card.value}</p>
                  {card.subtitle && (
                    <p className="text-xs font-medium text-slate-500 mt-1">{card.subtitle}</p>
                  )}
                  {card.trend}
                </div>
                <div className={`p-2.5 rounded-xl border ${card.bg}`}>{card.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Action Cards */}
      {metrics && metrics.totalSubscriptions > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/subscriptions?status=past_due" className="block group">
            <Card className="hover:border-blue-300 hover:shadow-2xs transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      At-Risk Subscriptions
                    </p>
                    <p className="text-xs text-slate-500">{metrics.atRiskSubscriptions} accounts require attention</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/audit?outcome=pending" className="block group">
            <Card className="hover:border-blue-300 hover:shadow-2xs transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg text-blue-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Pending Interventions
                    </p>
                    <p className="text-xs text-slate-500">View active email & SMS nudges</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics" className="block group">
            <Card className="hover:border-blue-300 hover:shadow-2xs transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-emerald-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Analytics & ROI Model
                    </p>
                    <p className="text-xs text-slate-500">Failure breakdown & ROI simulator</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Charts Row */}
      {metrics && metrics.recoveryByReason.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">Recovery Rate by Failure Type</CardTitle>
              <CardDescription>Performance comparison across reason codes</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.recoveryByReason} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="reason" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                      cursor={{ fill: '#F8FAFC' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="recovered" name="Recovered" fill="#10B981" radius={[4, 4, 0, 0]} barSize={28} />
                    <Bar dataKey="failed" name="Failed" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">AI Action Distribution</CardTitle>
              <CardDescription>Interventions executed by Google Gemini agent</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.actionDistribution} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="action" type="category" tick={{ fontSize: 11, fill: '#334155' }} width={120} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                      cursor={{ fill: '#F8FAFC' }}
                    />
                    <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]} barSize={20}>
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
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Recent Recovery Batches</CardTitle>
                <CardDescription>Historical autonomous runs</CardDescription>
              </div>
              <Link href="/recovery" className="text-xs font-semibold text-blue-600 hover:underline">
                View All Batches →
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <th className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider">Batch ID</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider">Executed</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-right px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider">At Risk</th>
                      <th className="text-right px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider">Recovered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {metrics.recentBatches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-slate-700">{batch.id.slice(0, 8)}</td>
                        <td className="px-5 py-3.5 text-slate-600">
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
                        <td className="px-5 py-3.5 text-right font-medium text-slate-700">{batch.total_at_risk}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-emerald-700">
                          {batch.total_recovered} <span className="font-normal text-slate-400">({formatCurrency(batch.total_amount_recovered)})</span>
                        </td>
                      </tr>
                    ))}
                    {metrics.recentBatches.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
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
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Recent Activity</CardTitle>
                <CardDescription>Live audit events</CardDescription>
              </div>
              <Link href="/audit" className="text-xs font-semibold text-blue-600 hover:underline">
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
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-600 border-amber-200'
                              : isFailed
                              ? 'bg-rose-50 text-rose-600 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
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
                          <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {action.action_type.replace(/_/g, ' ')}
                            <span className="font-normal text-slate-500"> for </span>
                            {action.subscriptions?.customers?.name || 'Customer'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant={isSuccess ? 'success' : isPending ? 'warning' : 'destructive'}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {action.outcome}
                            </Badge>
                            <span className="text-[11px] text-slate-400">{formatDate(action.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {recentActions.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No recent actions logged.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {metrics && metrics.totalSubscriptions === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-slate-300 text-center shadow-2xs">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-4 text-blue-600 shadow-2xs">
            <Database className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No subscription data found</h3>
          <p className="text-xs text-slate-500 max-w-sm mb-6">
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

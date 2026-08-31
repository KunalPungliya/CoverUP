'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardMetrics, RecoveryAction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend } from 'recharts';
import { Database, Play, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle, Banknote, Activity, Clock, FileText, ArrowRight } from 'lucide-react';
import { RecoveryModal } from '@/components/recovery-modal';

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#10b981', '#f59e0b', '#ef4444'];

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
        fetch('/api/dashboard').then(r => r.json()),
        fetch('/api/audit?limit=5').then(r => r.json())
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
      setSeedMessage(json.success ? `✅ ${json.message}` : `❌ ${json.error}`);
      if (json.success) {
        setLoading(true);
        await fetchMetrics();
      }
    } catch (error) {
      setSeedMessage(`❌ Error: ${error}`);
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
        setRecoverMessage(`❌ ${json.error}`);
        setShowRecoveryModal(false);
      }
    } catch (error) {
      setRecoverMessage(`❌ Error: ${error}`);
      setShowRecoveryModal(false);
    } finally {
      setRecovering(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const getTrendIcon = (isPositive: boolean) => {
    return isPositive ? 
      <div className="flex items-center text-xs text-emerald-600 mt-2 bg-emerald-50 w-fit px-1.5 py-0.5 rounded"><TrendingUp className="h-3 w-3 mr-1" /> +12%</div> : 
      <div className="flex items-center text-xs text-red-600 mt-2 bg-red-50 w-fit px-1.5 py-0.5 rounded"><TrendingDown className="h-3 w-3 mr-1" /> -4%</div>;
  };

  const metricCards = metrics
    ? [
        {
          title: 'Total Subscriptions',
          value: metrics.totalSubscriptions.toString(),
          icon: <Activity className="h-5 w-5 text-blue-600" />,
          color: 'text-blue-900',
          bg: 'bg-blue-100',
          trend: getTrendIcon(true)
        },
        {
          title: 'Active',
          value: metrics.activeSubscriptions.toString(),
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
          color: 'text-slate-900',
          bg: 'bg-emerald-100',
          trend: getTrendIcon(true)
        },
        {
          title: 'At Risk',
          value: metrics.atRiskSubscriptions.toString(),
          icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
          color: 'text-slate-900',
          bg: 'bg-amber-100',
          subtitle: formatCurrency(metrics.totalAmountAtRisk),
          trend: getTrendIcon(false)
        },
        {
          title: 'Recovered',
          value: metrics.recoveredSubscriptions.toString(),
          icon: <Banknote className="h-5 w-5 text-emerald-600" />,
          color: 'text-emerald-600',
          bg: 'bg-emerald-100',
          subtitle: formatCurrency(metrics.totalAmountRecovered),
          trend: getTrendIcon(true)
        },
        {
          title: 'Unresolved',
          value: metrics.unresolvedSubscriptions.toString(),
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          color: 'text-red-600',
          bg: 'bg-red-100',
          trend: getTrendIcon(false)
        },
        {
          title: 'Recovery Rate',
          value: `${(metrics.recoveryRate * 100).toFixed(1)}%`,
          icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          trend: getTrendIcon(true)
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">AI-powered subscription revenue recovery</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSeed} loading={seeding}>
            <Database className="h-4 w-4" />
            Seed Data
          </Button>
          <Button variant="success" onClick={handleRecover} loading={recovering}>
            <Play className="h-4 w-4" />
            Run Recovery
          </Button>
        </div>
      </div>

      {/* Status messages */}
      {seedMessage && (
        <div className={`p-4 rounded-lg border text-sm ${seedMessage.includes('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>{seedMessage}</div>
      )}
      {recoverMessage && (
        <div className={`p-4 rounded-lg border text-sm ${recoverMessage.includes('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>{recoverMessage}</div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((card) => (
          <Card key={card.title} className="shadow-sm border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                  {card.subtitle && (
                    <p className="text-sm font-medium text-slate-600 mt-1">{card.subtitle}</p>
                  )}
                  {card.trend}
                </div>
                <div className={`p-3 rounded-xl ${card.bg}`}>{card.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      {metrics && metrics.totalSubscriptions > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/subscriptions?status=past_due" className="block group">
            <Card className="hover:border-blue-300 hover:shadow-md transition-all bg-gradient-to-br from-white to-slate-50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">At-Risk Subscriptions</p>
                    <p className="text-xs text-slate-500">{metrics.atRiskSubscriptions} need attention</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/audit?outcome=pending" className="block group">
            <Card className="hover:border-blue-300 hover:shadow-md transition-all bg-gradient-to-br from-white to-slate-50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Pending Recovery</p>
                    <p className="text-xs text-slate-500">View in-progress actions</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/analytics" className="block group">
            <Card className="hover:border-blue-300 hover:shadow-md transition-all bg-gradient-to-br from-white to-slate-50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Analytics & Reports</p>
                    <p className="text-xs text-slate-500">View deeper insights</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Charts Row */}
      {metrics && metrics.recoveryByReason.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recovery by Failure Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.recoveryByReason} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="reason" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="recovered" name="Recovered" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Action Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.actionDistribution} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="action" type="category" tick={{ fontSize: 11, fill: '#475569' }} width={130} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]} barSize={24}>
                    {metrics.actionDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Two column bottom layout */}
      {metrics && metrics.totalSubscriptions > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Batches - Takes 2 cols */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Recent Recovery Batches</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Batch ID</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Started</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">At Risk</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Recovered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {metrics.recentBatches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">{batch.id.slice(0, 8)}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(batch.started_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={batch.status === 'completed' ? 'success' : 'warning'}>
                            {batch.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">{batch.total_at_risk}</td>
                        <td className="px-6 py-4 text-right font-medium text-emerald-600">
                          {batch.total_recovered} <span className="text-xs text-slate-400">({formatCurrency(batch.total_amount_recovered)})</span>
                        </td>
                      </tr>
                    ))}
                    {metrics.recentBatches.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No batches run yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Timeline - Takes 1 col */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <Link href="/audit" className="text-xs text-blue-600 hover:underline">View All</Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2">
                {recentActions.map((action, i) => {
                  const isSuccess = action.outcome === 'success';
                  const isPending = action.outcome === 'pending';
                  const isFailed = action.outcome === 'failed';
                  
                  return (
                    <Link href={`/audit`} key={action.id} className="block group">
                      <div className="flex gap-3 relative">
                        {/* Timeline line */}
                        {i !== recentActions.length - 1 && (
                          <div className="absolute left-4 top-8 bottom-[-16px] w-[2px] bg-slate-100"></div>
                        )}
                        
                        <div className={`mt-1 z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center 
                          ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 
                            isPending ? 'bg-amber-100 text-amber-600' : 
                            isFailed ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : 
                           isPending ? <Clock className="h-4 w-4" /> : 
                           <Activity className="h-4 w-4" />}
                        </div>
                        
                        <div>
                          <p className="text-sm text-slate-800 group-hover:text-blue-600 transition-colors">
                            <span className="font-semibold">{action.action_type.replace(/_/g, ' ')}</span>
                            {' for '}
                            {action.subscriptions?.customers?.name || 'Customer'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={isSuccess ? 'success' : isPending ? 'warning' : 'destructive'} className="text-[10px] px-1 py-0 h-4">
                              {action.outcome}
                            </Badge>
                            <span className="text-xs text-slate-500">{formatDate(action.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {recentActions.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No recent activity found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {metrics && metrics.totalSubscriptions === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm text-center">
          <div className="bg-blue-50 p-6 rounded-full mb-6">
            <Database className="h-16 w-16 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No subscription data yet!</h2>
          <p className="text-slate-500 max-w-md mb-6">
            Click &apos;Seed Data&apos; to generate 200 synthetic subscriptions with realistic failure profiles, then watch the AI recovery agent in action.
          </p>
          <Button variant="default" onClick={handleSeed} loading={seeding} className="gap-2 shadow-sm">
            <Database className="h-4 w-4" /> Seed 200 Subscriptions Now
          </Button>
        </div>
      )}

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

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardMetrics } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Database, Play, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Banknote, Activity } from 'lucide-react';

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');
  const [recoverMessage, setRecoverMessage] = useState('');

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (json.success) setMetrics(json.data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
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
    setRecovering(true);
    setRecoverMessage('');
    try {
      const res = await fetch('/api/recover', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        const s = json.data.summary;
        setRecoverMessage(
          `✅ Processed ${s.totalProcessed} subscriptions: ${s.recovered} recovered (${formatCurrency(s.amountRecovered)}), ${s.pending} pending, ${s.failed} failed, ${s.skipped} skipped`
        );
        setLoading(true);
        await fetchMetrics();
      } else {
        setRecoverMessage(`❌ ${json.error}`);
      }
    } catch (error) {
      setRecoverMessage(`❌ Error: ${error}`);
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

  const metricCards = metrics
    ? [
        {
          title: 'Total Subscriptions',
          value: metrics.totalSubscriptions.toString(),
          icon: <Activity className="h-5 w-5 text-blue-600" />,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
        },
        {
          title: 'Active',
          value: metrics.activeSubscriptions.toString(),
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
        },
        {
          title: 'At Risk',
          value: metrics.atRiskSubscriptions.toString(),
          icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          subtitle: formatCurrency(metrics.totalAmountAtRisk),
        },
        {
          title: 'Recovered',
          value: metrics.recoveredSubscriptions.toString(),
          icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          subtitle: formatCurrency(metrics.totalAmountRecovered),
        },
        {
          title: 'Unresolved',
          value: metrics.unresolvedSubscriptions.toString(),
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          color: 'text-red-600',
          bg: 'bg-red-50',
        },
        {
          title: 'Recovery Rate',
          value: `${(metrics.recoveryRate * 100).toFixed(1)}%`,
          icon: <Banknote className="h-5 w-5 text-blue-600" />,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
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
          <Card key={card.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                  {card.subtitle && (
                    <p className="text-sm text-slate-500 mt-1">{card.subtitle}</p>
                  )}
                </div>
                <div className={`p-3 rounded-xl ${card.bg}`}>{card.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      {metrics && metrics.recoveryByReason.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recovery by Failure Reason */}
          <Card>
            <CardHeader>
              <CardTitle>Recovery by Failure Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.recoveryByReason}>
                  <XAxis dataKey="reason" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="recovered" name="Recovered" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Action Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Action Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.actionDistribution} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="action" type="category" tick={{ fontSize: 11 }} width={130} />
                  <Tooltip />
                  <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
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

      {/* Recent Batches */}
      {metrics && metrics.recentBatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Recovery Batches</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Batch ID</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Started</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">At Risk</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Recovered</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Amount Recovered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {metrics.recentBatches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{batch.id.slice(0, 8)}...</td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(batch.started_at).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={batch.status === 'completed' ? 'success' : 'warning'}>
                          {batch.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{batch.total_at_risk}</td>
                      <td className="px-6 py-4 text-right font-medium text-emerald-600">{batch.total_recovered}</td>
                      <td className="px-6 py-4 text-right font-medium text-emerald-600">
                        {formatCurrency(batch.total_amount_recovered)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {metrics && metrics.totalSubscriptions === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm text-center">
          <div className="bg-blue-50 p-6 rounded-full mb-6">
            <Database className="h-16 w-16 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No data yet!</h2>
          <p className="text-slate-500 max-w-md mb-8">
            Click 'Seed Data' above to generate test subscriptions, then 'Run Recovery' to see the AI agent in action.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600 animate-pulse">
            <span>↑ Arrow pointing to the Seed Data button</span>
          </div>
        </div>
      )}
    </div>
  );
}

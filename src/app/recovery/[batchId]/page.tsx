'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RecoveryBatch, RecoveryAction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Brain, CheckCircle2, XCircle, Clock, AlertTriangle, SkipForward } from 'lucide-react';

const OUTCOME_CONFIG: Record<string, { icon: React.ReactNode; variant: 'success' | 'warning' | 'destructive' | 'default' | 'info' }> = {
  success: { icon: <CheckCircle2 className="h-4 w-4" />, variant: 'success' },
  pending: { icon: <Clock className="h-4 w-4" />, variant: 'warning' },
  failed: { icon: <XCircle className="h-4 w-4" />, variant: 'destructive' },
  skipped: { icon: <SkipForward className="h-4 w-4" />, variant: 'default' },
};

const ACTION_LABELS: Record<string, string> = {
  retry_payment: '🔄 Retry Payment',
  send_email_reminder: '📧 Email Reminder',
  send_sms_nudge: '📱 SMS Nudge',
  request_payment_update: '💳 Update Payment',
  escalate: '⚠️ Escalate',
  mark_unrecoverable: '❌ Unrecoverable',
};

export default function BatchDetailPage() {
  const params = useParams();
  const batchId = params.batchId as string;
  const [batch, setBatch] = useState<RecoveryBatch | null>(null);
  const [actions, setActions] = useState<RecoveryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/batches/${batchId}`);
        const json = await res.json();
        if (json.success) {
          setBatch(json.data.batch);
          setActions(json.data.actions);
        }
      } catch (error) {
        console.error('Failed to fetch batch:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [batchId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-32" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  if (!batch) {
    return <p className="text-slate-500">Batch not found.</p>;
  }

  const recoveryRate = batch.total_at_risk > 0
    ? ((batch.total_recovered / batch.total_at_risk) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/recovery">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Batch Detail</h1>
          <p className="text-slate-500 font-mono text-sm">{batch.id}</p>
        </div>
      </div>

      {/* Batch Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-slate-500">At Risk</p>
            <p className="text-2xl font-bold text-amber-600">{batch.total_at_risk}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-slate-500">Recovered</p>
            <p className="text-2xl font-bold text-emerald-600">{batch.total_recovered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-slate-500">Unresolved</p>
            <p className="text-2xl font-bold text-red-600">{batch.total_unresolved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-slate-500">Amount Recovered</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(batch.total_amount_recovered)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-slate-500">Recovery Rate</p>
            <p className="text-2xl font-bold text-blue-600">{recoveryRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Pipeline Summary */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4">Pipeline Summary</h3>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-sm text-slate-500">Recovery Progress</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600">{formatCurrency(batch.total_amount_recovered)}</span>
                <span className="text-sm text-slate-500">/ {formatCurrency(batch.total_amount_at_risk || 0)}</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-bold ${Number(recoveryRate) > 50 ? 'text-emerald-600' : Number(recoveryRate) > 25 ? 'text-amber-600' : 'text-red-600'}`}>
                {recoveryRate}%
              </span>
            </div>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden w-full">
            <div 
              className={`h-full ${Number(recoveryRate) > 50 ? 'bg-emerald-500' : Number(recoveryRate) > 25 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, Number(recoveryRate)))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {Object.entries(ACTION_LABELS).map(([key, label]) => {
          const typeActions = actions.filter(a => a.action_type === key);
          if (typeActions.length === 0) return null;
          const success = typeActions.filter(a => a.outcome === 'success').length;
          const pending = typeActions.filter(a => a.outcome === 'pending').length;
          const failed = typeActions.filter(a => a.outcome === 'failed').length;
          return (
            <Card key={key}>
              <CardContent className="p-3">
                <p className="text-sm font-bold truncate">{label}</p>
                <p className="text-xs text-slate-500 mt-1">Total: {typeActions.length}</p>
                <div className="flex gap-2 mt-2 text-[10px]">
                  {success > 0 && <span className="text-emerald-600 font-medium">{success} success</span>}
                  {pending > 0 && <span className="text-amber-600 font-medium">{pending} pending</span>}
                  {failed > 0 && <span className="text-red-600 font-medium">{failed} failed</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions Timeline */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Recovery Actions ({filter === 'all' ? actions.length : actions.filter(a => a.outcome === filter).length})</CardTitle>
            <CardDescription>Detailed AI reasoning and actions for each subscription</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
            <Button size="sm" variant={filter === 'success' ? 'default' : 'outline'} onClick={() => setFilter('success')}>Success</Button>
            <Button size="sm" variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>Pending</Button>
            <Button size="sm" variant={filter === 'failed' ? 'default' : 'outline'} onClick={() => setFilter('failed')}>Failed</Button>
            <Button size="sm" variant={filter === 'skipped' ? 'default' : 'outline'} onClick={() => setFilter('skipped')}>Skipped</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {(filter === 'all' ? actions : actions.filter(a => a.outcome === filter)).map((action) => {
              const config = OUTCOME_CONFIG[action.outcome] || OUTCOME_CONFIG.pending;
              const sub = action.subscriptions;
              const customer = sub?.customers;

              return (
                <div key={action.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Customer & Sub Info */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {config.icon}
                          <Badge variant={config.variant}>{action.outcome}</Badge>
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {customer?.name || 'Unknown Customer'}
                        </span>
                        <span className="text-xs text-slate-500">{customer?.email}</span>
                        {sub && (
                          <Badge variant="outline">
                            {sub.plan_name} · {formatCurrency(sub.amount)}
                          </Badge>
                        )}
                      </div>

                      {/* Action Type */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {ACTION_LABELS[action.action_type] || action.action_type}
                        </span>
                        {action.amount_recovered > 0 && (
                          <Badge variant="success">
                            +{formatCurrency(action.amount_recovered)} recovered
                          </Badge>
                        )}
                      </div>

                      {/* AI Reasoning */}
                      {action.ai_reasoning && (
                        <div className="flex items-start gap-3 bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                          <Brain className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="w-full">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-bold text-blue-900">AI Reasoning</p>
                              <div className="flex items-center gap-2 w-32">
                                <span className="text-xs font-medium text-slate-500">Confidence</span>
                                <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${action.ai_confidence > 0.75 ? 'bg-emerald-500' : action.ai_confidence > 0.5 ? 'bg-blue-500' : action.ai_confidence > 0.25 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${action.ai_confidence * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold">{Math.round(action.ai_confidence * 100)}%</span>
                              </div>
                            </div>
                            <p className="text-sm text-blue-800">{action.ai_reasoning}</p>
                            
                            {action.action_detail && typeof action.action_detail === 'object' && (action.action_detail as any).body && (
                              <div className="mt-3 p-3 bg-white border border-slate-200 rounded text-xs text-slate-700 font-mono whitespace-pre-wrap">
                                {(action.action_detail as any).body}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-slate-400 whitespace-nowrap">{formatDate(action.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

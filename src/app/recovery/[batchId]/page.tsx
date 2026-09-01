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
import { ArrowLeft, Brain, CheckCircle2, XCircle, Clock, AlertTriangle, SkipForward, ArrowRight } from 'lucide-react';

const OUTCOME_CONFIG: Record<string, { icon: React.ReactNode; variant: 'success' | 'warning' | 'destructive' | 'default' | 'info' }> = {
  success: { icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />, variant: 'success' },
  pending: { icon: <Clock className="h-4 w-4 text-amber-600" />, variant: 'warning' },
  failed: { icon: <XCircle className="h-4 w-4 text-rose-600" />, variant: 'destructive' },
  skipped: { icon: <SkipForward className="h-4 w-4 text-gray-500" />, variant: 'default' },
};

const ACTION_LABELS: Record<string, string> = {
  retry_payment: '🔄 Scheduled Retry',
  send_email_reminder: '📧 Email Reminder',
  send_sms_nudge: '📱 SMS Nudge',
  request_payment_update: '💳 Payment Update Link',
  escalate: '⚠️ Human Review Escalation',
  mark_unrecoverable: '✕ Closed / Unrecoverable',
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
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-28 w-full" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
      </div>
    );
  }

  if (!batch) {
    return <p className="text-gray-500 text-sm">Batch not found.</p>;
  }

  const recoveryRate = batch.total_at_risk > 0
    ? ((batch.total_recovered / batch.total_at_risk) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/recovery">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Details</h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{batch.id}</p>
        </div>
      </div>

      {/* Batch Summary 5 Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-medium">At Risk</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{batch.total_at_risk}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-emerald-700 font-medium">Recovered</p>
            <p className="text-2xl font-bold text-emerald-700 mt-0.5">{batch.total_recovered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-medium">Unresolved</p>
            <p className="text-2xl font-bold text-rose-600 mt-0.5">{batch.total_unresolved}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-emerald-700 font-medium">Amount Recaptured</p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{formatCurrency(batch.total_amount_recovered)}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1 border-indigo-200 bg-indigo-50/20">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-indigo-700 font-medium">Success Rate</p>
            <p className="text-2xl font-bold text-indigo-600 mt-0.5">{recoveryRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Batch Recovery Conversion</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold text-emerald-700">{formatCurrency(batch.total_amount_recovered)}</span>
                <span className="text-xs text-gray-400">/ {formatCurrency(batch.total_amount_at_risk || 0)} total at risk</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-indigo-600">{recoveryRate}%</span>
            </div>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden w-full">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, Number(recoveryRate)))}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions Timeline with Filter Buttons */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <CardTitle className="text-base font-bold text-gray-900">
              Recovery Actions ({filter === 'all' ? actions.length : actions.filter(a => a.outcome === filter).length})
            </CardTitle>
            <CardDescription>AI reasoning and execution results</CardDescription>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['all', 'success', 'pending', 'failed', 'skipped'].map((opt) => (
              <Button
                key={opt}
                size="sm"
                variant={filter === opt ? 'default' : 'outline'}
                onClick={() => setFilter(opt)}
                className="capitalize text-xs h-7 px-2.5"
              >
                {opt}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {(filter === 'all' ? actions : actions.filter(a => a.outcome === filter)).map((action) => {
              const config = OUTCOME_CONFIG[action.outcome] || OUTCOME_CONFIG.pending;
              const sub = action.subscriptions;
              const customer = sub?.customers;

              return (
                <div key={action.id} className="p-5 hover:bg-gray-50/70 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">
                          {customer?.name || 'Customer'}
                        </span>
                        <Badge variant="outline" className="text-[10px]">{sub?.plan_name}</Badge>
                        <span className="font-bold text-xs text-gray-900">
                          {sub ? formatCurrency(sub.amount) : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Action: <strong className="text-gray-700">{ACTION_LABELS[action.action_type] || action.action_type}</strong></span>
                        <span>•</span>
                        <span>Confidence: <strong className="text-indigo-600">{Math.round((action.ai_confidence || 0) * 100)}%</strong></span>
                      </div>

                      {action.ai_reasoning && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200/80 text-xs text-gray-700 mt-2 flex items-start gap-2">
                          <Brain className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">{action.ai_reasoning}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <Badge variant={config.variant} className="capitalize text-xs">
                        {action.outcome}
                      </Badge>
                      {action.amount_recovered > 0 && (
                        <span className="text-xs font-bold text-emerald-700">
                          +{formatCurrency(action.amount_recovered)}
                        </span>
                      )}
                      {customer && (
                        <Link href={`/customers/${sub?.customer_id}`}>
                          <span className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
                            Customer Profile <ArrowRight className="h-3 w-3" />
                          </span>
                        </Link>
                      )}
                    </div>
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

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
    return <p className="text-gray-500">Batch not found.</p>;
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
          <h1 className="text-3xl font-bold text-gray-900">Batch Detail</h1>
          <p className="text-gray-500 font-mono text-sm">{batch.id}</p>
        </div>
      </div>

      {/* Batch Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-500">At Risk</p>
            <p className="text-2xl font-bold text-amber-600">{batch.total_at_risk}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-500">Recovered</p>
            <p className="text-2xl font-bold text-emerald-600">{batch.total_recovered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-500">Unresolved</p>
            <p className="text-2xl font-bold text-red-600">{batch.total_unresolved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-500">Amount Recovered</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(batch.total_amount_recovered)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-500">Recovery Rate</p>
            <p className="text-2xl font-bold text-violet-600">{recoveryRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recovery Actions ({actions.length})</CardTitle>
          <CardDescription>Detailed AI reasoning and actions for each subscription</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {actions.map((action) => {
              const config = OUTCOME_CONFIG[action.outcome] || OUTCOME_CONFIG.pending;
              const sub = action.subscriptions;
              const customer = sub?.customers;

              return (
                <div key={action.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Customer & Sub Info */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {config.icon}
                          <Badge variant={config.variant}>{action.outcome}</Badge>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {customer?.name || 'Unknown Customer'}
                        </span>
                        <span className="text-xs text-gray-500">{customer?.email}</span>
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
                        <div className="flex items-start gap-2 bg-violet-50 rounded-lg p-3 border border-violet-100">
                          <Brain className="h-4 w-4 text-violet-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-violet-700">AI Reasoning (Confidence: {(action.ai_confidence * 100).toFixed(0)}%)</p>
                            <p className="text-sm text-violet-900 mt-1">{action.ai_reasoning}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(action.created_at)}</p>
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

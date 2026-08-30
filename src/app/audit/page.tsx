'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { RecoveryAction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Brain, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OUTCOME_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
  success: 'success',
  pending: 'warning',
  failed: 'destructive',
  skipped: 'default',
};

export default function AuditPage() {
  const [actions, setActions] = useState<RecoveryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          action_type: actionFilter,
          outcome: outcomeFilter,
          page: page.toString(),
          limit: '30',
        });
        const res = await fetch(`/api/audit?${params}`);
        const json = await res.json();
        if (json.success) {
          setActions(json.data.actions);
          setTotal(json.data.total);
          setTotalPages(json.data.totalPages);
        }
      } catch (error) {
        console.error('Failed to fetch audit:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [actionFilter, outcomeFilter, page]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportCsv = () => {
    if (actions.length === 0) return;
    const headers = ['Action ID', 'Timestamp', 'Customer Name', 'Customer Email', 'Plan', 'Amount (INR)', 'Action Type', 'Outcome', 'Amount Recovered (INR)', 'Retry Count', 'Confidence', 'AI Reasoning'];
    const rows = actions.map(a => [
      a.id,
      new Date(a.created_at).toISOString(),
      `"${a.subscriptions?.customers?.name || ''}"`,
      `"${a.subscriptions?.customers?.email || ''}"`,
      `"${a.subscriptions?.plan_name || ''}"`,
      ((a.subscriptions?.amount || 0) / 100).toFixed(2),
      a.action_type,
      a.outcome,
      ((a.amount_recovered || 0) / 100).toFixed(2),
      a.retry_count,
      (a.ai_confidence * 100).toFixed(0) + '%',
      `"${(a.ai_reasoning || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `coverup_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-500 mt-1">{total} total actions logged</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={actions.length === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Actions</option>
            <option value="retry_payment">Retry Payment</option>
            <option value="send_email_reminder">Email Reminder</option>
            <option value="send_sms_nudge">SMS Nudge</option>
            <option value="request_payment_update">Payment Update</option>
            <option value="escalate">Escalate</option>
            <option value="mark_unrecoverable">Unrecoverable</option>
          </Select>
          <Select
            value={outcomeFilter}
            onChange={(e) => { setOutcomeFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Outcomes</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : actions.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No audit entries found. Run a recovery batch first.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {actions.map((action) => {
                const sub = action.subscriptions;
                const customer = sub?.customers;
                const isExpanded = expanded.has(action.id);

                return (
                  <div
                    key={action.id}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => toggleExpand(action.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={OUTCOME_VARIANTS[action.outcome] || 'default'}>
                          {action.outcome}
                        </Badge>
                        <span className="text-sm font-medium">
                          {action.action_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {customer?.name || 'Unknown'}
                        </span>
                        {sub && (
                          <span className="text-xs text-gray-400">{sub.plan_name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {action.amount_recovered > 0 && (
                          <Badge variant="success">+{formatCurrency(action.amount_recovered)}</Badge>
                        )}
                        <span className="text-xs text-gray-400">{formatDate(action.created_at)}</span>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="mt-4 space-y-3">
                        {action.ai_reasoning && (
                          <div className="flex items-start gap-2 bg-violet-50 rounded-lg p-3">
                            <Brain className="h-4 w-4 text-violet-600 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-violet-700">
                                AI Reasoning · Confidence: {(action.ai_confidence * 100).toFixed(0)}%
                              </p>
                              <p className="text-sm text-violet-900 mt-1">{action.ai_reasoning}</p>
                            </div>
                          </div>
                        )}
                        {action.action_detail && Object.keys(action.action_detail).length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">Action Detail</p>
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                              {JSON.stringify(action.action_detail, null, 2)}
                            </pre>
                          </div>
                        )}
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>Retry #{action.retry_count}</span>
                          <span>Batch: {action.batch_id?.slice(0, 8) || 'N/A'}</span>
                          <span>Sub: {action.subscription_id.slice(0, 8)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages} ({total} total)</p>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40"
                onClick={(e) => { e.stopPropagation(); setPage(p => p - 1); }}
                disabled={page <= 1}
              >
                Previous
              </button>
              <button
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40"
                onClick={(e) => { e.stopPropagation(); setPage(p => p + 1); }}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

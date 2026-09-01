'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { RecoveryAction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Brain, Download, Search, Mail, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OUTCOME_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
  success: 'success',
  pending: 'warning',
  failed: 'destructive',
  skipped: 'default',
};

const BORDER_VARIANTS: Record<string, string> = {
  success: 'border-l-4 border-l-emerald-500',
  pending: 'border-l-4 border-l-amber-500',
  failed: 'border-l-4 border-l-rose-500',
  skipped: 'border-l-4 border-l-gray-300',
};

export default function AuditPage() {
  const [actions, setActions] = useState<RecoveryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
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
          limit: '100',
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

  const filteredActions = useMemo(() => {
    if (!searchQuery) return actions;
    const lowerQuery = searchQuery.toLowerCase();
    return actions.filter(a => {
      const name = a.subscriptions?.customers?.name?.toLowerCase() || '';
      const email = a.subscriptions?.customers?.email?.toLowerCase() || '';
      const reasoning = a.ai_reasoning?.toLowerCase() || '';
      return name.includes(lowerQuery) || email.includes(lowerQuery) || reasoning.includes(lowerQuery);
    });
  }, [actions, searchQuery]);

  const stats = useMemo(() => {
    if (actions.length === 0) return { total: 0, successRate: 0, avgConfidence: 0, totalRecovered: 0 };
    const successCount = actions.filter(a => a.outcome === 'success').length;
    const successRate = Math.round((successCount / actions.length) * 100);
    const avgConfidence = Math.round(actions.reduce((acc, a) => acc + (a.ai_confidence || 0), 0) / actions.length * 100);
    const totalRecovered = actions.reduce((acc, a) => acc + (a.amount_recovered || 0), 0);
    return { total: actions.length, successRate, avgConfidence, totalRecovered };
  }, [actions]);

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

  const renderActionDetail = (action: RecoveryAction) => {
    const detail = action.action_detail as any;
    if (!detail) return null;

    if (action.action_type === 'send_email_reminder' && detail.body) {
      return (
        <div className="mt-3 border border-gray-200 rounded-lg bg-white overflow-hidden shadow-2xs">
          <div className="bg-gray-50 border-b border-gray-100 px-3.5 py-2 flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-[11px] font-semibold text-gray-700">Email Dispatched</span>
          </div>
          <div className="p-3.5 text-xs text-gray-800 whitespace-pre-wrap font-sans">
            <div className="mb-2 text-[11px] text-gray-500"><strong>Subject:</strong> {detail.subject || 'Action Required: Update Payment Method'}</div>
            <div className="pt-2 border-t border-gray-100">{detail.body}</div>
          </div>
        </div>
      );
    }
    
    if (action.action_type === 'send_sms_nudge' && detail.body) {
      return (
        <div className="mt-3 border border-gray-200 rounded-lg bg-white overflow-hidden shadow-2xs max-w-sm">
          <div className="bg-indigo-50 border-b border-indigo-100 px-3.5 py-2 flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
            <span className="text-[11px] font-semibold text-indigo-900">SMS Nudge Dispatched</span>
          </div>
          <div className="p-3.5 text-xs text-gray-800 whitespace-pre-wrap bg-gray-50">
            {detail.body}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 rounded-lg p-3 mt-3 border border-gray-200/80">
        <p className="text-[11px] font-semibold text-gray-500 mb-1.5 uppercase">Action Detail Metadata</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(detail).map(([k, v]) => (
            <div key={k} className="text-xs">
              <span className="font-semibold text-gray-600">{k}: </span>
              <span className="text-gray-900 font-mono text-[11px]">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'bg-emerald-500';
    if (conf >= 0.5) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Audit Trail</h1>
          <p className="text-xs text-gray-500 mt-0.5">{total} autonomous AI interventions logged</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          <div className="w-full sm:w-56">
            <Input 
              icon={<Search className="h-4 w-4" />}
              placeholder="Search actions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="w-full sm:w-36"
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
            className="w-full sm:w-32"
          >
            <option value="all">All Outcomes</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </Select>
          <Button variant="outline" size="icon" onClick={exportCsv} disabled={actions.length === 0} title="Export CSV" className="h-9 w-9 shrink-0">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3.5">
            <p className="text-xs font-medium text-gray-500">Listed Actions</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5">
            <p className="text-xs font-medium text-emerald-700">Success Rate</p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{stats.successRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5">
            <p className="text-xs font-medium text-indigo-700">Avg AI Confidence</p>
            <p className="text-xl font-bold text-indigo-600 mt-0.5">{stats.avgConfidence}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3.5">
            <p className="text-xs font-medium text-emerald-700">Recovered Amount</p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{formatCurrency(stats.totalRecovered)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Action Log Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">
              No audit entries found matching filters.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredActions.map((action) => {
                const sub = action.subscriptions;
                const customer = sub?.customers;
                const isExpanded = expanded.has(action.id);
                const borderClass = BORDER_VARIANTS[action.outcome] || 'border-l-4 border-l-gray-300';
                const failureReason = (action.action_detail as any)?.failure_reason;

                return (
                  <div
                    key={action.id}
                    className={`px-5 py-3.5 hover:bg-gray-50/70 cursor-pointer transition-colors ${borderClass}`}
                    onClick={() => toggleExpand(action.id)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Badge variant={OUTCOME_VARIANTS[action.outcome] || 'default'} className="text-[10px]">
                          {action.outcome}
                        </Badge>
                        <span className="text-xs font-bold text-gray-900 capitalize">
                          {action.action_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-gray-600">
                          {customer?.name || 'Customer'}
                        </span>
                        {sub && (
                          <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-md text-gray-600 font-mono">
                            {sub.plan_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {action.amount_recovered > 0 && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            +{formatCurrency(action.amount_recovered)}
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">{formatDate(action.created_at)}</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="mt-3 pl-0 md:pl-3 space-y-3">
                        {failureReason && (
                          <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 inline-block font-medium">
                            <span>Trigger:</span> {failureReason.replace(/_/g, ' ')}
                          </div>
                        )}
                        
                        {action.ai_reasoning && (
                          <div className="flex items-start gap-2.5 bg-indigo-50/40 rounded-xl p-3.5 border border-indigo-100">
                            <Brain className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold text-indigo-950">AI Strategic Decision</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-medium text-gray-500">Confidence: {(action.ai_confidence * 100).toFixed(0)}%</span>
                                  <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${getConfidenceColor(action.ai_confidence)}`} 
                                      style={{ width: `${action.ai_confidence * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-700 leading-relaxed">{action.ai_reasoning}</p>
                            </div>
                          </div>
                        )}
                        
                        {action.action_detail && Object.keys(action.action_detail).length > 0 && renderActionDetail(action)}
                        
                        <div className="flex gap-4 text-[10px] text-gray-400 pt-2 border-t border-gray-100 font-mono">
                          <span>Retry Count: #{action.retry_count}</span>
                          <span>Batch: {action.batch_id?.slice(0, 8) || 'Standalone Webhook'}</span>
                          <span>Subscription ID: {action.subscription_id.slice(0, 8)}</span>
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
        {totalPages > 1 && !searchQuery && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <p className="text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => { e.stopPropagation(); setPage(p => p - 1); }}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => { e.stopPropagation(); setPage(p => p + 1); }}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

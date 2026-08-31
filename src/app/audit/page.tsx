'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { RecoveryAction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Brain, Download, Search, Mail, MessageSquare } from 'lucide-react';
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
  failed: 'border-l-4 border-l-red-500',
  skipped: 'border-l-4 border-l-slate-300',
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
          limit: '100', // Increased for client-side search in hackathon
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

  // Compute stats
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
        <div className="mt-3 border rounded-lg bg-white overflow-hidden shadow-sm">
          <div className="bg-slate-50 border-b px-4 py-2 flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-medium text-slate-700">Email Preview</span>
          </div>
          <div className="p-4 text-sm text-slate-800 whitespace-pre-wrap font-sans">
            <div className="mb-2 text-xs text-slate-500"><strong>Subject:</strong> {detail.subject || 'Action Required: Update Payment Method'}</div>
            <div className="pt-2 border-t">{detail.body}</div>
          </div>
        </div>
      );
    }
    
    if (action.action_type === 'send_sms_nudge' && detail.body) {
      return (
        <div className="mt-3 border rounded-lg bg-white overflow-hidden shadow-sm max-w-sm">
          <div className="bg-blue-50 border-b px-4 py-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-800">SMS Preview</span>
          </div>
          <div className="p-4 text-sm text-slate-800 whitespace-pre-wrap bg-slate-100 rounded-b-lg">
            {detail.body}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-slate-50 rounded-lg p-3 mt-3">
        <p className="text-xs font-medium text-slate-500 mb-2">Action Detail</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(detail).map(([k, v]) => (
            <div key={k} className="text-xs">
              <span className="font-medium text-slate-600">{k}: </span>
              <span className="text-slate-800">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'bg-emerald-500';
    if (conf >= 0.5) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-slate-500 mt-1">{total} total actions logged</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name, email, reasoning..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
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
          <Button variant="outline" size="icon" onClick={exportCsv} disabled={actions.length === 0} title="Export CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-500">Listed Actions</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-500">Success Rate</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.successRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-500">Avg Confidence</p>
            <p className="text-2xl font-bold text-blue-600">{stats.avgConfidence}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-500">Recovered Here</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalRecovered)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : filteredActions.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No audit entries found. Try adjusting filters or search.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredActions.map((action) => {
                const sub = action.subscriptions;
                const customer = sub?.customers;
                const isExpanded = expanded.has(action.id);
                const borderClass = BORDER_VARIANTS[action.outcome] || 'border-l-4 border-l-slate-300';
                const failureReason = (action.action_detail as any)?.failure_reason;

                return (
                  <div
                    key={action.id}
                    className={`px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors ${borderClass}`}
                    onClick={() => toggleExpand(action.id)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant={OUTCOME_VARIANTS[action.outcome] || 'default'}>
                          {action.outcome}
                        </Badge>
                        <span className="text-sm font-semibold text-slate-800">
                          {action.action_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className="text-sm text-slate-500 font-medium">
                          {customer?.name || 'Unknown'}
                        </span>
                        {sub && (
                          <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600">{sub.plan_name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        {action.amount_recovered > 0 && (
                          <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            +{formatCurrency(action.amount_recovered)}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(action.created_at)}</span>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="mt-4 pl-0 md:pl-4 space-y-4">
                        {failureReason && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded inline-block">
                            <span className="font-semibold">Triggered by Failure:</span> {failureReason.replace(/_/g, ' ')}
                          </div>
                        )}
                        
                        {action.ai_reasoning && (
                          <div className="flex items-start gap-3 bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Brain className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold text-blue-800">AI Reasoning</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-medium text-slate-500">Confidence: {(action.ai_confidence * 100).toFixed(0)}%</span>
                                  <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${getConfidenceColor(action.ai_confidence)}`} 
                                      style={{ width: `${action.ai_confidence * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed">{action.ai_reasoning}</p>
                            </div>
                          </div>
                        )}
                        
                        {action.action_detail && Object.keys(action.action_detail).length > 0 && renderActionDetail(action)}
                        
                        <div className="flex gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
                          <span>Retry #{action.retry_count}</span>
                          <span>Batch: <span className="font-mono">{action.batch_id?.slice(0, 8) || 'N/A'}</span></span>
                          <span>Sub: <span className="font-mono">{action.subscription_id.slice(0, 8)}</span></span>
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
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">Page {page} of {totalPages} ({total} total)</p>
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

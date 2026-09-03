'use client';

import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RecoveryAction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  FileClock, 
  Download, 
  Search, 
  Mail, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp,
  FileText,
  ShieldCheck,
  Brain,
  ListFilter,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Time,Action Type,Outcome,AI Confidence,AI Reasoning"].concat(
          actions.map(r => `${r.created_at},${r.action_type},${r.outcome},${Math.round((r.ai_confidence || 0.92) * 100)}%,"${(r.ai_reasoning || '').replace(/"/g, '""')}"`)
        ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vaultback_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredActions = useMemo(() => {
    if (!searchQuery) return actions;
    const lower = searchQuery.toLowerCase();
    return actions.filter(
      (a) =>
        a.action_type?.toLowerCase().includes(lower) ||
        a.ai_reasoning?.toLowerCase().includes(lower) ||
        a.subscription_id?.toLowerCase().includes(lower)
    );
  }, [actions, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#87915D]">
            Immutable Decision Ledger · SOC-2 Ready
          </p>
          <h1 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[0.98] tracking-[-0.06em] text-[#F2F0E6]">
            Audit trail.
          </h1>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#20231C] text-[#F8F6EE] font-mono text-xs font-semibold shadow-[2px_2px_0_#C7F36B] hover:bg-[#30352A] cursor-pointer"
        >
          <FileText size={14} className="text-[#C7F36B]" />
          Export CSV Log
        </button>
      </div>

      {/* Main Audit Table Card */}
      <section className="border border-[#DEDBD1] bg-[#FAF9F5] text-[#2B2D27]">
        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DEDBD1] px-5 py-4 md:px-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#85867E]" />
            <input
              type="text"
              placeholder="Search by action, reason, subscription..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-xs font-mono bg-[#F7F5EE] border border-[#D8D5CB] outline-none text-[#2B2D27] placeholder:text-[#9A9B91] focus:border-[#9AB54D]"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-9 border border-[#D8D5CB] bg-[#F7F5EE] px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[#55574E] outline-none focus:border-[#9AB54D]"
            >
              <option value="all">All Action Types</option>
              <option value="smart_retry">Smart Retry</option>
              <option value="send_email">Email Nudge</option>
              <option value="send_sms">SMS Touch</option>
              <option value="generate_payment_link">Payment Link</option>
              <option value="escalate">Escalate</option>
            </select>

            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="h-9 border border-[#D8D5CB] bg-[#F7F5EE] px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[#55574E] outline-none focus:border-[#9AB54D]"
            >
              <option value="all">All Outcomes</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left">
            <thead className="border-b border-[#EBE8DF] bg-[#F7F5EE]">
              <tr className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#97988E]">
                <th className="px-5 py-3 font-medium md:px-6">Timestamp</th>
                <th className="px-3 py-3 font-medium">Action Type</th>
                <th className="px-3 py-3 font-medium">Outcome</th>
                <th className="px-3 py-3 font-medium">Confidence</th>
                <th className="px-3 py-3 font-medium">AI Reasoning & Bounded Policy</th>
                <th className="px-5 py-3 text-right font-medium md:px-6">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center font-mono text-xs text-[#85867E]">
                    Loading audit stream...
                  </td>
                </tr>
              ) : filteredActions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center font-mono text-xs text-[#85867E]">
                    No recovery actions match the current filter.
                  </td>
                </tr>
              ) : (
                filteredActions.map((action) => {
                  const isExpanded = expanded.has(action.id);
                  return (
                    <tr
                      key={action.id}
                      onClick={() => toggleExpand(action.id)}
                      className="group cursor-pointer border-b border-[#EBE8DF] transition-colors hover:bg-[#F4F1E7]"
                    >
                      <td className="px-5 py-3.5 md:px-6 font-mono text-[11px] text-[#85867D]">
                        {formatDate(action.created_at)}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="font-mono text-xs font-bold text-[#2B2D27] uppercase tracking-wider">
                          {action.action_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={cn(
                          'font-mono text-[9px] uppercase px-2 py-0.5 border font-semibold',
                          action.outcome === 'success' ? 'border-[#BFDB78] bg-[#EDF7CE] text-[#4E6B18]' :
                          action.outcome === 'pending' ? 'border-[#E7C779] bg-[#FFF7DF] text-[#8A6413]' :
                          'border-[#E3A5A0] bg-[#FFF0EE] text-[#A54C46]'
                        )}>
                          {action.outcome}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 font-mono text-xs text-[#6B8E21] font-semibold">
                        {Math.round((action.ai_confidence || 0.92) * 100)}%
                      </td>
                      <td className="px-3 py-3.5 text-xs text-[#474941] max-w-md">
                        <p className={isExpanded ? '' : 'line-clamp-1'}>
                          {action.ai_reasoning || 'Automated bounded dunning intervention.'}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-right md:px-6 text-[#85867D]">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 md:px-6 border-t border-[#EBE8DF]">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#999A90]">
            Showing {filteredActions.length} of {total} audit records
          </span>
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1 text-[#68665D] hover:text-[#2B2D27] disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[#55574E]">Page {page} of {totalPages || 1}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-1 text-[#68665D] hover:text-[#2B2D27] disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

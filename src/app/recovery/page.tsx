'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RecoveryBatch } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Play, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Zap, 
  CircleDollarSign, 
  BadgeCheck, 
  ArrowUpRight,
  RefreshCw,
  GitBranch,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BatchConfirmationModal } from '@/components/batch-confirmation-modal';
import { cn } from '@/lib/utils';

export default function RecoveryPage() {
  const [batches, setBatches] = useState<RecoveryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; title: string; desc: string } | null>(null);

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/batches');
      const json = await res.json();
      if (json.success) setBatches(json.data);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleExecuteBatch = async () => {
    setIsBatchModalOpen(false);
    setRecovering(true);
    setNotification({
      type: 'info',
      title: 'Executing autonomous recovery batch...',
      desc: 'Evaluating risk taxonomy & AI policy envelope with Gemini 2.0 Flash',
    });

    try {
      const res = await fetch('/api/recover', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        const s = json.data.summary;
        setNotification({
          type: 'success',
          title: `Batch Complete · ${formatCurrency(s.amountRecovered)} Recovered`,
          desc: `${s.recovered} recovered out of ${s.totalProcessed} processed. Audit record created.`,
        });
        fetchBatches();
      } else {
        setNotification({
          type: 'error',
          title: 'Batch execution failed',
          desc: json.error || 'Unknown error occurred during recovery batch.',
        });
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        title: 'Execution error',
        desc: error.message || 'Network request failed',
      });
    } finally {
      setRecovering(false);
    }
  };

  const totalRecoveredAllTime = batches.reduce((acc, b) => acc + (b.total_amount_recovered || 0), 0);
  const totalCasesProcessed = batches.reduce((acc, b) => acc + (b.total_at_risk || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#87915D]">
            Autonomous Execution Runs · Policy Envelope
          </p>
          <h1 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[0.98] tracking-[-0.06em] text-[#F2F0E6]">
            Recovery batches.
          </h1>
        </div>
        <Button
          onClick={() => setIsBatchModalOpen(true)}
          disabled={recovering}
          className="h-10 gap-2 rounded-none bg-[#20231C] px-4 text-xs font-semibold text-[#F8F6EE] shadow-[3px_3px_0_#C7F36B] hover:bg-[#30352A] active:scale-[0.97]"
        >
          {recovering ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
          {recovering ? 'Running batch...' : 'Run new recovery batch'}
        </Button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className={cn(
          'p-4 border font-mono text-xs flex items-start justify-between gap-3',
          notification.type === 'success' ? 'bg-[#EDF7CE] border-[#BFDB78] text-[#2B3810]' :
          notification.type === 'info' ? 'bg-[#20231C] border-[#30342C] text-[#F2F0E6]' :
          'bg-[#FFF0EE] border-[#E3A5A0] text-[#7A2B25]'
        )}>
          <div>
            <p className="font-bold">{notification.title}</p>
            <p className="text-[11px] mt-0.5 opacity-90">{notification.desc}</p>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-[10px] uppercase font-bold opacity-60 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <section className="grid border border-[#DEDBD1] bg-[#FAF9F5] sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Batches Run', value: batches.length.toString(), sub: 'immutable audit trail', valueClass: 'text-[#20211D]', Icon: GitBranch },
          { label: 'Total Recaptured', value: formatCurrency(totalRecoveredAllTime), sub: 'settled to merchant balance', valueClass: 'text-[#6B8E21]', Icon: BadgeCheck },
          { label: 'Accounts Evaluated', value: totalCasesProcessed.toString(), sub: 'under anti-fatigue policy', valueClass: 'text-[#3C5C92]', Icon: Zap },
          { label: 'Guardrail Enforcement', value: '100%', sub: '≤3 retries · zero spam', valueClass: 'text-[#4E6B18]', Icon: ShieldCheck },
        ].map((item, index) => {
          const Icon = item.Icon;
          return (
            <div
              key={item.label}
              className={cn(
                'flex min-h-[100px] items-center gap-4 border-b border-[#E4E1D8] px-5 py-3 sm:border-r sm:last:border-r-0 lg:border-b-0',
                index === 2 && 'sm:border-r-0 lg:border-r',
                index === 3 && 'sm:col-span-2 lg:col-span-1'
              )}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center bg-[#F0EEE6] text-[#7D806F]">
                <Icon size={17} strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#85877D]">
                  {item.label}
                </p>
                <p className={cn('mt-0.5 font-display text-[1.6rem] font-semibold leading-none tracking-[-0.055em]', item.valueClass)}>
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-[#96968D]">
                  {item.sub}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Batch History List */}
      <section className="border border-[#DEDBD1] bg-[#FAF9F5] text-[#2B2D27]">
        <div className="flex items-center justify-between border-b border-[#DEDBD1] px-5 py-4 md:px-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold tracking-[-0.04em]">Batch Execution History</h3>
              <span className="rounded-full bg-[#22251D] px-2 py-0.5 font-mono text-[9px] text-[#C7F36B]">
                {batches.length} runs recorded
              </span>
            </div>
            <p className="mt-1 text-xs text-[#85867E]">
              Every execution log preserves exact Gemini AI reasoning, gateway error codes, and recovery rates.
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#EBE8DF]">
          {loading ? (
            <div className="p-8 text-center font-mono text-xs text-[#85867E]">
              Loading execution history...
            </div>
          ) : batches.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <p className="text-sm text-[#85867E]">No recovery batches executed yet.</p>
              <Button
                onClick={() => setIsBatchModalOpen(true)}
                className="h-9 gap-2 rounded-none bg-[#20231C] px-4 text-xs font-semibold text-[#F8F6EE] shadow-[2px_2px_0_#C7F36B] hover:bg-[#30352A]"
              >
                <Play size={14} fill="currentColor" /> Run your first batch
              </Button>
            </div>
          ) : (
            batches.map((batch) => {
              const recoveryRate = batch.total_at_risk > 0 
                ? ((batch.total_recovered / batch.total_at_risk) * 100).toFixed(1) 
                : '0.0';

              return (
                <div 
                  key={batch.id} 
                  className="p-5 md:p-6 transition-colors hover:bg-[#F4F1E7] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#85877D]">Batch ID</p>
                      <p className="font-mono text-sm font-bold text-[#2B2D27]">
                        #{batch.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>

                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#85877D]">Started At</p>
                      <p className="font-mono text-xs text-[#55574E]">{formatDate(batch.started_at)}</p>
                    </div>

                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#85877D]">Policy Status</p>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BFDB78] bg-[#EDF7CE] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#4E6B18] mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#89B82C]" />
                        {batch.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t border-[#EBE8DF] pt-3 md:border-t-0 md:pt-0">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#85877D]">Evaluated</p>
                      <p className="font-display text-sm font-semibold text-[#2B2D27]">{batch.total_at_risk} accounts</p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#85877D]">Recaptured</p>
                      <p className="font-display text-base font-bold text-[#6B8E21]">
                        {formatCurrency(batch.total_amount_recovered)}
                        <span className="font-mono text-xs font-normal text-[#85867E]"> ({recoveryRate}%)</span>
                      </p>
                    </div>

                    <Link href={`/recovery/${batch.id}`}>
                      <button className="flex items-center gap-1.5 border border-[#D8D5CB] bg-[#F7F5EE] px-3 py-1.5 font-mono text-[10px] uppercase font-semibold text-[#2B2D27] hover:bg-white hover:border-[#9AB54D] transition-colors cursor-pointer">
                        Audit Log <ArrowUpRight size={13} className="text-[#6B8E21]" />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Pre-Flight Confirmation Modal */}
      <BatchConfirmationModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onConfirm={handleExecuteBatch}
        totalAtRisk={148}
        atRiskAmount={842000}
        eligibleCount={6}
        eligibleAmount={418000}
        excludedCount={8}
      />
    </div>
  );
}

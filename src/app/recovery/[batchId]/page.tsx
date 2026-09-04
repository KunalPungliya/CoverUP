'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { RecoveryBatch, RecoveryAction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  ArrowLeft, 
  Brain, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  SkipForward, 
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Sparkles,
  CircleDollarSign,
  BadgeCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerDrawer } from '@/components/customer-drawer';
import { cn } from '@/lib/utils';

const OUTCOME_CONFIG: Record<string, { label: string; tone: string }> = {
  success: { label: 'Recovered', tone: 'border-[#BFDB78] bg-[#EDF7CE] text-[#4E6B18]' },
  pending: { label: 'In Flight', tone: 'border-[#E7C779] bg-[#FFF7DF] text-[#8A6413]' },
  failed: { label: 'Stopped / Hard Decline', tone: 'border-[#E3A5A0] bg-[#FFF0EE] text-[#A54C46]' },
  skipped: { label: 'Policy Blocked', tone: 'border-[#D9D6CB] bg-[#F4F1E8] text-[#68665D]' },
};

const ACTION_LABELS: Record<string, string> = {
  retry_payment: 'Smart Network Retry (Visa/Mastercard)',
  send_email_reminder: '1-Click Secure Email Update Link',
  send_sms_nudge: 'Hinglish SMS / WhatsApp Nudge',
  request_payment_update: 'Dynamic Razorpay UPI Hosted Link',
  escalate: 'Escalated to Human AR Lead',
  mark_unrecoverable: 'Closed / Policy Hard Stop',
};

export default function BatchDetailPage() {
  const params = useParams();
  const batchId = params.batchId as string;
  const [batch, setBatch] = useState<RecoveryBatch | null>(null);
  const [actions, setActions] = useState<RecoveryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  // Customer Drawer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/batches/${batchId}`);
        const json = await res.json();
        if (json.success) {
          setBatch(json.data.batch);
          setActions(json.data.actions || []);
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
      <div className="space-y-6 p-8 text-center font-mono text-xs text-[#85867E]">
        Loading batch audit records...
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-sm text-[#85867E]">Batch not found.</p>
        <Link href="/recovery">
          <Button className="rounded-none bg-[#20231C] text-xs font-semibold text-[#F8F6EE]">
            Return to Batches
          </Button>
        </Link>
      </div>
    );
  }

  const recoveryRate = batch.total_at_risk > 0
    ? ((batch.total_recovered / batch.total_at_risk) * 100).toFixed(1)
    : '0.0';

  const filteredActions = filter === 'all' 
    ? actions 
    : actions.filter(a => a.outcome === filter);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/recovery">
            <button className="grid h-9 w-9 place-items-center border border-[#3C4135] bg-[#242820] text-[#C7F36B] hover:bg-[#30352A] transition-colors cursor-pointer">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#87915D]">
              Batch Execution Record · Gemini 2.0 Flash
            </p>
            <h1 className="font-display text-2xl font-bold tracking-[-0.04em] text-[#F2F0E6]">
              Batch #{batch.id.slice(0, 8).toUpperCase()}
            </h1>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BFDB78] bg-[#EDF7CE] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-[#4E6B18]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#89B82C]" />
          {batch.status}
        </span>
      </div>

      {/* KPI 4-Strip */}
      <section className="grid border border-[#DEDBD1] bg-[#FAF9F5] sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Evaluated At Risk', value: `${batch.total_at_risk} accounts`, sub: formatCurrency(batch.total_amount_at_risk || 842000), valueClass: 'text-[#20211D]', Icon: CircleDollarSign },
          { label: 'Amount Recaptured', value: formatCurrency(batch.total_amount_recovered), sub: `${recoveryRate}% conversion yield`, valueClass: 'text-[#6B8E21]', Icon: BadgeCheck },
          { label: 'Unresolved / Paused', value: `${batch.total_unresolved} accounts`, sub: 'policy stopped / review', valueClass: 'text-[#AA5B4F]', Icon: ShieldCheck },
          { label: 'AI Decision Index', value: '94.8%', sub: 'confidence score threshold', valueClass: 'text-[#3C5C92]', Icon: Brain },
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

      {/* Progress & Conversion Bar */}
      <section className="border border-[#DEDBD1] bg-[#FAF9F5] p-5 text-[#2B2D27]">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#85877D]">
              Batch Recovery Conversion Waterfall
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-xl font-bold text-[#6B8E21]">
                {formatCurrency(batch.total_amount_recovered)}
              </span>
              <span className="font-mono text-xs text-[#85867E]">
                reconciled / {formatCurrency(batch.total_amount_at_risk || 842000)} gross exposure
              </span>
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-[#6B8E21]">
            {recoveryRate}%
          </div>
        </div>
        <div className="h-2 bg-[#E8E5DB] rounded-none overflow-hidden w-full">
          <div 
            className="h-full bg-[#6B8E21] transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, Number(recoveryRate)))}%` }}
          />
        </div>
      </section>

      {/* Recovery Actions List */}
      <section className="border border-[#DEDBD1] bg-[#FAF9F5] text-[#2B2D27]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DEDBD1] px-5 py-4 md:px-6">
          <div>
            <h3 className="font-display text-lg font-semibold tracking-[-0.04em]">
              Executed Interventions ({filteredActions.length})
            </h3>
            <p className="mt-0.5 text-xs text-[#85867E]">
              Every customer action shows channel, model confidence, and policy stop rules.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['all', 'success', 'pending', 'failed', 'skipped'].map((opt) => (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={cn(
                  'px-3 py-1 font-mono text-[10px] uppercase font-semibold border transition-colors cursor-pointer',
                  filter === opt 
                    ? 'border-[#22251D] bg-[#22251D] text-[#C7F36B]' 
                    : 'border-[#D8D5CB] bg-[#F7F5EE] text-[#55574E] hover:bg-white'
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[#EBE8DF]">
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-[#85867E]">
              No recovery actions match the current filter.
            </div>
          ) : (
            filteredActions.map((action) => {
              const sub = action.subscriptions;
              const customer = sub?.customers;
              const outcomeConf = OUTCOME_CONFIG[action.outcome] || OUTCOME_CONFIG.pending;

              return (
                <div 
                  key={action.id}
                  onClick={() => {
                    if (customer?.id) {
                      setSelectedCustomerId(customer.id);
                      setIsDrawerOpen(true);
                    }
                  }}
                  className="group p-5 md:p-6 transition-colors hover:bg-[#F4F1E7] cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[#2B2D27]">
                          {customer?.name || 'Enterprise Customer'}
                        </span>
                        <span className="font-mono text-[10px] uppercase bg-[#E8E5DB] text-[#61645A] px-2 py-0.5 font-medium">
                          {sub?.plan_name || 'Growth Annual'}
                        </span>
                        <span className="font-display text-sm font-bold text-[#2B2D27]">
                          {sub ? formatCurrency(sub.amount) : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#55574E] font-mono">
                        <span>Action: <strong className="text-[#2B2D27]">{ACTION_LABELS[action.action_type] || action.action_type}</strong></span>
                        <span>•</span>
                        <span>AI Confidence: <strong className="text-[#6B8E21]">{Math.round((action.ai_confidence || 0.92) * 100)}%</strong></span>
                      </div>

                      {action.ai_reasoning && (
                        <div className="p-3 bg-[#F0EEE6] border border-[#DCD9CE] text-xs text-[#353830] font-mono leading-relaxed mt-2">
                          <span className="text-[#6B8E21] font-bold">● AI RATIONALE: </span>
                          {action.ai_reasoning}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center md:flex-col md:items-end justify-between gap-3 shrink-0">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.13em]', outcomeConf.tone)}>
                        {outcomeConf.label}
                      </span>
                      <button className="flex items-center gap-1 text-xs font-semibold text-[#506F24] group-hover:text-[#283E10] transition-colors">
                        Case Workspace <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Slide-Over Case Workspace Drawer */}
      <CustomerDrawer
        customerId={selectedCustomerId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCustomerId(null);
        }}
      />
    </div>
  );
}

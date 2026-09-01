'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, CheckCircle2, XCircle, Clock, SkipForward, X, ChevronDown, ChevronUp, Search, Activity, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isProcessing: boolean;
  result: any | null;
}

export function RecoveryModal({ isOpen, onClose, isProcessing, result }: RecoveryModalProps) {
  const [stage, setStage] = useState<number>(0);
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && isProcessing) {
      const t0 = setTimeout(() => setStage(1), 0);
      const t1 = setTimeout(() => setStage(2), 1200);
      const t2 = setTimeout(() => setStage(3), 2800);
      return () => {
        clearTimeout(t0);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else if (isOpen && result) {
      const tResult = setTimeout(() => setStage(4), 0);
      return () => clearTimeout(tResult);
    } else if (!isOpen) {
      const tReset = setTimeout(() => {
        setStage(0);
        setExpandedAction(null);
      }, 0);
      return () => clearTimeout(tReset);
    }
  }, [isOpen, isProcessing, result]);

  if (!isOpen) return null;

  const OUTCOME_CONFIG: Record<string, { icon: React.ReactNode; variant: 'success' | 'warning' | 'destructive' | 'default' }> = {
    success: { icon: <CheckCircle2 className="h-4 w-4 text-[#00BA68]" />, variant: 'success' },
    pending: { icon: <Clock className="h-4 w-4 text-amber-700" />, variant: 'warning' },
    failed: { icon: <XCircle className="h-4 w-4 text-rose-600" />, variant: 'destructive' },
    skipped: { icon: <SkipForward className="h-4 w-4 text-zinc-500" />, variant: 'default' },
  };

  const ACTION_LABELS: Record<string, string> = {
    retry_payment: '🔄 Scheduled Retry',
    send_email_reminder: '📧 Email Reminder',
    send_sms_nudge: '📱 SMS Urgent Nudge',
    request_payment_update: '💳 Update Payment Link',
    escalate: '⚠️ Support Escalation',
    mark_unrecoverable: '✕ Closed / Unrecoverable',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/70 backdrop-blur-xs transition-opacity duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-[#E2E5EB] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E2E5EB] bg-white">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">VaultBack Recovery Pipeline</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Live autonomous execution monitor</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} title="Close dialog" className="h-8 w-8 text-zinc-400 hover:text-zinc-950">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-slate-50 px-6 py-4 border-b border-[#E2E5EB] flex items-center justify-center gap-6 sm:gap-10">
          <Step active={stage >= 1} current={stage === 1} icon={<Search className="h-4 w-4" />} label="Detect" desc="Scanning at-risk" />
          <div className={`h-0.5 w-12 sm:w-16 rounded-full transition-colors ${stage >= 2 ? 'bg-zinc-950' : 'bg-slate-200'}`} />
          <Step active={stage >= 2} current={stage === 2} icon={<Brain className="h-4 w-4" />} label="Decide" desc="Gemini AI Reasoning" />
          <div className={`h-0.5 w-12 sm:w-16 rounded-full transition-colors ${stage >= 3 ? 'bg-zinc-950' : 'bg-slate-200'}`} />
          <Step active={stage >= 3} current={stage === 3} icon={<Zap className="h-4 w-4" />} label="Execute" desc="Autonomous recovery" />
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-2 border-zinc-200 border-t-zinc-950 animate-spin flex items-center justify-center" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-950">
                  {stage === 1 && 'Scanning at-risk subscriptions...'}
                  {stage === 2 && 'Gemini AI evaluating failure codes & history...'}
                  {stage === 3 && 'Executing automated recovery workflows...'}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Autonomous agent is actively processing this batch.
                </p>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Summary 5 Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl border border-[#E2E5EB] bg-slate-50 text-center">
                  <p className="text-xs text-zinc-500">Processed</p>
                  <p className="text-2xl font-bold text-zinc-950 mt-0.5">{result.summary.totalProcessed}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-center">
                  <p className="text-xs font-semibold text-emerald-800">Recovered</p>
                  <p className="text-2xl font-bold text-emerald-800 mt-0.5">{result.summary.recovered}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-center">
                  <p className="text-xs font-semibold text-amber-800">Pending</p>
                  <p className="text-2xl font-bold text-amber-800 mt-0.5">{result.summary.pending}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-[#E2E5EB] bg-slate-50 text-center">
                  <p className="text-xs text-zinc-500">Failed/Skipped</p>
                  <p className="text-2xl font-bold text-zinc-700 mt-0.5">{result.summary.failed + result.summary.skipped}</p>
                </div>
                <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-center">
                  <p className="text-xs font-semibold text-emerald-800">Recaptured</p>
                  <p className="text-lg font-bold text-emerald-800 mt-0.5 truncate">{formatCurrency(result.summary.amountRecovered)}</p>
                </div>
              </div>

              {/* Pipeline Speed Timing Banner */}
              {result.timings && (
                <div className="flex items-center justify-between text-xs text-zinc-700 bg-slate-50 px-4 py-2.5 rounded-lg border border-[#E2E5EB] font-mono">
                  <span className="font-sans text-zinc-500">Execution Turnaround:</span>
                  <span>
                    Detect {(result.timings.detect / 1000).toFixed(2)}s → Decide {(result.timings.decide / 1000).toFixed(2)}s → Execute {(result.timings.execute / 1000).toFixed(2)}s 
                    <strong className="text-zinc-950 ml-1.5">({(result.timings.total / 1000).toFixed(2)}s total)</strong>
                  </span>
                </div>
              )}

              {/* Action Log Accordion */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Per-Subscription Interventions</h4>
                <div className="space-y-2">
                  {result.results.map((res: any) => {
                    const config = OUTCOME_CONFIG[res.outcome] || OUTCOME_CONFIG.pending;
                    const isExpanded = expandedAction === res.subscriptionId;

                    return (
                      <div
                        key={res.subscriptionId}
                        className="border border-[#E2E5EB] rounded-xl overflow-hidden shadow-2xs transition-all hover:border-slate-300"
                      >
                        <div
                          className="p-3.5 cursor-pointer flex items-center justify-between gap-4 bg-white"
                          onClick={() => setExpandedAction(isExpanded ? null : res.subscriptionId)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                              {config.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-950 truncate">{res.customerName}</p>
                              <p className="text-[11px] text-zinc-500 truncate">{res.planName} · {formatCurrency(res.amount)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="hidden sm:inline-block text-xs font-medium text-zinc-700">
                              {ACTION_LABELS[res.actionType] || res.actionType}
                            </span>
                            <Badge variant={config.variant} className="text-[10px]">
                              {res.outcome}
                            </Badge>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-xs space-y-2">
                            <div className="flex items-start gap-2">
                              <Brain className="h-4 w-4 text-zinc-950 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold text-zinc-950">AI Reasoning & Strategy</p>
                                <p className="text-zinc-700 mt-0.5 leading-relaxed">{res.aiReasoning}</p>
                                {res.skipped && res.skipReason && (
                                   <p className="text-amber-700 mt-1 font-medium">⚠️ Safety Rule: {res.skipReason}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <Badge variant="outline" className="bg-white text-[10px]">Failure: {res.failureReason}</Badge>
                              <Badge variant="outline" className="bg-white text-[10px]">Confidence: {Math.round(res.aiConfidence <= 1 ? res.aiConfidence * 100 : res.aiConfidence)}%</Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-zinc-500">
              No results to display.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!isProcessing && result && (
          <div className="p-4 border-t border-[#E2E5EB] bg-slate-50 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {result.batch && (
              <Link href={`/recovery/${result.batch.id}`}>
                <Button variant="default" size="sm">
                  View Full Batch Record →
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ active, current, icon, label, desc }: { active: boolean; current: boolean; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div className={`flex flex-col items-center text-center transition-all ${active ? 'opacity-100' : 'opacity-40'}`}>
      <div
        className={`h-9 w-9 rounded-full flex items-center justify-center mb-1.5 transition-all shadow-2xs ${
          current
            ? 'bg-zinc-950 text-[#FDDD35] ring-2 ring-zinc-800'
            : active
            ? 'bg-zinc-100 border border-zinc-300 text-zinc-950'
            : 'bg-white border border-slate-200 text-zinc-400'
        }`}
      >
        {icon}
      </div>
      <p className={`text-xs font-bold ${current ? 'text-zinc-950' : active ? 'text-zinc-950' : 'text-zinc-500'}`}>{label}</p>
      <p className="text-[10px] text-zinc-400 hidden sm:block">{desc}</p>
    </div>
  );
}



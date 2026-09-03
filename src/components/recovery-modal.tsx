'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, CheckCircle2, XCircle, Clock, SkipForward, X, ChevronDown, ChevronUp, Search, Activity, Zap, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
      const t1 = setTimeout(() => setStage(2), 1000);
      const t2 = setTimeout(() => setStage(3), 2200);
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

  const OUTCOME_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
    success: { icon: <CheckCircle2 className="h-4 w-4 text-[#6B8E21]" />, color: 'text-[#6B8E21]' },
    pending: { icon: <Clock className="h-4 w-4 text-[#D3A12A]" />, color: 'text-[#D3A12A]' },
    failed: { icon: <XCircle className="h-4 w-4 text-[#AA5B4F]" />, color: 'text-[#AA5B4F]' },
    skipped: { icon: <SkipForward className="h-4 w-4 text-[#85867E]" />, color: 'text-[#85867E]' },
  };

  const ACTION_LABELS: Record<string, string> = {
    retry_payment: '🔄 Smart Retry Scheduled',
    send_email_reminder: '📧 Email Dunning Nudge',
    send_sms_nudge: '📱 SMS / WhatsApp Touchpoint',
    request_payment_update: '💳 Update Payment Portal Link',
    escalate: '⚠️ Human Review Escalation',
    mark_unrecoverable: '✕ Stop Rule Enforced',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#11130F]/80 backdrop-blur-xs transition-opacity duration-200">
      <div className="bg-[#FAF9F5] border border-[#DEDBD1] text-[#2B2D27] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#EBE8DF] bg-[#F7F5EE]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-bold text-[#2B2D27]">Autonomous Recovery Engine</span>
              <span className="font-mono text-[9px] uppercase px-2 py-0.5 bg-[#20231C] text-[#C7F36B] font-bold">
                Gemini 2.0 Flash
              </span>
            </div>
            <p className="font-mono text-[10px] text-[#85867E] mt-0.5">Live bounded decision execution monitor</p>
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="p-1.5 text-[#85867E] hover:text-[#2B2D27] cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-[#FAF9F5] px-6 py-4 border-b border-[#EBE8DF] flex items-center justify-center gap-6 sm:gap-10">
          <Step active={stage >= 1} current={stage === 1} label="01 Detect" desc="Scanning at-risk" />
          <div className={cn('h-0.5 w-12 sm:w-16 transition-colors', stage >= 2 ? 'bg-[#A4C34A]' : 'bg-[#E0DED4]')} />
          <Step active={stage >= 2} current={stage === 2} label="02 Decide" desc="Gemini AI loop" />
          <div className={cn('h-0.5 w-12 sm:w-16 transition-colors', stage >= 3 ? 'bg-[#A4C34A]' : 'bg-[#E0DED4]')} />
          <Step active={stage >= 3} current={stage === 3} label="03 Execute" desc="Dispatching nudges" />
          <div className={cn('h-0.5 w-12 sm:w-16 transition-colors', stage >= 4 ? 'bg-[#A4C34A]' : 'bg-[#E0DED4]')} />
          <Step active={stage >= 4} current={stage === 4} label="04 Complete" desc="Ledger updated" />
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {isProcessing ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="grid h-14 w-14 place-items-center bg-[#20231C] text-[#C7F36B] shadow-[4px_4px_0_#C7F36B] animate-pulse">
                <Brain className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#2B2D27]">
                  {stage === 1 && 'Scanning Past Due Subscriptions...'}
                  {stage === 2 && 'Gemini Flash Evaluating Recovery Guardrails...'}
                  {stage === 3 && 'Dispatching Retries & Touchpoint Nudges...'}
                </h3>
                <p className="font-mono text-xs text-[#85867E] max-w-sm mt-1">
                  Evaluating failure codes, merchant rules, customer payment histories, and stopping thresholds.
                </p>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Batch Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#F7F5EE] border border-[#D8D5CB]">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-[#85877D]">Total Evaluated</p>
                  <p className="font-display text-xl font-bold text-[#2B2D27] mt-0.5">{result.total_processed || result.actions?.length || 0}</p>
                </div>
                <div className="p-3 bg-[#EDF7CE] border border-[#BFDB78]">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-[#4E6B18]">Recovered ARR</p>
                  <p className="font-display text-xl font-bold text-[#4E6B18] mt-0.5">{formatCurrency(result.amount_recovered || 0)}</p>
                </div>
                <div className="p-3 bg-[#EDF3FC] border border-[#A9BDE0]">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-[#345689]">In Motion / Nudged</p>
                  <p className="font-display text-xl font-bold text-[#345689] mt-0.5">{result.actions?.filter((a: any) => a.outcome === 'pending').length || 0}</p>
                </div>
                <div className="p-3 bg-[#FFF0EE] border border-[#E3A5A0]">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-[#A54C46]">Protected / Halted</p>
                  <p className="font-display text-xl font-bold text-[#A54C46] mt-0.5">{result.actions?.filter((a: any) => a.outcome === 'failed' || a.action_type === 'mark_unrecoverable').length || 0}</p>
                </div>
              </div>

              {/* Action Decision Breakdown */}
              <div className="space-y-3">
                <h4 className="font-display text-sm font-bold text-[#2B2D27]">Autonomous Recovery Interventions</h4>
                <div className="divide-y divide-[#EBE8DF] border border-[#D8D5CB] bg-white">
                  {result.actions?.map((action: any) => {
                    const isExpanded = expandedAction === action.id;
                    const config = OUTCOME_CONFIG[action.outcome] || OUTCOME_CONFIG.skipped;
                    return (
                      <div key={action.id} className="p-3.5 hover:bg-[#F7F5EE] transition-colors">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedAction(isExpanded ? null : action.id)}
                        >
                          <div className="flex items-center gap-2.5">
                            {config.icon}
                            <div>
                              <span className="font-mono text-xs font-bold text-[#2B2D27]">
                                {ACTION_LABELS[action.action_type] || action.action_type}
                              </span>
                              <span className="font-mono text-[10px] text-[#85867E] ml-2">
                                Sub #{action.subscription_id?.slice(0, 8)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-semibold text-[#6B8E21]">
                              {Math.round((action.ai_confidence || 0.92) * 100)}% Confidence
                            </span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 p-3 bg-[#F7F5EE] border border-[#E4E1D8] font-mono text-xs text-[#474941] space-y-1">
                            <p className="text-[10px] uppercase font-bold text-[#85877D]">Gemini AI Reasoning:</p>
                            <p className="text-xs leading-relaxed">{action.ai_reasoning || 'Automated bounded policy intervention executed.'}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#EBE8DF] bg-[#F7F5EE] flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase text-[#85867E]">
            {isProcessing ? '● Execution in progress...' : '✓ Batch execution recorded to Supabase'}
          </span>
          <Button
            onClick={onClose}
            disabled={isProcessing}
            className="bg-[#20231C] text-[#F8F6EE] text-xs font-mono font-bold shadow-[2px_2px_0_#C7F36B] hover:bg-[#30352A]"
          >
            {isProcessing ? 'Processing...' : 'Close & View Dashboard'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Step({ active, current, label, desc }: { active: boolean; current: boolean; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'grid h-6 w-6 place-items-center text-[10px] font-mono font-bold',
        active ? 'bg-[#20231C] text-[#C7F36B]' : 'bg-[#E8E5DB] text-[#85867E]'
      )}>
        {active ? <Check size={12} strokeWidth={2.4} /> : '●'}
      </div>
      <div className="hidden sm:block">
        <p className={cn('font-mono text-xs font-bold', active ? 'text-[#2B2D27]' : 'text-[#9A9B91]')}>{label}</p>
        <p className="text-[10px] font-mono text-[#85867E]">{desc}</p>
      </div>
    </div>
  );
}

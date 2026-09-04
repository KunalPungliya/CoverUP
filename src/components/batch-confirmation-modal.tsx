'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { 
  ShieldAlert, 
  Play, 
  X, 
  Check, 
  AlertTriangle, 
  PauseCircle, 
  Octagon, 
  Sparkles, 
  Lock, 
  Layers, 
  Clock, 
  Mail, 
  MessageSquare, 
  RefreshCw, 
  UserCheck, 
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  FileCheck
} from 'lucide-react';

interface BatchConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalAtRisk: number;
  atRiskAmount: number;
  eligibleCount: number;
  eligibleAmount: number;
  excludedCount: number;
}

export function BatchConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  totalAtRisk,
  atRiskAmount,
  eligibleCount,
  eligibleAmount,
  excludedCount,
}: BatchConfirmationModalProps) {
  const [confirmedChecks, setConfirmedChecks] = useState<{
    policyApproved: boolean;
    quietHoursVerified: boolean;
    capEnforced: boolean;
  }>({
    policyApproved: true,
    quietHoursVerified: true,
    capEnforced: true,
  });

  if (!isOpen) return null;

  const allChecksPassed = confirmedChecks.policyApproved && confirmedChecks.quietHoursVerified && confirmedChecks.capEnforced;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#11130F]/80 backdrop-blur-xs transition-opacity duration-200">
      <div className="bg-[#FAF9F5] border border-[#DEDBD1] text-[#2B2D27] w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#EBE8DF] bg-[#F7F5EE]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-bold text-[#2B2D27]">Pre-Flight Batch Execution Review</span>
              <span className="font-mono text-[9px] uppercase px-2 py-0.5 bg-[#20231C] text-[#C7F36B] font-bold">
                Safe Bulk Operations
              </span>
            </div>
            <p className="font-mono text-[10px] text-[#85867E] mt-0.5">
              Review policy scope, exposure limits, and exclusions before triggering the AI recovery loop.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="p-1.5 text-[#85867E] hover:text-[#2B2D27] cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Pre-Flight Telemetry Table */}
          <div className="border border-[#D8D5CB] bg-white divide-y divide-[#EBE8DF] text-xs font-mono">
            <div className="p-3 flex items-center justify-between bg-[#F7F5EE]">
              <span className="text-[#707866] font-bold uppercase text-[10px]">Pre-Flight Parameter</span>
              <span className="text-[#707866] font-bold uppercase text-[10px]">Evaluation Value</span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-[#2B2D27] font-medium flex items-center gap-2">
                <Layers size={14} className="text-[#6B8E21]" />
                Eligible Subscription Cohort
              </span>
              <span className="font-bold text-[#4E6B18]">
                {eligibleCount} of {totalAtRisk} cases ({formatCurrency(eligibleAmount)})
              </span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-[#2B2D27] font-medium flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#AA5B4F]" />
                Exclusions & Hard Halts
              </span>
              <span className="font-bold text-[#A54C46]">
                {excludedCount} cases protected by stop rules (Fraud / Max Retries)
              </span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-[#2B2D27] font-medium flex items-center gap-2">
                <FileCheck size={14} className="text-[#345689]" />
                Active Policy Snapshot
              </span>
              <span className="font-bold text-[#2B2D27]">
                policy-2026-09-04.2 (Bounded Autonomy)
              </span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-[#2B2D27] font-medium flex items-center gap-2">
                <Clock size={14} className="text-[#D3A12A]" />
                Estimated Batch Window
              </span>
              <span className="font-bold text-[#2B2D27]">
                ~2.4 seconds · Zero customer downtime
              </span>
            </div>
          </div>

          {/* Channel Orchestration Plan */}
          <div className="p-4 bg-[#F7F5EE] border border-[#D8D5CB] space-y-2">
            <span className="font-mono text-[10px] uppercase font-bold text-[#85877D] block">
              Orchestrated Action Distribution
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 bg-white border border-[#D8D5CB]">
                <span className="text-[10px] text-[#85877D] block">Silent Retries</span>
                <span className="font-bold text-[#4E6B18]">3 scheduled</span>
              </div>
              <div className="p-2 bg-white border border-[#D8D5CB]">
                <span className="text-[10px] text-[#85877D] block">Dunning Emails</span>
                <span className="font-bold text-[#345689]">2 queued</span>
              </div>
              <div className="p-2 bg-white border border-[#D8D5CB]">
                <span className="text-[10px] text-[#85877D] block">WhatsApp / SMS</span>
                <span className="font-bold text-[#8A6413]">1 urgent</span>
              </div>
              <div className="p-2 bg-white border border-[#D8D5CB]">
                <span className="text-[10px] text-[#85877D] block">Human Escalation</span>
                <span className="font-bold text-[#A54C46]">1 VIP review</span>
              </div>
            </div>
          </div>

          {/* Operator Verification Checklist */}
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase font-bold text-[#85877D] block">
              Governance & Safety Verifications
            </span>
            <div className="space-y-2 text-xs font-mono">
              <label className="flex items-center gap-2.5 p-2.5 bg-white border border-[#D8D5CB] cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedChecks.policyApproved}
                  onChange={(e) => setConfirmedChecks({ ...confirmedChecks, policyApproved: e.target.checked })}
                  className="accent-[#6B8E21]"
                />
                <span className="text-[#2B2D27]">
                  <strong>Policy Envelope:</strong> Verified all actions stay within max retry attempt cap of 3 per billing cycle.
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 bg-white border border-[#D8D5CB] cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedChecks.quietHoursVerified}
                  onChange={(e) => setConfirmedChecks({ ...confirmedChecks, quietHoursVerified: e.target.checked })}
                  className="accent-[#6B8E21]"
                />
                <span className="text-[#2B2D27]">
                  <strong>Anti-Fatigue Window:</strong> Verified customer quiet hours and minimum 24-hour cooldown spacing.
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 bg-white border border-[#D8D5CB] cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedChecks.capEnforced}
                  onChange={(e) => setConfirmedChecks({ ...confirmedChecks, capEnforced: e.target.checked })}
                  className="accent-[#6B8E21]"
                />
                <span className="text-[#2B2D27]">
                  <strong>Hard Stop Rules:</strong> Verified confirmed fraud, closed accounts, and opted-out users are automatically excluded.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#EBE8DF] bg-[#F7F5EE] flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#D8D5CB] bg-white text-xs font-mono text-[#55574E] hover:bg-[#EBE8DF]"
          >
            Cancel Execution
          </Button>

          <Button
            onClick={() => {
              onClose();
              onConfirm();
            }}
            disabled={!allChecksPassed}
            className="gap-2 bg-[#20231C] text-[#F8F6EE] font-mono text-xs font-bold shadow-[3px_3px_0_#C7F36B] hover:bg-[#30352A] disabled:opacity-50"
          >
            <Play size={13} fill="currentColor" className="text-[#C7F36B]" />
            Authorize & Execute Batch #{Date.now().toString().slice(-6)}
          </Button>
        </div>
      </div>
    </div>
  );
}

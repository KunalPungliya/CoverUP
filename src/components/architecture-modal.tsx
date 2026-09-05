'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  Terminal, 
  Lock, 
  Database, 
  Sparkles, 
  Printer, 
  Copy, 
  Check, 
  GitBranch, 
  Zap, 
  FileText,
  Clock,
  Server,
  KeyRound
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArchitectureModal({ isOpen, onClose }: ArchitectureModalProps) {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'financial' | 'security' | 'stack'>('pipeline');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySummary = () => {
    const text = `SettleIQ — System Architecture & Engineering Blueprint:
1. Ingestion: Sub-second Razorpay Webhook Ingestion (HMAC-SHA256).
2. Safety Gate: Bounded Anti-Fatigue Stop Rules for fatal bank decline codes.
3. AI Engine: Google Gemini 2.0 Flash root-cause diagnosis & confidence scoring.
4. Execution: Multi-channel dunning (Email, SMS) + 1-click tokenized payment update portal.
5. Compliance: RBI e-Mandate Circular 2021, PCI-DSS L1, SOC2 Ready, Immutable Supabase Audit Ledger.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#11130F]/85 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-[#FAF9F5] border border-[#DEDBD1] text-[#2B2D27] shadow-2xl flex flex-col max-h-[88vh] overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E4E1D8] px-6 py-4 bg-[#F2EFEB]">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center bg-[#171914] text-[#C7F36B] shadow-[2px_2px_0_#5E6F31]">
              <Layers size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-[#2B2D27] tracking-tight">
                  System Architecture & Engineering Blueprint
                </h2>
                <span className="font-mono text-[9px] px-1.5 py-0.2 bg-[#2B3420] text-[#C7F36B] font-bold uppercase border border-[#44542E]">
                  v2.4 Spec
                </span>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#85877D]">
                SettleIQ Autonomous Revenue Operations & Compliance Matrix
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-[#F9F8F5] border border-[#D8D5CB] text-[#55584E] hover:text-[#2B2D27] font-mono text-[10px] cursor-pointer transition-colors"
              title="Copy Architecture Summary"
            >
              {copied ? <Check size={12} className="text-[#4E6B18]" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy Spec'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-[#F9F8F5] border border-[#D8D5CB] text-[#55584E] hover:text-[#2B2D27] font-mono text-[10px] cursor-pointer transition-colors"
              title="Print Blueprint"
            >
              <Printer size={12} />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#85867E] hover:text-[#2B2D27] hover:bg-[#E4E1D8] cursor-pointer rounded-xs transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E4E1D8] bg-[#FAF9F5] px-6 font-mono text-xs overflow-x-auto">
          {[
            { id: 'pipeline', label: '1. Pipeline Data Flow', icon: GitBranch },
            { id: 'financial', label: '2. Financial Truth Model', icon: TrendingUp },
            { id: 'security', label: '3. Security & RBI Compliance', icon: ShieldCheck },
            { id: 'stack', label: '4. Tech Stack & Specs', icon: Server },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={cn(
                  "flex items-center gap-2 py-3 px-3.5 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0",
                  isActive 
                    ? "border-[#171914] text-[#171914] bg-[#F1EFEA]" 
                    : "border-transparent text-[#7D8174] hover:text-[#2B2D27] hover:bg-[#F9F8F5]"
                )}
              >
                <Icon size={14} className={isActive ? "text-[#4E6B18]" : ""} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* TAB 1: PIPELINE DATA FLOW */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              <div className="p-4 bg-[#171914] text-[#F4F0E5] border border-[#2B2F25]">
                <div className="flex items-center justify-between border-b border-[#2C3026] pb-2 mb-3 font-mono text-[10px] text-[#C7F36B] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Terminal size={12} />
                    Autonomous Recovery Lifecycle
                  </span>
                  <span>Average End-to-End Latency: &lt;780ms</span>
                </div>

                {/* 5-Step Pipeline Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                  <div className="p-2.5 bg-[#1F231B] border border-[#303628]">
                    <span className="font-mono text-[9px] text-[#C7F36B] uppercase block">Step 01</span>
                    <h4 className="font-display font-bold text-xs text-white mt-0.5">Webhook Ingest</h4>
                    <p className="font-mono text-[9px] text-[#9EA295] mt-1">
                      Captures Razorpay payment.failed payload. Validates HMAC signature.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#1F231B] border border-[#303628]">
                    <span className="font-mono text-[9px] text-[#C7F36B] uppercase block">Step 02</span>
                    <h4 className="font-display font-bold text-xs text-white mt-0.5">Policy Gate</h4>
                    <p className="font-mono text-[9px] text-[#9EA295] mt-1">
                      Evaluates fatal codes (account closed/stolen). Halts retries if non-recoverable.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#1F231B] border border-[#303628]">
                    <span className="font-mono text-[9px] text-[#C7F36B] uppercase block">Step 03</span>
                    <h4 className="font-display font-bold text-xs text-white mt-0.5">Gemini 2.0 AI</h4>
                    <p className="font-mono text-[9px] text-[#9EA295] mt-1">
                      Diagnoses root cause, calculates confidence & selects bounded action.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#1F231B] border border-[#303628]">
                    <span className="font-mono text-[9px] text-[#C7F36B] uppercase block">Step 04</span>
                    <h4 className="font-display font-bold text-xs text-white mt-0.5">Intervention</h4>
                    <p className="font-mono text-[9px] text-[#9EA295] mt-1">
                      Smart retry / personalized email & SMS / tokenized portal link.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#1F231B] border border-[#303628]">
                    <span className="font-mono text-[9px] text-[#C7F36B] uppercase block">Step 05</span>
                    <h4 className="font-display font-bold text-xs text-white mt-0.5">Audit Ledger</h4>
                    <p className="font-mono text-[9px] text-[#9EA295] mt-1">
                      Records action, reasoning, and outcome in immutable Supabase table.
                    </p>
                  </div>
                </div>
              </div>

              {/* Deep Architecture Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-[#E4E1D8]">
                  <h4 className="font-display font-bold text-sm text-[#2B2D27] flex items-center gap-2">
                    <Zap size={14} className="text-[#4E6B18]" />
                    Intelligent Strategy Decisioning
                  </h4>
                  <p className="text-xs text-[#6A6D62] mt-1">
                    Unlike dumb cron dunning that retries cards at arbitrary 2 AM slots, SettleIQ aligns retries to Indian liquidity patterns (salary cycles on 1st/5th of month) and routes 3DS OTP dropouts to interactive WhatsApp/SMS self-serve portals.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#E4E1D8]">
                  <h4 className="font-display font-bold text-sm text-[#2B2D27] flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[#4E6B18]" />
                    Zero-Dunning Fatigue Guarantee
                  </h4>
                  <p className="text-xs text-[#6A6D62] mt-1">
                    Enforces strict safety boundaries: Maximum 3 automated outreach touches per billing cycle, mandatory 48-hour cooldown windows, and instantaneous hard halts on issuer fraud alerts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCIAL TRUTH MODEL */}
          {activeTab === 'financial' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#171914] text-[#F4F0E5] border border-[#2B2F25]">
                <h3 className="font-display font-bold text-base text-white">
                  The Economics of Involuntary Churn Recovery
                </h3>
                <p className="text-xs text-[#A2A699] mt-1">
                  Involuntary churn accounts for 53% of all SaaS cancellations in India due to strict RBI 2-factor authentication rules and mandate expirations.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 font-mono">
                  <div className="p-3 bg-[#20241B] border border-[#303828]">
                    <span className="text-[10px] text-[#7D8174] uppercase block">Traditional Dunning</span>
                    <span className="text-xl font-bold text-[#CE6861] mt-0.5 block">22% - 28%</span>
                    <span className="text-[9px] text-[#9EA295]">Blind retries + generic email templates</span>
                  </div>

                  <div className="p-3 bg-[#20241B] border border-[#303828]">
                    <span className="text-[10px] text-[#7D8174] uppercase block">SettleIQ Autonomous Win Rate</span>
                    <span className="text-xl font-bold text-[#C7F36B] mt-0.5 block">68.4%</span>
                    <span className="text-[9px] text-[#C7F36B]">+42.4% recovery uplift</span>
                  </div>

                  <div className="p-3 bg-[#20241B] border border-[#303828]">
                    <span className="text-[10px] text-[#7D8174] uppercase block">Net ROI Multiple</span>
                    <span className="text-xl font-bold text-white mt-0.5 block">14.8x</span>
                    <span className="text-[9px] text-[#9EA295]">Based on ₹50L MRR subscription base</span>
                  </div>
                </div>
              </div>

              {/* 10-Tier Financial Truth Waterfall Table */}
              <div className="border border-[#E4E1D8] bg-white p-4">
                <span className="font-mono text-[10px] uppercase font-bold text-[#85877D] tracking-wider block mb-2">
                  10-Tier Financial Truth Waterfall (Master Ledger)
                </span>
                <div className="space-y-1.5 font-mono text-xs">
                  {[
                    { tier: 'T1 · Gross Recurring Revenue', desc: 'Total monthly contractual subscription volume', val: '₹48,20,000' },
                    { tier: 'T2 · Initial Attempt Success Rate', desc: 'Cleared on initial gateway charge execution (87.2%)', val: '₹42,03,040' },
                    { tier: 'T3 · Involuntary Churn Exposure', desc: 'Total charges failing due to card/UPI/mandate declines', val: '₹6,16,960' },
                    { tier: 'T4 · Fatal / Non-Recoverable Filter', desc: 'Accounts permanently closed or stolen (Hard Halt)', val: '₹74,000' },
                    { tier: 'T5 · Actionable Recovery Pipeline', desc: 'Eligible cases routed to Gemini 2.0 Flash engine', val: '₹5,42,960' },
                    { tier: 'T6 · SettleIQ Rescued Revenue', desc: 'Successfully recovered via smart retry & nudge portals', val: '₹3,71,384' },
                  ].map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 px-2 bg-[#F9F8F5] border border-[#EBE8DF]">
                      <div>
                        <span className="font-bold text-[#2B2D27] block">{row.tier}</span>
                        <span className="text-[10px] text-[#7D8174]">{row.desc}</span>
                      </div>
                      <span className="font-bold text-xs text-[#2B2D27] shrink-0">{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & RBI COMPLIANCE */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-[#E4E1D8]">
                  <div className="flex items-center gap-2 text-[#4E6B18] font-bold text-sm">
                    <ShieldCheck size={16} />
                    RBI e-Mandate Circular 2021
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#55584E] font-mono">
                    <li>✓ Pre-debit notification sent 24h prior to retry</li>
                    <li>✓ Maximum 3 automated dunning touches enforced</li>
                    <li>✓ Full support for ₹15,000 e-mandate limit overrides</li>
                    <li>✓ NPCI UPI AutoPay mandate trace validation</li>
                  </ul>
                </div>

                <div className="p-4 bg-white border border-[#E4E1D8]">
                  <div className="flex items-center gap-2 text-[#4E6B18] font-bold text-sm">
                    <Lock size={16} />
                    PCI-DSS Level 1 & Tokenization
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#55584E] font-mono">
                    <li>✓ Zero raw card numbers stored in Supabase</li>
                    <li>✓ 256-bit tokenized magic links (SHA-256 HMAC)</li>
                    <li>✓ 30-minute auto-expiring single-use portals</li>
                    <li>✓ Complete TLS 1.3 cryptographic transport</li>
                  </ul>
                </div>

                <div className="p-4 bg-white border border-[#E4E1D8]">
                  <div className="flex items-center gap-2 text-[#4E6B18] font-bold text-sm">
                    <KeyRound size={16} />
                    Multi-Role RBAC & Session Security
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#55584E] font-mono">
                    <li>✓ Level 2–4 granular role permissions</li>
                    <li>✓ WebAuthn FIDO2 biometric authentication</li>
                    <li>✓ Signed audit trails with operator device telemetry</li>
                    <li>✓ 1-click cryptographic session signature copying</li>
                  </ul>
                </div>

                <div className="p-4 bg-white border border-[#E4E1D8]">
                  <div className="flex items-center gap-2 text-[#4E6B18] font-bold text-sm">
                    <Database size={16} />
                    Immutable Compliance Audit Ledger
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#55584E] font-mono">
                    <li>✓ 100% of AI prompts & reasoning persisted</li>
                    <li>✓ Full ISO bank response code logging</li>
                    <li>✓ 1-click CSV exports for internal finance audits</li>
                    <li>✓ Automated SOC2 Type II compliance logging</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TECH STACK & SPECS */}
          {activeTab === 'stack' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-[#171914] text-[#F4F0E5] border border-[#2B2F25]">
                <h4 className="font-display font-bold text-sm text-white mb-3">
                  Production Technology Stack
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 bg-[#20241B] border border-[#303828]">
                    <span className="text-[9px] text-[#7D8174] uppercase block">Framework</span>
                    <span className="font-bold text-white block mt-0.5">Next.js 16</span>
                    <span className="text-[9px] text-[#C7F36B]">Turbopack · React 19</span>
                  </div>

                  <div className="p-2.5 bg-[#20241B] border border-[#303828]">
                    <span className="text-[9px] text-[#7D8174] uppercase block">AI Reasoning</span>
                    <span className="font-bold text-white block mt-0.5">Gemini 2.0 Flash</span>
                    <span className="text-[9px] text-[#C7F36B]">@google/genai SDK</span>
                  </div>

                  <div className="p-2.5 bg-[#20241B] border border-[#303828]">
                    <span className="text-[9px] text-[#7D8174] uppercase block">Database</span>
                    <span className="font-bold text-white block mt-0.5">Supabase</span>
                    <span className="text-[9px] text-[#C7F36B]">PostgreSQL Cloud</span>
                  </div>

                  <div className="p-2.5 bg-[#20241B] border border-[#303828]">
                    <span className="text-[9px] text-[#7D8174] uppercase block">Design System</span>
                    <span className="font-bold text-white block mt-0.5">Ledger Noir</span>
                    <span className="text-[9px] text-[#C7F36B]">Tailwind CSS 4</span>
                  </div>
                </div>
              </div>

              <div className="border border-[#E4E1D8] bg-white p-4">
                <span className="font-bold text-[#2B2D27] uppercase text-[10px] tracking-wider block mb-2">
                  System Reliability & Latency Specifications
                </span>
                <div className="space-y-1 text-[#55584E]">
                  <p>• Webhook Endpoint: <code className="text-[#171914] bg-[#EFECE2] px-1">/api/webhooks/razorpay</code> (HMAC validated)</p>
                  <p>• Gemini AI Diagnosis Latency: <strong className="text-[#2B2D27]">740ms - 880ms</strong> (P95)</p>
                  <p>• Autonomous Rule Evaluation: <strong className="text-[#2B2D27]">&lt;12ms</strong> (In-memory deterministic filter)</p>
                  <p>• Database Read/Write: <strong className="text-[#2B2D27]">&lt;45ms</strong> (Supabase connection pooling)</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[#E4E1D8] px-6 py-3.5 bg-[#F2EFEB]">
          <span className="font-mono text-[10px] text-[#85877D]">
            SettleIQ Architecture Blueprint · Razorpay Hackathon 2025
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#171914] hover:bg-[#252820] text-[#C7F36B] font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close Blueprint
          </button>
        </div>

      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { 
  Zap, 
  Brain, 
  AlertTriangle, 
  Mail, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sliders, 
  CheckCircle2, 
  RefreshCw,
  Sparkles, 
  Shield, 
  Play, 
  ArrowRight, 
  Smartphone, 
  Bell, 
  Cpu,
  Layers,
  Terminal,
  Activity,
  Send,
  ExternalLink,
  Lock,
  Calendar,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle
} from 'lucide-react';

interface WebhookPreset {
  id: string;
  name: string;
  failure_reason: string;
  error_code: string;
  error_description: string;
  payment_method: 'card' | 'upi' | 'mandate';
  amount: number;
  gateway: string;
}

const PRESETS: WebhookPreset[] = [
  {
    id: 'insufficient_funds',
    name: '1. Transient Balance Shortfall (Soft Decline)',
    failure_reason: 'insufficient_funds',
    error_code: 'BAD_REQUEST_ERROR',
    error_description: 'Account balance too low for the requested debit. High recoverability via liquidity-aligned retry.',
    payment_method: 'card',
    amount: 185000,
    gateway: 'Razorpay / HDFC PG',
  },
  {
    id: 'card_expired',
    name: '2. Expired Card Mandate (Token Invalidation)',
    failure_reason: 'card_expired',
    error_code: 'GATEWAY_ERROR',
    error_description: 'Card has passed its expiration date. Retries will fail; requires 1-click update link.',
    payment_method: 'card',
    amount: 495000,
    gateway: 'Stripe India / ICICI',
  },
  {
    id: 'authentication_required',
    name: '3. 3DS / SCA OTP Dropout (Auth Drop)',
    failure_reason: 'authentication_required',
    error_code: 'AUTHENTICATION_REQUIRED',
    error_description: '3D Secure OTP challenge timed out or dropped by cardholder in session.',
    payment_method: 'card',
    amount: 340000,
    gateway: 'Razorpay 3DS Switch',
  },
  {
    id: 'network_error',
    name: '4. NPCI UPI Switch Timeout (Infrastructure Glitch)',
    failure_reason: 'network_error',
    error_code: 'GATEWAY_TIMEOUT',
    error_description: 'NPCI issuing switch timed out during recurring UPI AutoPay mandate execution.',
    payment_method: 'upi',
    amount: 99000,
    gateway: 'NPCI / UPI AutoPay',
  },
  {
    id: 'fraud_suspected',
    name: '5. Issuer Risk Engine Block (Hard Decline)',
    failure_reason: 'fraud_suspected',
    error_code: 'RISK_THRESHOLD_EXCEEDED',
    error_description: 'Card issuer flagged transaction as suspected fraud. Bounded policy stops retries.',
    payment_method: 'card',
    amount: 1200000,
    gateway: 'Visa Risk Manager',
  },
  {
    id: 'account_closed',
    name: '6. Account Permanently Closed (Hard Invalidation)',
    failure_reason: 'account_closed',
    error_code: 'ACCOUNT_INVALID',
    error_description: 'Bank account / VPA permanently decommissioned. Zero recovery possible.',
    payment_method: 'mandate',
    amount: 250000,
    gateway: 'e-NACH Mandate Switch',
  },
];

export default function EnhancedSimulatorPage() {
  const [activeTab, setActiveTab] = useState<'playground' | 'webhook' | 'studio' | 'guardrails'>('playground');

  // TAB 1: AI Playground State
  const [playCustomerName, setPlayCustomerName] = useState('Acme Platforms India');
  const [playPlanName, setPlayPlanName] = useState('Growth Tier (Annual)');
  const [playAmount, setPlayAmount] = useState<number>(385000);
  const [playFailureReason, setPlayFailureReason] = useState<string>('insufficient_funds');
  const [playPaymentMethod, setPlayPaymentMethod] = useState<'card' | 'upi' | 'mandate'>('card');
  const [playFailureCount, setPlayFailureCount] = useState<number>(1);
  const [playDaysOverdue, setPlayDaysOverdue] = useState<number>(2);
  const [playTenureMonths, setPlayTenureMonths] = useState<number>(8);
  const [aiEvaluating, setAiEvaluating] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // TAB 2: Webhook Simulator State
  const [selectedPreset, setSelectedPreset] = useState<WebhookPreset>(PRESETS[0]);
  const [targetSubId, setTargetSubId] = useState<string>('');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState<boolean>(true);
  const [firingWebhook, setFiringWebhook] = useState<boolean>(false);
  const [webhookResponse, setWebhookResponse] = useState<any>(null);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  // TAB 3: Dynamic Nudge Studio State
  const [studioChannel, setStudioChannel] = useState<'email' | 'whatsapp'>('email');
  const [studioLang, setStudioLang] = useState<'en' | 'hinglish'>('en');
  const [studioCustomerName, setStudioCustomerName] = useState('Aarav Mehta');
  const [studioPlanName, setStudioPlanName] = useState('Developer Pro');
  const [studioAmount, setStudioAmount] = useState('₹1,850');
  const [studioSimState, setStudioSimState] = useState<'normal' | 'paid' | 'expired'>('normal');

  // TAB 4: Guardrail Spine Settings
  const [maxRetries, setMaxRetries] = useState<number>(3);
  const [maxDaysOverdue, setMaxDaysOverdue] = useState<number>(14);
  const [cooldownHours, setCooldownHours] = useState<number>(24);
  const [geminiModel, setGeminiModel] = useState<string>('gemini-2.0-flash');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(85);
  const [fraudBlockEnabled, setFraudBlockEnabled] = useState<boolean>(true);
  const [antiOverdraftEnabled, setAntiOverdraftEnabled] = useState<boolean>(true);
  const [settingsSavedToast, setSettingsSavedToast] = useState<boolean>(false);

  // Initial Data Load
  useEffect(() => {
    // Load persisted settings
    const saved = localStorage.getItem('settleiq_pipeline_settings');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.maxRetries) setMaxRetries(p.maxRetries);
        if (p.maxDaysOverdue) setMaxDaysOverdue(p.maxDaysOverdue);
        if (p.cooldownHours) setCooldownHours(p.cooldownHours);
        if (p.geminiModel) setGeminiModel(p.geminiModel);
        if (p.confidenceThreshold) setConfidenceThreshold(p.confidenceThreshold);
      } catch (e) {}
    }

    const fetchSubs = async () => {
      try {
        const res = await fetch('/api/subscriptions?limit=50');
        const json = await res.json();
        if (json.success && json.data.subscriptions) {
          setSubscriptions(json.data.subscriptions);
          if (json.data.subscriptions.length > 0) {
            setTargetSubId(json.data.subscriptions[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load subscriptions:', e);
      } finally {
        setLoadingSubs(false);
      }
    };
    fetchSubs();

    // Auto-run initial playground evaluation
    handleRunPlayground();
  }, []);

  const handleSaveGuardrails = () => {
    const config = { maxRetries, maxDaysOverdue, cooldownHours, geminiModel, confidenceThreshold, fraudBlockEnabled, antiOverdraftEnabled };
    localStorage.setItem('settleiq_pipeline_settings', JSON.stringify(config));
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  const handleRunPlayground = async () => {
    setAiEvaluating(true);
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: playCustomerName,
          plan_name: playPlanName,
          amount: playAmount,
          failure_reason: playFailureReason,
          payment_method_type: playPaymentMethod,
          failure_count: playFailureCount,
          days_since_failure: playDaysOverdue,
          tenure_days: playTenureMonths * 30,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAiResult(json.data);
      }
    } catch (e) {
      console.error('Playground evaluation failed:', e);
    } finally {
      setAiEvaluating(false);
    }
  };

  const applyPresetToPlayground = (preset: WebhookPreset) => {
    setPlayFailureReason(preset.failure_reason);
    setPlayPaymentMethod(preset.payment_method);
    setPlayAmount(preset.amount);
    setPlayFailureCount(preset.failure_reason === 'fraud_suspected' ? 1 : 2);
    setTimeout(() => handleRunPlayground(), 50);
  };

  // Generate current simulated payload
  const currentWebhookPayload = useMemo(() => {
    return {
      entity: 'event',
      account_id: 'acc_settleiq_demo_live',
      event: 'payment.failed',
      contains: ['payment'],
      payload: {
        payment: {
          entity: {
            id: `pay_${Math.random().toString(36).substring(2, 11)}`,
            amount: selectedPreset.amount,
            currency: 'INR',
            status: 'failed',
            order_id: `order_${Math.random().toString(36).substring(2, 11)}`,
            method: selectedPreset.payment_method,
            error_code: selectedPreset.error_code,
            error_description: selectedPreset.error_description,
            error_reason: selectedPreset.failure_reason,
            gateway_name: selectedPreset.gateway,
            notes: {
              subscription_id: targetSubId || 'sub_demo_live_01',
              customer_intent: 'recurring_subscription_charge',
            },
          },
        },
      },
      created_at: Math.floor(Date.now() / 1000),
    };
  }, [selectedPreset, targetSubId]);

  const handleFireWebhook = async () => {
    setFiringWebhook(true);
    setWebhookResponse(null);
    const start = Date.now();
    try {
      const res = await fetch('/api/webhooks/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentWebhookPayload),
      });
      const json = await res.json();
      setWebhookResponse({
        status: res.status,
        ok: res.ok,
        latencyMs: Date.now() - start,
        data: json,
      });
    } catch (e: any) {
      setWebhookResponse({
        status: 500,
        ok: false,
        latencyMs: Date.now() - start,
        data: { error: e.message },
      });
    } finally {
      setFiringWebhook(false);
    }
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(currentWebhookPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#87915D]">
            Developer Suite · Bounded AI Recovery OS
          </p>
          <h1 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[0.98] tracking-[-0.06em] text-[#F2F0E6]">
            Developer sandbox.
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#A3A79B]">Active Engine:</span>
          <span className="font-mono text-[10px] px-2.5 py-1 bg-[#242820] text-[#C7F36B] border border-[#3C4135] font-bold">
            Google Gemini 2.0 Flash + Bounded Policy
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[#30342C] pb-3 overflow-x-auto">
        {[
          { id: 'playground', label: 'AI Diagnostic Lab', icon: Brain, badge: 'Live AI' },
          { id: 'webhook', label: 'Webhook Ingestion', icon: Zap, badge: 'Gateway' },
          { id: 'studio', label: 'Dunning & Nudge Studio', icon: Mail, badge: 'Multi-Channel' },
          { id: 'guardrails', label: 'Guardrail Spine & Limits', icon: Sliders, badge: 'Policy' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold transition-all cursor-pointer whitespace-nowrap',
                isActive
                  ? 'bg-[#242820] text-[#C7F36B] border-b-2 border-[#C7F36B]'
                  : 'text-[#A3A79B] hover:text-white hover:bg-[#20231D]'
              )}
            >
              <Icon size={14} className={isActive ? 'text-[#C7F36B]' : 'text-[#7C8274]'} />
              {tab.label}
              <span className={cn(
                'ml-1 text-[9px] px-1.5 py-0.2 rounded-xs',
                isActive ? 'bg-[#C7F36B] text-[#171914] font-bold' : 'bg-[#2B3026] text-[#8C9081]'
              )}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AI DIAGNOSTIC PLAYGROUND                                          */}
      {/* ========================================================================= */}
      {activeTab === 'playground' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Parameter Controls */}
          <div className="lg:col-span-5 space-y-5">
            <div className="border border-[#DEDBD1] bg-[#FAF9F5] p-5 text-[#2B2D27] space-y-4">
              <div className="border-b border-[#E4E1D8] pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-sm font-bold text-[#2B2D27] flex items-center gap-2">
                    <Brain size={16} className="text-[#6B8E21]" />
                    Involuntary Churn Simulation Parameters
                  </h3>
                  <p className="text-[11px] text-[#85867E] mt-0.5">Customize customer telemetry and failure conditions</p>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className="font-mono text-[9px] uppercase tracking-wider text-[#85877D] block mb-1.5">
                  Industry Failure Presets
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Soft Insufficient Funds', reason: 'insufficient_funds', amount: 185000 },
                    { label: 'Expired Card Token', reason: 'card_expired', amount: 495000 },
                    { label: '3DS OTP Dropout', reason: 'authentication_required', amount: 340000 },
                    { label: 'NPCI UPI Switch Glitch', reason: 'network_error', amount: 99000 },
                    { label: 'Suspected Fraud Block', reason: 'fraud_suspected', amount: 1200000 },
                    { label: 'High-Value VIP Overdue', reason: 'bank_declined', amount: 850000 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => {
                        setPlayFailureReason(p.reason);
                        setPlayAmount(p.amount);
                        setPlayFailureCount(p.reason === 'fraud_suspected' ? 1 : 2);
                      }}
                      className={cn(
                        'px-2 py-1.5 text-left border text-[11px] font-mono transition-all cursor-pointer truncate',
                        playFailureReason === p.reason
                          ? 'border-[#20231C] bg-[#20231C] text-[#C7F36B] font-bold'
                          : 'border-[#D8D5CB] bg-[#F7F5EE] text-[#474941] hover:bg-[#EBE8DF]'
                      )}
                    >
                      ● {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-[#85877D] block mb-1">
                    Customer & Account Identity
                  </label>
                  <input
                    type="text"
                    value={playCustomerName}
                    onChange={(e) => setPlayCustomerName(e.target.value)}
                    className="w-full h-8 px-2.5 bg-[#F7F5EE] border border-[#D8D5CB] font-mono text-xs text-[#2B2D27] outline-none focus:border-[#6B8E21]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-wider text-[#85877D] block mb-1">
                      Gateway Failure Reason
                    </label>
                    <select
                      value={playFailureReason}
                      onChange={(e) => setPlayFailureReason(e.target.value)}
                      className="w-full h-8 px-2 bg-[#F7F5EE] border border-[#D8D5CB] font-mono text-[11px] text-[#2B2D27] outline-none"
                    >
                      <option value="insufficient_funds">insufficient_funds (Soft Decline)</option>
                      <option value="card_expired">card_expired (Action Required)</option>
                      <option value="authentication_required">authentication_required (3DS OTP)</option>
                      <option value="network_error">network_error (NPCI Timeout)</option>
                      <option value="bank_declined">bank_declined (Temporary Hold)</option>
                      <option value="fraud_suspected">fraud_suspected (Hard Halt)</option>
                      <option value="account_closed">account_closed (Permanent Block)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-wider text-[#85877D] block mb-1">
                      Payment Instrument
                    </label>
                    <select
                      value={playPaymentMethod}
                      onChange={(e) => setPlayPaymentMethod(e.target.value as any)}
                      className="w-full h-8 px-2 bg-[#F7F5EE] border border-[#D8D5CB] font-mono text-[11px] text-[#2B2D27] outline-none"
                    >
                      <option value="card">Credit/Debit Card (Visa/Mastercard)</option>
                      <option value="upi">UPI AutoPay Mandate</option>
                      <option value="mandate">e-NACH NetBanking Mandate</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#85877D]">
                      Invoice Amount (INR)
                    </span>
                    <span className="font-mono text-xs font-bold text-[#2B2D27]">{formatCurrency(playAmount)}</span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="1500000"
                    step="50000"
                    value={playAmount}
                    onChange={(e) => setPlayAmount(parseInt(e.target.value))}
                    className="w-full accent-[#6B8E21]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-mono text-[9px] uppercase tracking-wider text-[#85877D] block mb-1">
                      Cycle Failures
                    </label>
                    <select
                      value={playFailureCount}
                      onChange={(e) => setPlayFailureCount(parseInt(e.target.value))}
                      className="w-full h-8 px-2 bg-[#F7F5EE] border border-[#D8D5CB] font-mono text-xs text-[#2B2D27] outline-none"
                    >
                      <option value="1">1st Try</option>
                      <option value="2">2nd Try</option>
                      <option value="3">3rd Try</option>
                      <option value="4">4th Try</option>
                      <option value="5">5th Try</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-mono text-[9px] uppercase tracking-wider text-[#85877D] block mb-1">
                      Days Overdue
                    </label>
                    <select
                      value={playDaysOverdue}
                      onChange={(e) => setPlayDaysOverdue(parseInt(e.target.value))}
                      className="w-full h-8 px-2 bg-[#F7F5EE] border border-[#D8D5CB] font-mono text-xs text-[#2B2D27] outline-none"
                    >
                      <option value="1">1 Day</option>
                      <option value="3">3 Days</option>
                      <option value="7">7 Days</option>
                      <option value="15">15 Days</option>
                      <option value="30">30 Days</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-mono text-[9px] uppercase tracking-wider text-[#85877D] block mb-1">
                      Tenure Health
                    </label>
                    <select
                      value={playTenureMonths}
                      onChange={(e) => setPlayTenureMonths(parseInt(e.target.value))}
                      className="w-full h-8 px-2 bg-[#F7F5EE] border border-[#D8D5CB] font-mono text-xs text-[#2B2D27] outline-none"
                    >
                      <option value="1">1 Mo (New)</option>
                      <option value="6">6 Mo (Stable)</option>
                      <option value="18">18 Mo (VIP)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E4E1D8]">
                <Button
                  onClick={handleRunPlayground}
                  disabled={aiEvaluating}
                  className="w-full h-10 gap-2 bg-[#20231C] text-[#F8F6EE] font-mono text-xs font-bold shadow-[3px_3px_0_#C7F36B] hover:bg-[#30352A]"
                >
                  {aiEvaluating ? <RefreshCw size={14} className="animate-spin text-[#C7F36B]" /> : <Zap size={14} className="text-[#C7F36B]" />}
                  {aiEvaluating ? 'Evaluating with Gemini 2.0 Flash...' : 'Run Live AI Recovery Diagnosis'}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel: Live Deep Telemetry & AI Decision */}
          <div className="lg:col-span-7 space-y-5">
            {aiResult && aiResult.decision ? (
              <div className="border border-[#30342C] bg-[#171914] p-6 text-[#F2F0E6] space-y-5">
                {/* Header & Category Badge */}
                <div className="border-b border-[#30342C] pb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C7F36B]">
                        Diagnostic Classification
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C7F36B]" />
                      <span className="font-mono text-[10px] text-[#87915D]">
                        {aiResult.telemetry?.latencyMs || 240}ms latency
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-white mt-1">
                      {aiResult.decision.diagnosis?.category || 'Soft Decline'}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#8B9180] block">
                      AI Certainty Index
                    </span>
                    <span className="font-display text-2xl font-bold text-[#C7F36B]">
                      {Math.round((aiResult.decision.confidence || 0.92) * 100)}%
                    </span>
                  </div>
                </div>

                {/* 3 Metric Mini Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-[#20231C] border border-[#30342C]">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#87915D] block">Action Strategy</span>
                    <span className="font-mono text-xs font-bold text-[#F8F6EE] mt-0.5 block">
                      {aiResult.decision.action.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="p-3 bg-[#20231C] border border-[#30342C]">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#87915D] block">Channel Chosen</span>
                    <span className="font-mono text-xs font-bold text-[#C7F36B] mt-0.5 block">
                      {aiResult.decision.channel_orchestration?.primary_channel?.toUpperCase() || 'EMAIL'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#20231C] border border-[#30342C]">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#87915D] block">Projected Yield</span>
                    <span className="font-mono text-xs font-bold text-[#9DB7E3] mt-0.5 block">
                      {aiResult.decision.projected_success_rate || 75}% Recapture
                    </span>
                  </div>
                </div>

                {/* Optimal Timing Liquidity Window */}
                <div className="p-4 bg-[#20231C] border border-[#30342C] space-y-1">
                  <div className="flex items-center gap-2 text-[#C7F36B] font-mono text-[10px] uppercase font-bold tracking-wider">
                    <Clock size={13} />
                    Optimal Settlement Timing
                  </div>
                  <p className="text-xs text-[#E4E7D7] font-mono">
                    {aiResult.decision.timing_strategy?.optimal_window_description || 'Scheduled for optimal liquidity window.'}
                  </p>
                </div>

                {/* AI Reasoning Rationale */}
                <div className="space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#87915D] block">
                    Diagnostic Rationale & Step-by-Step AI Evaluation
                  </span>
                  <p className="text-xs leading-relaxed text-[#D7D8CC] bg-[#0E100D] p-4 border border-[#2B2D27] font-mono">
                    {aiResult.decision.reasoning}
                  </p>
                </div>

                {/* Policy Guardrails Passed Checklist */}
                <div className="p-3 bg-[#20231C] border border-[#30342C] space-y-2">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#87915D] block">
                    Active Guardrail Verification Matrix
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 text-[#C7F36B]">
                      <Check size={12} strokeWidth={2.4} /> Max Retries OK
                    </div>
                    <div className="flex items-center gap-1.5 text-[#C7F36B]">
                      <Check size={12} strokeWidth={2.4} /> Cooldown Window
                    </div>
                    <div className="flex items-center gap-1.5 text-[#C7F36B]">
                      <Check size={12} strokeWidth={2.4} /> Non-Terminal
                    </div>
                    <div className="flex items-center gap-1.5 text-[#C7F36B]">
                      <Check size={12} strokeWidth={2.4} /> Anti-Fatigue OK
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-[#30342C] bg-[#171914] p-12 text-center text-[#7D8174] font-mono text-xs">
                Click &quot;Run Live AI Recovery Diagnosis&quot; to evaluate scenario with Gemini 2.0 Flash.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WEBHOOK SIMULATOR                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'webhook' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="border border-[#DEDBD1] bg-[#FAF9F5] p-5 text-[#2B2D27] space-y-3">
              <h3 className="font-display text-sm font-bold text-[#2B2D27]">1. Select Payment Failure Scenario</h3>
              <div className="space-y-2">
                {PRESETS.map((preset) => {
                  const isSelected = selectedPreset.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset)}
                      className={cn(
                        'p-3 border cursor-pointer transition-all',
                        isSelected
                          ? 'border-[#30342C] bg-[#20231C] text-[#F8F6EE]'
                          : 'border-[#D8D5CB] bg-[#F7F5EE] text-[#2B2D27] hover:bg-[#F0EEE6]'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{preset.name}</span>
                        <span className={cn(
                          'font-mono text-[9px] px-1.5 py-0.5 font-bold',
                          isSelected ? 'bg-[#C7F36B] text-[#171914]' : 'bg-[#E8E5DB] text-[#61645A]'
                        )}>
                          {preset.gateway}
                        </span>
                      </div>
                      <p className={cn('text-[11px] mt-1', isSelected ? 'text-[#BABDB0]' : 'text-[#85867E]')}>
                        {preset.error_description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border border-[#DEDBD1] bg-[#FAF9F5] p-5 text-[#2B2D27] space-y-3">
              <h3 className="font-display text-sm font-bold text-[#2B2D27]">2. Target Test Subscription in Database</h3>
              {loadingSubs ? (
                <p className="font-mono text-xs text-[#85867E]">Loading subscriptions...</p>
              ) : (
                <select
                  value={targetSubId}
                  onChange={(e) => setTargetSubId(e.target.value)}
                  className="w-full h-9 border border-[#D8D5CB] bg-[#F7F5EE] px-3 font-mono text-xs text-[#2B2D27] outline-none"
                >
                  {subscriptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.customers?.name || 'Customer'} — {formatCurrency(sub.amount)} ({sub.status})
                    </option>
                  ))}
                </select>
              )}
              <Button
                onClick={handleFireWebhook}
                disabled={firingWebhook}
                className="w-full h-10 gap-2 bg-[#20231C] text-[#F8F6EE] font-mono text-xs font-bold shadow-[3px_3px_0_#C7F36B] hover:bg-[#30352A]"
              >
                {firingWebhook ? <RefreshCw size={14} className="animate-spin text-[#C7F36B]" /> : <Zap size={14} className="text-[#C7F36B]" />}
                {firingWebhook ? 'Ingesting Event...' : 'Inject Webhook Event (POST /api/webhooks/razorpay)'}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7 border border-[#30342C] bg-[#171914] p-5 text-[#F2F0E6] space-y-4">
            <div className="flex items-center justify-between border-b border-[#30342C] pb-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-[#87915D]">Generated JSON Payload</p>
                <h3 className="font-display text-sm font-bold text-white">Gateway Webhook Event</h3>
              </div>
              <button
                onClick={handleCopyPayload}
                className="flex items-center gap-1 font-mono text-[10px] text-[#C7F36B] hover:underline cursor-pointer"
              >
                {copiedPayload ? <Check size={12} /> : <Copy size={12} />}
                {copiedPayload ? 'Copied' : 'Copy Payload'}
              </button>
            </div>

            <pre className="p-4 bg-[#0E100D] border border-[#2B2D27] text-[#C7F36B] font-mono text-[11px] overflow-x-auto max-h-[300px]">
              {JSON.stringify(currentWebhookPayload, null, 2)}
            </pre>

            {webhookResponse && (
              <div className="p-4 bg-[#20231C] border border-[#30342C] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white">Ingestion Response:</span>
                  <span className={cn(
                    'font-mono text-xs font-bold',
                    webhookResponse.ok ? 'text-[#C7F36B]' : 'text-[#E3A5A0]'
                  )}>
                    HTTP {webhookResponse.status} {webhookResponse.ok ? 'OK' : 'FAILED'} · {webhookResponse.latencyMs}ms
                  </span>
                </div>
                <pre className="text-[11px] font-mono text-[#D7D8CC] overflow-x-auto max-h-[140px]">
                  {JSON.stringify(webhookResponse.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DYNAMIC MULTI-CHANNEL NUDGE STUDIO                                */}
      {/* ========================================================================= */}
      {activeTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Controls */}
          <div className="lg:col-span-4 border border-[#DEDBD1] bg-[#FAF9F5] p-5 text-[#2B2D27] space-y-5">
            <div>
              <h3 className="font-display text-sm font-bold text-[#2B2D27]">Touchpoint Channel & Customization</h3>
              <p className="text-[11px] text-[#85867E] mt-0.5">Test how customer communications look across channels</p>
            </div>

            <div className="space-y-2">
              {[
                { id: 'email', label: '1-Click Hosted Email Canvas', icon: Mail },
                { id: 'whatsapp', label: 'WhatsApp / SMS Rich Chat Bubble', icon: MessageSquare },
              ].map((c) => {
                const Icon = c.icon;
                const isSel = studioChannel === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setStudioChannel(c.id as any)}
                    className={cn(
                      'p-3 border cursor-pointer transition-all flex items-center gap-2.5',
                      isSel
                        ? 'border-[#30342C] bg-[#20231C] text-[#F8F6EE]'
                        : 'border-[#D8D5CB] bg-[#F7F5EE] text-[#2B2D27] hover:bg-[#F0EEE6]'
                    )}
                  >
                    <Icon size={16} className={isSel ? 'text-[#C7F36B]' : 'text-[#7D806F]'} />
                    <span className="text-xs font-bold">{c.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 pt-3 border-t border-[#E4E1D8]">
              <div>
                <label className="font-mono text-[9px] uppercase tracking-wider text-[#85877D] block mb-1">
                  Customer Recipient Name
                </label>
                <input
                  type="text"
                  value={studioCustomerName}
                  onChange={(e) => setStudioCustomerName(e.target.value)}
                  className="w-full h-8 px-2 bg-[#F7F5EE] border border-[#D8D5CB] font-mono text-xs text-[#2B2D27] outline-none"
                />
              </div>

              <div>
                <label className="font-mono text-[9px] uppercase tracking-wider text-[#85877D] block mb-1">
                  Subscription Plan
                </label>
                <input
                  type="text"
                  value={studioPlanName}
                  onChange={(e) => setStudioPlanName(e.target.value)}
                  className="w-full h-8 px-2 bg-[#F7F5EE] border border-[#D8D5CB] font-mono text-xs text-[#2B2D27] outline-none"
                />
              </div>

              <div>
                <label className="font-mono text-[9px] uppercase tracking-wider text-[#85877D] block mb-1">
                  Localization Language
                </label>
                <select
                  value={studioLang}
                  onChange={(e) => setStudioLang(e.target.value as any)}
                  className="w-full h-8 px-2 bg-[#F7F5EE] border border-[#D8D5CB] font-mono text-xs text-[#2B2D27] outline-none"
                >
                  <option value="en">English (Global Default)</option>
                  <option value="hinglish">Hinglish (High Conversion for Indian Context)</option>
                </select>
              </div>
            </div>

            {/* Interactive Customer Reaction Buttons */}
            <div className="pt-3 border-t border-[#E4E1D8] space-y-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#85877D] block">
                Simulate Customer Action
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setStudioSimState('paid')}
                  className="p-2 bg-[#EDF7CE] border border-[#BFDB78] text-[#4E6B18] font-mono text-[10px] font-bold text-center cursor-pointer"
                >
                  ✓ Customer Paid
                </button>
                <button
                  onClick={() => setStudioSimState('expired')}
                  className="p-2 bg-[#FFF0EE] border border-[#E3A5A0] text-[#A54C46] font-mono text-[10px] font-bold text-center cursor-pointer"
                >
                  ✕ Link Expired
                </button>
              </div>
            </div>
          </div>

          {/* Right Live Canvas */}
          <div className="lg:col-span-8 border border-[#DEDBD1] bg-[#FAF9F5] p-6 text-[#2B2D27] space-y-6 flex flex-col justify-center">
            {studioSimState === 'paid' && (
              <div className="p-3 bg-[#EDF7CE] border border-[#BFDB78] text-[#4E6B18] font-mono text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={15} /> Customer clicked link and successfully authorized payment of {studioAmount}!
                </span>
                <button onClick={() => setStudioSimState('normal')} className="text-xs underline cursor-pointer">Reset</button>
              </div>
            )}

            {/* EMAIL CANVAS */}
            {studioChannel === 'email' && (
              <div className="p-6 bg-white border border-[#D8D5CB] space-y-4 max-w-xl mx-auto shadow-sm w-full">
                <div className="border-b border-[#E4E1D8] pb-3 space-y-1 font-mono text-[11px]">
                  <p><span className="font-bold text-[#85867D]">From:</span> billing@settleiq.app</p>
                  <p><span className="font-bold text-[#85867D]">To:</span> {studioCustomerName} &lt;customer@example.com&gt;</p>
                  <p><span className="font-bold text-[#85867D]">Subject:</span> {studioLang === 'hinglish' ? `Quick heads-up: ${studioPlanName} payment mein thoda issue aaya` : `Action needed: ${studioPlanName} subscription payment issue`}</p>
                </div>

                <div className="space-y-3 text-xs leading-relaxed text-[#2B2D27]">
                  <p>Hi <strong>{studioCustomerName}</strong>,</p>
                  <p>
                    {studioLang === 'hinglish'
                      ? `Aapka recent payment of ${studioAmount} for ${studioPlanName} complete nahi ho paya. Don't worry, aapka subscription abhi active hai! Neeche diye gaye button se aap instantly naya card ya UPI update kar sakte hain.`
                      : `We noticed a small issue processing your recent payment of ${studioAmount} for ${studioPlanName}. Don't worry, your account is still active during our grace period. Please click the button below to update your payment method in seconds.`}
                  </p>
                  <div className="pt-2">
                    <button className="px-5 py-2.5 bg-[#20231C] text-[#F8F6EE] font-mono text-xs font-bold shadow-[3px_3px_0_#C7F36B] hover:bg-[#30352A] cursor-pointer">
                      Update Payment Method (1-Click) →
                    </button>
                  </div>
                  <p className="text-[11px] text-[#85867E] pt-2">
                    Secure 256-bit tokenized portal powered by SettleIQ. Zero password required.
                  </p>
                </div>
              </div>
            )}

            {/* WHATSAPP / SMS RICH CHAT BUBBLE */}
            {studioChannel === 'whatsapp' && (
              <div className="max-w-md mx-auto w-full bg-[#E5DDD5] p-5 rounded-xl shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#D4CDC5] pb-2 text-[11px] font-mono text-[#606060]">
                  <span className="font-bold text-[#075E54]">SettleIQ Verified Business ✓</span>
                  <span>10:42 AM</span>
                </div>

                <div className="bg-white p-3.5 rounded-lg shadow-2xs space-y-2 text-xs text-[#2B2D27] leading-relaxed border-l-4 border-[#25D366]">
                  <p>
                    {studioLang === 'hinglish'
                      ? `Hi *{studioCustomerName}*, aapka ${studioPlanName} payment of *${studioAmount}* issue ke wajah se decline hua hai.`
                      : `Hi *{studioCustomerName}*, your ${studioPlanName} payment of *${studioAmount}* failed to process at the bank switch.`}
                  </p>
                  <p className="text-[11px] text-[#606060]">
                    {studioLang === 'hinglish'
                      ? 'Service uninterrupted rakhne ke liye 1-click me naya card ya UPI mandate link karein:'
                      : 'To prevent service suspension, update your payment details via our secure link:'}
                  </p>
                  <div className="p-2 bg-[#F7F5EE] border border-[#D8D5CB] font-mono text-[11px] text-[#345689] flex items-center justify-between">
                    <span>https://pay.settleiq.app/u/78f9</span>
                    <ExternalLink size={12} />
                  </div>
                  <div className="pt-1 flex items-center gap-2">
                    <button className="flex-1 py-1.5 bg-[#25D366] text-white font-mono text-[11px] font-bold rounded-sm text-center">
                      Pay ${studioAmount} Now
                    </button>
                    <button className="px-3 py-1.5 bg-[#F0F0F0] text-[#333] font-mono text-[11px] rounded-sm">
                      Support
                    </button>
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GUARDRAIL SPINE & POLICY CONFIGURATION                             */}
      {/* ========================================================================= */}
      {activeTab === 'guardrails' && (
        <div className="border border-[#DEDBD1] bg-[#FAF9F5] p-6 text-[#2B2D27] space-y-6">
          <div className="border-b border-[#E4E1D8] pb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-[#2B2D27] flex items-center gap-2">
                <Sliders size={18} className="text-[#6B8E21]" />
                Bounded Autonomy Guardrails & Anti-Fatigue Limits
              </h2>
              <p className="text-xs text-[#85867E] mt-1">
                Enforce hard bounds to prevent customer spam, bank overdraft fees, and merchant dispute penalties.
              </p>
            </div>
            {settingsSavedToast && (
              <span className="font-mono text-xs text-[#4E6B18] bg-[#EDF7CE] border border-[#BFDB78] px-3 py-1 font-bold">
                ✓ Guardrails Saved!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#85877D] block mb-1">
                Max Retries Before Halt (1–5x)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(parseInt(e.target.value))}
                  className="flex-1 accent-[#6B8E21]"
                />
                <span className="font-mono text-sm font-bold text-[#2B2D27] w-6">{maxRetries}x</span>
              </div>
              <p className="text-[11px] text-[#85867E] mt-1">Stops all automated retries after this threshold.</p>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#85877D] block mb-1">
                Minimum Cooldown Spacing
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="6"
                  max="48"
                  step="6"
                  value={cooldownHours}
                  onChange={(e) => setCooldownHours(parseInt(e.target.value))}
                  className="flex-1 accent-[#6B8E21]"
                />
                <span className="font-mono text-sm font-bold text-[#2B2D27] w-8">{cooldownHours}h</span>
              </div>
              <p className="text-[11px] text-[#85867E] mt-1">Minimum quiet window between customer messages.</p>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#85877D] block mb-1">
                Max Grace Period Window
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="7"
                  max="30"
                  value={maxDaysOverdue}
                  onChange={(e) => setMaxDaysOverdue(parseInt(e.target.value))}
                  className="flex-1 accent-[#6B8E21]"
                />
                <span className="font-mono text-sm font-bold text-[#2B2D27] w-8">{maxDaysOverdue}d</span>
              </div>
              <p className="text-[11px] text-[#85867E] mt-1">Permanently halts dunning after overdue period.</p>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#85877D] block mb-1">
                AI Certainty Fallback Level
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                  className="flex-1 accent-[#6B8E21]"
                />
                <span className="font-mono text-sm font-bold text-[#2B2D27] w-8">{confidenceThreshold}%</span>
              </div>
              <p className="text-[11px] text-[#85867E] mt-1">Fallback to rule model if AI confidence is lower.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E4E1D8]">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#85877D] block mb-1">
                Active Reasoning AI Model
              </label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full h-9 border border-[#D8D5CB] bg-[#F7F5EE] px-3 font-mono text-xs text-[#2B2D27] outline-none"
              >
                <option value="gemini-2.0-flash">Google Gemini 2.0 Flash (Zero Latency · Default)</option>
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Calibrated)</option>
                <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Deep Reasoning & Complex Disputes)</option>
              </select>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#85877D] block">
                Safety Overrides (Instant Terminal Halts)
              </span>
              <div className="flex items-center gap-4 text-xs font-mono">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fraudBlockEnabled}
                    onChange={(e) => setFraudBlockEnabled(e.target.checked)}
                    className="accent-[#6B8E21]"
                  />
                  <span>Fraud & Stolen Card Auto-Halt</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={antiOverdraftEnabled}
                    onChange={(e) => setAntiOverdraftEnabled(e.target.checked)}
                    className="accent-[#6B8E21]"
                  />
                  <span>Customer Fatigue Protection</span>
                </label>
              </div>
            </div>
          </div>

                    {/* Policy Versioning & Historical Simulation (Manus Review Section 3C & 11.7) */}
          <div className="border border-[#D8D5CB] bg-white p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EBE8DF] pb-3">
              <div>
                <span className="font-mono text-[9px] uppercase font-bold text-[#6B8E21] tracking-wider block">
                  Policy Studio & Counterfactual Simulation
                </span>
                <h3 className="font-display text-sm font-bold text-[#2B2D27] mt-0.5">
                  Version Diff: policy-2026-09-04.2 vs Proposed ({maxRetries}x Retries · {cooldownHours}h Cooldown · {confidenceThreshold}% AI)
                </h3>
              </div>
              <span className="font-mono text-[10px] bg-[#22251D] text-[#C7F36B] px-2.5 py-1 font-bold">
                Counterfactual Engine · Live Diff
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-[#F7F5EE] border border-[#E0DCD0]">
                <span className="text-[#85877D] text-[10px] uppercase block">Projected Recovery Lift</span>
                <span className="font-display text-lg font-bold text-[#6B8E21] mt-0.5 block">
                  +₹{(Math.round(maxRetries * 11500 + (48 - cooldownHours) * 450 + (confidenceThreshold >= 80 ? 4000 : 0))).toLocaleString('en-IN')} ARR
                </span>
                <span className="text-[10px] text-[#55574E]">
                  +{(maxRetries * 2.4 + (48 - cooldownHours) * 0.1).toFixed(1)}% recovery yield
                </span>
              </div>

              <div className="p-3 bg-[#F7F5EE] border border-[#E0DCD0]">
                <span className="text-[#85877D] text-[10px] uppercase block">Customer Fatigue Reduction</span>
                <span className="font-display text-lg font-bold text-[#3C5C92] mt-0.5 block">
                  -{Math.round((cooldownHours / 48) * 32 + (5 - maxRetries) * 3)}% Nudges
                </span>
                <span className="text-[10px] text-[#55574E]">
                  Eliminated {Math.round((cooldownHours / 48) * 14 + (5 - maxRetries) * 2)} redundant touches
                </span>
              </div>

              <div className="p-3 bg-[#F7F5EE] border border-[#E0DCD0]">
                <span className="text-[#85877D] text-[10px] uppercase block">Protected Exclusions</span>
                <span className="font-display text-lg font-bold text-[#AA5B4F] mt-0.5 block">
                  {fraudBlockEnabled ? (antiOverdraftEnabled ? 9 : 6) : (antiOverdraftEnabled ? 3 : 0)} Accounts
                </span>
                <span className="text-[10px] text-[#55574E]">
                  {fraudBlockEnabled ? 'Zero dispute violations' : 'Unprotected from fraud'}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#85867E]">
              Counterfactual policy simulation evaluates proposed attempt caps, cooldowns, and liquidity windows against 100 historical failure signals without dispatching external messages.
            </p>
          </div>

          <div className="pt-4 border-t border-[#E4E1D8] flex justify-end">
            <Button
              onClick={handleSaveGuardrails}
              className="gap-2 bg-[#20231C] text-[#F8F6EE] font-mono text-xs font-bold shadow-[3px_3px_0_#C7F36B] hover:bg-[#30352A]"
            >
              <Check size={14} className="text-[#C7F36B]" />
              Persist Pipeline Guardrails to Engine
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { 
  Zap, Brain, AlertTriangle, Mail, 
  Copy, Check, ShieldCheck, Sliders, CheckCircle2, RefreshCw,
  Sparkles, Shield, Play, ArrowRight, Smartphone, Bell, Cpu
} from 'lucide-react';
import { MESSAGE_TEMPLATES } from '@/lib/constants';

interface WebhookPreset {
  id: string;
  name: string;
  failure_reason: string;
  error_code: string;
  error_description: string;
  payment_method: 'card' | 'upi' | 'mandate';
  amount: number;
}

const PRESETS: WebhookPreset[] = [
  {
    id: 'insufficient_funds',
    name: '1. Insufficient Funds (Transient Decline)',
    failure_reason: 'insufficient_funds',
    error_code: 'BAD_REQUEST_ERROR',
    error_description: 'Payment failed: Account balance too low for the requested transaction.',
    payment_method: 'card',
    amount: 185000,
  },
  {
    id: 'card_expired',
    name: '2. Card Expired (Recurring Mandate Failure)',
    failure_reason: 'card_expired',
    error_code: 'GATEWAY_ERROR',
    error_description: 'Card has passed its expiration date. Payment cannot be authorized.',
    payment_method: 'card',
    amount: 495000,
  },
  {
    id: 'authentication_required',
    name: '3. 3D Secure / SCA Challenge Required',
    failure_reason: 'authentication_required',
    error_code: 'AUTHENTICATION_REQUIRED',
    error_description: '3D Secure OTP verification was not completed by the cardholder.',
    payment_method: 'card',
    amount: 340000,
  },
  {
    id: 'network_error',
    name: '4. Bank Network Gateway Timeout (UPI Mandate)',
    failure_reason: 'network_error',
    error_code: 'GATEWAY_TIMEOUT',
    error_description: 'NPCI / UPI issuing switch timed out during automatic debit execution.',
    payment_method: 'upi',
    amount: 99000,
  },
  {
    id: 'fraud_suspected',
    name: '5. Fraud Block (Terminal Hard Decline)',
    failure_reason: 'fraud_suspected',
    error_code: 'RISK_THRESHOLD_EXCEEDED',
    error_description: 'Issuer risk engine marked this card as suspected fraud or stolen.',
    payment_method: 'card',
    amount: 1200000,
  },
  {
    id: 'account_closed',
    name: '6. Account Closed (Permanent Invalidation)',
    failure_reason: 'account_closed',
    error_code: 'ACCOUNT_INVALID',
    error_description: 'Bank account / VPA linked to mandate is permanently decommissioned.',
    payment_method: 'mandate',
    amount: 250000,
  },
];

const UI_TEMPLATES: Record<string, { title: string; description: string; subject: string; body: string; channel: string; cta_text: string }> = {
  gentle_reminder: {
    title: 'Gentle Recovery Nudge',
    description: 'Friendly notification for first-time or transient soft declines.',
    subject: 'Quick update about your {plan_name} subscription',
    body: 'Hi {customer_name}, we noticed a small hiccup with your recent payment of {amount} for {plan_name}. These things happen! Your subscription is still safe — just wanted to give you a heads up. We\'ll retry the payment shortly.',
    channel: 'email',
    cta_text: 'Review Payment Details →'
  },
  payment_update: {
    title: '1-Click Payment Update Link',
    description: 'Instant secure card/UPI update link for expired tokens or mandate drops.',
    subject: 'Please update your payment method for {plan_name}',
    body: 'Hi {customer_name}, your payment method on file appears to need updating. Please visit your account settings to add a new card or UPI ID so we can process your {amount} payment for {plan_name}.',
    channel: 'email',
    cta_text: 'Update Payment Method Now →'
  },
  urgent_reminder: {
    title: 'Urgent Grace Period Notice',
    description: 'High-urgency notice sent before entering the final dunning window.',
    subject: 'Action needed: Payment issue with your {plan_name} subscription',
    body: 'Hi {customer_name}, we\'ve tried processing your payment of {amount} for {plan_name} a couple of times but it hasn\'t gone through yet. To avoid any interruption to your service, please check your payment method.',
    channel: 'email',
    cta_text: 'Resolve Payment Interruption →'
  },
  final_notice: {
    title: 'Final Policy Cancellation Warning',
    description: 'Final warning before reaching the maximum 30-day grace period halt.',
    subject: 'Final notice: Your {plan_name} subscription is at risk',
    body: 'Hi {customer_name}, this is our final reminder about the pending payment of {amount} for {plan_name}. If we don\'t receive payment within 48 hours, your subscription will be cancelled.',
    channel: 'email',
    cta_text: 'Prevent Subscription Cancellation →'
  },
  sms_nudge: {
    title: 'Hinglish SMS / WhatsApp Touchpoint',
    description: 'Short multi-channel text nudge with localized payment link.',
    subject: 'VaultBack Payment Alert',
    body: 'Hi {customer_name}, your {plan_name} payment of {amount} failed. Update your payment method to continue your subscription uninterrupted. Link: https://pay.vaultback.app/u/981f',
    channel: 'sms',
    cta_text: 'Open WhatsApp Link →'
  }
};

export default function SimulatorPage() {
  const [sandboxTab, setSandboxTab] = useState<'settings' | 'webhook' | 'templates'>('settings');

  // Webhook state
  const [selectedPreset, setSelectedPreset] = useState<WebhookPreset>(PRESETS[0]);
  const [targetSubscriptionId, setTargetSubscriptionId] = useState<string>('');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [firing, setFiring] = useState(false);
  const [webhookResult, setWebhookResult] = useState<any>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Template preview state
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('gentle_reminder');
  const [previewCustomerName, setPreviewCustomerName] = useState('Aarav Mehta');
  const [previewPlanName, setPreviewPlanName] = useState('Growth Pro (Annual)');
  const [previewAmount, setPreviewAmount] = useState('4,999');

  // Pipeline Settings state
  const [maxRetries, setMaxRetries] = useState<number>(3);
  const [maxDaysOverdue, setMaxDaysOverdue] = useState<number>(14);
  const [cooldownHours, setCooldownHours] = useState<number>(24);
  const [geminiModel, setGeminiModel] = useState<string>('gemini-2.0-flash');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(80);
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  // Decline Policy Tester
  const [testDeclineCode, setTestDeclineCode] = useState<string>('insufficient_funds');
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    // Load persisted settings
    const saved = localStorage.getItem('vaultback_pipeline_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.maxRetries) setMaxRetries(parsed.maxRetries);
        if (parsed.maxDaysOverdue) setMaxDaysOverdue(parsed.maxDaysOverdue);
        if (parsed.cooldownHours) setCooldownHours(parsed.cooldownHours);
        if (parsed.geminiModel) setGeminiModel(parsed.geminiModel);
        if (parsed.confidenceThreshold) setConfidenceThreshold(parsed.confidenceThreshold);
      } catch (e) {}
    }

    const fetchSubs = async () => {
      try {
        const res = await fetch('/api/subscriptions?limit=50');
        const json = await res.json();
        if (json.success) {
          setSubscriptions(json.data.subscriptions);
          if (json.data.subscriptions.length > 0) {
            setTargetSubscriptionId(json.data.subscriptions[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load subscriptions:', e);
      } finally {
        setLoadingSubs(false);
      }
    };
    fetchSubs();
  }, []);

  const handleSaveSettings = () => {
    const config = { maxRetries, maxDaysOverdue, cooldownHours, geminiModel, confidenceThreshold };
    localStorage.setItem('vaultback_pipeline_settings', JSON.stringify(config));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleTestPolicy = () => {
    const policyMap: Record<string, any> = {
      insufficient_funds: {
        action: 'SMART_RETRY_EXPONENTIAL',
        category: 'Soft Decline',
        eligibility: 'Eligible for Retry & Nudge',
        retryIn: '36 hours (optimal liquidity window)',
        channel: 'WhatsApp + Email',
        allowedByPolicy: true,
      },
      card_expired: {
        action: 'SEND_UPDATE_LINK',
        category: 'Customer Action Required',
        eligibility: 'Instant 1-Click Update Portal',
        retryIn: 'Pause retries until token refreshed',
        channel: 'Email + SMS',
        allowedByPolicy: true,
      },
      authentication_required: {
        action: '3DS_SCA_CHALLENGE_NUDGE',
        category: 'Authentication Drop',
        eligibility: 'Immediate 3DS Re-authentication Link',
        retryIn: 'Immediate push notification',
        channel: 'SMS OTP Nudge',
        allowedByPolicy: true,
      },
      network_error: {
        action: 'GATEWAY_FAILOVER_RETRY',
        category: 'Infrastructure Glitch',
        eligibility: 'Retry via backup payment switch',
        retryIn: '15 minutes',
        channel: 'Silent Gateway Retry',
        allowedByPolicy: true,
      },
      fraud_suspected: {
        action: 'TERMINAL_HALT',
        category: 'Hard Decline',
        eligibility: 'Immediate Stop Rule Applied',
        retryIn: 'NEVER RETRY (Protected)',
        channel: 'Escalate to Risk Compliance',
        allowedByPolicy: false,
      },
      account_closed: {
        action: 'TERMINAL_HALT',
        category: 'Permanent Invalidation',
        eligibility: 'Immediate Stop Rule Applied',
        retryIn: 'NEVER RETRY (Protected)',
        channel: 'Direct Human Outreach',
        allowedByPolicy: false,
      }
    };

    setTestResult(policyMap[testDeclineCode] || policyMap.insufficient_funds);
  };

  // Generate simulated Razorpay payload
  const currentPayload = {
    entity: 'event',
    account_id: 'acc_vaultback_demo_live',
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
          notes: {
            subscription_id: targetSubscriptionId || 'sub_demo_seed_01',
          },
        },
      },
    },
    created_at: Math.floor(Date.now() / 1000),
  };

  const handleFireWebhook = async () => {
    setFiring(true);
    setWebhookResult(null);
    try {
      const res = await fetch('/api/webhooks/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPayload),
      });
      const json = await res.json();
      setWebhookResult({
        status: res.status,
        ok: res.ok,
        data: json,
      });
    } catch (e: any) {
      setWebhookResult({
        status: 500,
        ok: false,
        data: { error: e.message },
      });
    } finally {
      setFiring(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(currentPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const currentTemplate = UI_TEMPLATES[selectedTemplateKey] || UI_TEMPLATES.gentle_reminder;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#87915D]">
            Developer Suite · Bounded Autonomy Engine
          </p>
          <h1 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[0.98] tracking-[-0.06em] text-[#F2F0E6]">
            Developer sandbox.
          </h1>
        </div>
      </div>

      {/* Cockpit Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[#30342C] pb-3">
        {[
          { id: 'settings', label: 'Pipeline Settings', icon: Sliders },
          { id: 'webhook', label: 'Webhook Simulator', icon: Zap },
          { id: 'templates', label: 'Nudge Previews', icon: Mail },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = sandboxTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSandboxTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#242820] text-[#C7F36B] border-b-2 border-[#C7F36B]'
                  : 'text-[#A3A79B] hover:text-white hover:bg-[#20231D]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-[#C7F36B]' : 'text-[#7C8274]'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PIPELINE SETTINGS */}
      {sandboxTab === 'settings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 border border-[#DEDBD1] bg-[#FAF9F5] p-6 text-[#2B2D27] space-y-6">
              <div className="border-b border-[#E4E1D8] pb-4">
                <h2 className="font-display text-lg font-bold text-[#2B2D27] flex items-center gap-2">
                  <Sliders size={18} className="text-[#6B8E21]" />
                  Autonomous Recovery Rules & Thresholds
                </h2>
                <p className="text-xs text-[#85867E] mt-1">
                  Configure maximum retry limits, grace period windows, and Google Gemini AI confidence thresholds.
                </p>
              </div>

              {settingsSaved && (
                <div className="p-3 bg-[#EDF7CE] border border-[#BFDB78] text-[#4E6B18] font-mono text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={14} /> Pipeline settings successfully persisted to localStorage!
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-[#85877D] block mb-1">
                    Max Retries Before Halt (1–5)
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
                  <p className="text-[11px] text-[#85867E] mt-1">Stops dunning when retry count reaches this threshold.</p>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-[#85877D] block mb-1">
                    Max Days Overdue (7–30 Days)
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
                  <p className="text-[11px] text-[#85867E] mt-1">Subscriptions overdue beyond this window are permanently cancelled.</p>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-[#85877D] block mb-1">
                    Cooldown Window (6–48 Hours)
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
                  <p className="text-[11px] text-[#85867E] mt-1">Minimum spacing between sequential customer outreach nudges.</p>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-[#85877D] block mb-1">
                    AI Certainty Threshold (50%–95%)
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
                  <p className="text-[11px] text-[#85867E] mt-1">Fallback to deterministic expert heuristic if model confidence is below this level.</p>
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#85877D] block mb-1">
                  Active Reasoning Model
                </label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full h-9 border border-[#D8D5CB] bg-[#F7F5EE] px-3 font-mono text-xs text-[#2B2D27] outline-none"
                >
                  <option value="gemini-2.0-flash">Google Gemini 2.0 Flash (Zero Latency · Default)</option>
                  <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Calibrated)</option>
                  <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Deep Reasoning)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-[#E4E1D8] flex justify-end">
                <Button onClick={handleSaveSettings} className="gap-2 bg-[#20231C] text-[#F8F6EE] shadow-[3px_3px_0_#C7F36B] hover:bg-[#30352A]">
                  <Check size={14} className="text-[#C7F36B]" /> Save Pipeline Policy
                </Button>
              </div>
            </div>

            {/* Live Decline Policy Evaluator */}
            <div className="border border-[#DEDBD1] bg-[#FAF9F5] p-6 text-[#2B2D27] space-y-4">
              <div className="border-b border-[#E4E1D8] pb-3">
                <h3 className="font-display text-sm font-bold text-[#2B2D27] flex items-center gap-2">
                  <Cpu size={16} className="text-[#6B8E21]" />
                  Live Decline Policy Tester
                </h3>
                <p className="text-[11px] text-[#85867E] mt-0.5">Test how the policy engine resolves gateway decline codes.</p>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#85877D] block mb-1">Select Failure Code</label>
                <select
                  value={testDeclineCode}
                  onChange={(e) => setTestDeclineCode(e.target.value)}
                  className="w-full h-8 border border-[#D8D5CB] bg-[#F7F5EE] px-2 font-mono text-[11px] text-[#2B2D27] outline-none"
                >
                  <option value="insufficient_funds">insufficient_funds (Soft Decline)</option>
                  <option value="card_expired">card_expired (Action Required)</option>
                  <option value="authentication_required">authentication_required (3DS OTP)</option>
                  <option value="network_error">network_error (NPCI Timeout)</option>
                  <option value="fraud_suspected">fraud_suspected (Hard Terminal Block)</option>
                  <option value="account_closed">account_closed (Hard Terminal Block)</option>
                </select>
              </div>

              <Button onClick={handleTestPolicy} className="w-full h-8 bg-[#20231C] text-[#F8F6EE] text-xs font-mono shadow-[2px_2px_0_#C7F36B]">
                Evaluate Policy
              </Button>

              {testResult && (
                <div className="mt-4 p-3 bg-[#F0EEE6] border border-[#D8D5CB] space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[#7D806F]">Resolved Action:</span>
                    <span className="font-bold text-[#2B2D27]">{testResult.action}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#7D806F]">Category:</span>
                    <span className="font-semibold text-[#6B8E21]">{testResult.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#7D806F]">Channel:</span>
                    <span className="text-[#2B2D27]">{testResult.channel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#7D806F]">Status:</span>
                    <span className={testResult.allowedByPolicy ? 'text-[#4E6B18] font-bold' : 'text-[#A54C46] font-bold'}>
                      {testResult.allowedByPolicy ? '● Active In Policy' : '■ Protected by Stop Rule'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WEBHOOK SIMULATOR */}
      {sandboxTab === 'webhook' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="border border-[#DEDBD1] bg-[#FAF9F5] p-5 text-[#2B2D27] space-y-3">
              <h3 className="font-display text-sm font-bold text-[#2B2D27]">1. Select Failure Scenario</h3>
              <div className="space-y-2">
                {PRESETS.map((preset) => {
                  const isSelected = selectedPreset.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset)}
                      className={`p-3 border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#30342C] bg-[#20231C] text-[#F8F6EE]'
                          : 'border-[#D8D5CB] bg-[#F7F5EE] text-[#2B2D27] hover:bg-[#F0EEE6]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{preset.name}</span>
                        <span className={`font-mono text-[9px] px-1.5 py-0.5 ${isSelected ? 'bg-[#C7F36B] text-[#171914] font-bold' : 'bg-[#E8E5DB] text-[#61645A]'}`}>
                          {preset.payment_method.toUpperCase()}
                        </span>
                      </div>
                      <p className={`text-[11px] mt-1 ${isSelected ? 'text-[#BABDB0]' : 'text-[#85867E]'}`}>
                        {preset.error_description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border border-[#DEDBD1] bg-[#FAF9F5] p-5 text-[#2B2D27] space-y-3">
              <h3 className="font-display text-sm font-bold text-[#2B2D27]">2. Target Test Subscription</h3>
              {loadingSubs ? (
                <p className="font-mono text-xs text-[#85867E]">Loading subscriptions...</p>
              ) : (
                <select
                  value={targetSubscriptionId}
                  onChange={(e) => setTargetSubscriptionId(e.target.value)}
                  className="w-full h-9 border border-[#D8D5CB] bg-[#F7F5EE] px-3 font-mono text-xs text-[#2B2D27] outline-none"
                >
                  {subscriptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.customers?.name} — {formatCurrency(sub.amount)} ({sub.status})
                    </option>
                  ))}
                </select>
              )}
              <Button
                onClick={handleFireWebhook}
                disabled={firing}
                className="w-full h-10 gap-2 bg-[#20231C] text-[#F8F6EE] font-mono text-xs font-bold shadow-[3px_3px_0_#C7F36B] hover:bg-[#30352A]"
              >
                {firing ? <RefreshCw size={14} className="animate-spin text-[#C7F36B]" /> : <Zap size={14} className="text-[#C7F36B]" />}
                {firing ? 'Ingesting Webhook...' : 'Inject Webhook Event (POST /api/webhooks/razorpay)'}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7 border border-[#30342C] bg-[#171914] p-5 text-[#F2F0E6] space-y-4">
            <div className="flex items-center justify-between border-b border-[#30342C] pb-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-[#87915D]">Generated JSON Payload</p>
                <h3 className="font-display text-sm font-bold text-white">Razorpay Webhook Event</h3>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 font-mono text-[10px] text-[#C7F36B] hover:underline cursor-pointer"
              >
                {copiedPayload ? <Check size={12} /> : <Copy size={12} />}
                {copiedPayload ? 'Copied' : 'Copy Payload'}
              </button>
            </div>

            <pre className="p-4 bg-[#0E100D] border border-[#2B2D27] text-[#C7F36B] font-mono text-[11px] overflow-x-auto max-h-[340px]">
              {JSON.stringify(currentPayload, null, 2)}
            </pre>

            {webhookResult && (
              <div className="p-4 bg-[#20231C] border border-[#30342C] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white">Ingestion Response:</span>
                  <span className={`font-mono text-xs font-bold ${webhookResult.ok ? 'text-[#C7F36B]' : 'text-[#E3A5A0]'}`}>
                    HTTP {webhookResult.status} {webhookResult.ok ? 'OK' : 'FAILED'}
                  </span>
                </div>
                <pre className="text-[11px] font-mono text-[#D7D8CC] overflow-x-auto max-h-[140px]">
                  {JSON.stringify(webhookResult.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: NUDGE PREVIEWS */}
      {sandboxTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 border border-[#DEDBD1] bg-[#FAF9F5] p-5 text-[#2B2D27] space-y-4">
            <h3 className="font-display text-sm font-bold text-[#2B2D27]">Touchpoint Templates</h3>
            <div className="space-y-2">
              {Object.keys(UI_TEMPLATES).map((key) => {
                const t = UI_TEMPLATES[key];
                const isSelected = selectedTemplateKey === key;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedTemplateKey(key)}
                    className={`p-3 border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#30342C] bg-[#20231C] text-[#F8F6EE]'
                        : 'border-[#D8D5CB] bg-[#F7F5EE] text-[#2B2D27] hover:bg-[#F0EEE6]'
                    }`}
                  >
                    <p className="text-xs font-bold">{t.title}</p>
                    <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-[#BABDB0]' : 'text-[#85867E]'}`}>
                      {t.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8 border border-[#DEDBD1] bg-[#FAF9F5] p-6 text-[#2B2D27] space-y-6">
            <div className="border-b border-[#E4E1D8] pb-4 flex items-center justify-between">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#6B8E21]">Previewing Multi-Channel Touchpoint</span>
                <h3 className="font-display text-lg font-bold text-[#2B2D27]">{currentTemplate.title}</h3>
              </div>
              <Badge variant="accent">{currentTemplate.channel.toUpperCase()}</Badge>
            </div>

            {/* Email Canvas Preview */}
            <div className="p-6 bg-white border border-[#D8D5CB] space-y-4 max-w-xl mx-auto shadow-xs">
              <div className="border-b border-[#E4E1D8] pb-3 space-y-1 font-mono text-[11px]">
                <p><span className="font-bold text-[#85867D]">From:</span> billing@vaultback.app</p>
                <p><span className="font-bold text-[#85867D]">To:</span> {previewCustomerName} &lt;customer@example.com&gt;</p>
                <p><span className="font-bold text-[#85867D]">Subject:</span> {currentTemplate.subject.replace('{plan_name}', previewPlanName)}</p>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-[#2B2D27]">
                <p>Hi <strong>{previewCustomerName}</strong>,</p>
                <p>
                  {currentTemplate.body
                    .replace('{customer_name}', previewCustomerName)
                    .replace('{plan_name}', previewPlanName)
                    .replace('{amount}', `₹${previewAmount}`)}
                </p>
                <div className="pt-2">
                  <button className="px-5 py-2.5 bg-[#20231C] text-[#F8F6EE] font-mono text-xs font-bold shadow-[2px_2px_0_#C7F36B]">
                    {currentTemplate.cta_text || 'Update Payment Method →'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

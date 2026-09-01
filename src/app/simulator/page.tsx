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
  Zap, Send, Brain, ArrowRight, AlertTriangle, Radio, Mail, 
  Smartphone, Copy, Check, ShieldCheck, Shield, Activity, 
  MessageSquare, Settings, Presentation, Search, Layers, CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { STOPPING_RULES, RECOVERY_PROBABILITIES, NUDGE_RESPONSE_RATES, MESSAGE_TEMPLATES } from '@/lib/constants';

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
    error_description: 'Issuer bank server timed out while processing automated UPI debit.',
    payment_method: 'upi',
    amount: 960000,
  },
  {
    id: 'fraud_suspected',
    name: '5. High Risk / Fraud Flagged (Stopping Rule Trigger)',
    failure_reason: 'fraud_suspected',
    error_code: 'PAYMENT_RISK_CHECK_FAILED',
    error_description: 'Transaction triggered risk heuristics. Automated retries prohibited.',
    payment_method: 'card',
    amount: 12400000,
  },
  {
    id: 'account_closed',
    name: '6. Bank Account Closed / Revoked Mandate',
    failure_reason: 'account_closed',
    error_code: 'ACCOUNT_CLOSED',
    error_description: 'Account has been closed. Instant termination of recurring mandate.',
    payment_method: 'mandate',
    amount: 2850000,
  },
];

export default function DeveloperSandboxPage() {
  const [sandboxTab, setSandboxTab] = useState<'webhook' | 'templates' | 'guardrails' | 'demo'>('webhook');

  // Webhook Simulator State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('insufficient_funds');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [loadingSubs, setLoadingSubs] = useState<boolean>(true);
  const [firing, setFiring] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Template Preview State
  const [activeTemplateKey, setActiveTemplateKey] = useState<string>('gentle_reminder');
  const [customerName, setCustomerName] = useState<string>('Priya Sharma (FinTech OS)');
  const [planName, setPlanName] = useState<string>('Developer Pro');
  const [amount, setAmount] = useState<string>('₹1,850');
  const [copied, setCopied] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'email' | 'sms'>('email');

  const selectedPreset = PRESETS.find((p) => p.id === selectedPresetId) || PRESETS[0];

  useEffect(() => {
    async function loadSubs() {
      try {
        const res = await fetch('/api/subscriptions?limit=50');
        const json = await res.json();
        if (json.success && json.data.subscriptions?.length > 0) {
          setSubscriptions(json.data.subscriptions);
          setSelectedSubId(json.data.subscriptions[0].id);
        }
      } catch (err) {
        console.error('Failed to load subscriptions for simulator:', err);
      } finally {
        setLoadingSubs(false);
      }
    }
    loadSubs();
  }, []);

  const activeSub = subscriptions.find((s) => s.id === selectedSubId);

  const handleFireWebhook = async () => {
    if (!selectedSubId) {
      setErrorMsg('Please select a target subscription first.');
      return;
    }

    setFiring(true);
    setErrorMsg(null);
    setResult(null);

    const payload = {
      event: 'payment.failed',
      account_id: 'acc_coverup_live',
      contains: ['payment'],
      payload: {
        payment: {
          entity: {
            id: `pay_sim_${Date.now()}`,
            amount: activeSub?.amount || selectedPreset.amount,
            currency: 'INR',
            status: 'failed',
            order_id: `order_${selectedSubId.substring(0, 8)}`,
            method: selectedPreset.payment_method,
            error_code: selectedPreset.error_code,
            error_description: selectedPreset.error_description,
            error_source: 'gateway',
            error_step: 'payment_authorization',
            error_reason: selectedPreset.failure_reason,
            notes: {
              subscription_id: selectedSubId,
              customer_email: activeSub?.customers?.email || 'customer@example.com',
            },
          },
        },
      },
      created_at: Math.floor(Date.now() / 1000),
    };

    try {
      const res = await fetch('/api/webhooks/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setErrorMsg(data.error || 'Webhook failed to process');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error firing webhook');
    } finally {
      setFiring(false);
    }
  };

  const template = MESSAGE_TEMPLATES[activeTemplateKey as keyof typeof MESSAGE_TEMPLATES] || MESSAGE_TEMPLATES.gentle_reminder;

  const renderedSubject = 'subject' in template
    ? template.subject.replace(/{{plan_name}}/g, planName)
    : 'Subscription Update';

  const rawBody = 'body' in template ? template.body : '';
  const renderedBody = rawBody
    .replace(/{{customer_name}}/g, customerName)
    .replace(/{{amount}}/g, amount)
    .replace(/{{plan_name}}/g, planName);

  const handleCopy = () => {
    navigator.clipboard.writeText(renderedBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Developer & Recovery Sandbox</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Test real-time Razorpay webhook triggers, preview customer touchpoints, and inspect stopping rules
          </p>
        </div>

        {/* 4-Tab Hub Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setSandboxTab('webhook')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              sandboxTab === 'webhook' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="h-3.5 w-3.5" /> Webhook Simulator
          </button>
          <button
            onClick={() => setSandboxTab('templates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              sandboxTab === 'templates' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="h-3.5 w-3.5" /> Nudge Previews
          </button>
          <button
            onClick={() => setSandboxTab('guardrails')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              sandboxTab === 'guardrails' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="h-3.5 w-3.5" /> Guardrails & Rules
          </button>
          <button
            onClick={() => setSandboxTab('demo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              sandboxTab === 'demo' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Presentation className="h-3.5 w-3.5" /> Demo Guide
          </button>
        </div>
      </div>

      {/* TAB 1: WEBHOOK SIMULATOR */}
      {sandboxTab === 'webhook' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* Left Column: Preset & Target Selection */}
          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">1. Select Failure Scenario</CardTitle>
                <CardDescription>Simulate authentic Indian payment decline codes</CardDescription>
              </CardHeader>
              <CardContent className="pt-3 space-y-2">
                {PRESETS.map((preset) => {
                  const isSelected = preset.id === selectedPresetId;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900">{preset.name}</span>
                        <Badge variant={isSelected ? 'info' : 'outline'} className="text-[9px]">
                          {preset.failure_reason}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{preset.error_description}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">2. Target Subscription</CardTitle>
                <CardDescription>Select customer account to target</CardDescription>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                {loadingSubs ? (
                  <Skeleton className="h-9 w-full rounded-lg" />
                ) : subscriptions.length === 0 ? (
                  <div className="p-3 rounded-lg bg-amber-50 text-amber-800 text-xs flex items-center gap-2 border border-amber-200">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>No subscriptions found. Click &quot;Seed Data&quot; on Dashboard first.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Customer & Plan</label>
                      <Select
                        value={selectedSubId}
                        onChange={(e) => setSelectedSubId(e.target.value)}
                      >
                        {subscriptions.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.customers?.name || 'Customer'} — {sub.plan_name} ({formatCurrency(sub.amount)})
                          </option>
                        ))}
                      </Select>
                    </div>

                    {activeSub && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Current Status:</span>
                          <Badge variant="outline" className="text-[10px] capitalize">{activeSub.status}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Customer Email:</span>
                          <span className="font-mono text-slate-800 text-[11px]">{activeSub.customers?.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Billing Amount:</span>
                          <span className="font-bold text-slate-900">{formatCurrency(activeSub.amount)}</span>
                        </div>
                      </div>
                    )}

                    <Button
                      variant="default"
                      className="w-full gap-2"
                      onClick={handleFireWebhook}
                      loading={firing}
                    >
                      <Send className="h-4 w-4" /> Simulate Webhook Trigger
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Payload & Execution Outcome */}
          <div className="lg:col-span-7 space-y-4">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">3. JSON Webhook Payload</CardTitle>
                <CardDescription>Live simulated Razorpay payment.failed payload</CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <pre className="p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-800">
                  {JSON.stringify(
                    {
                      event: 'payment.failed',
                      payload: {
                        payment: {
                          entity: {
                            id: 'pay_sim_live_test',
                            amount: activeSub?.amount || selectedPreset.amount,
                            currency: 'INR',
                            status: 'failed',
                            method: selectedPreset.payment_method,
                            error_code: selectedPreset.error_code,
                            error_description: selectedPreset.error_description,
                            error_reason: selectedPreset.failure_reason,
                            notes: {
                              subscription_id: selectedSubId || 'sub_demo_id',
                              customer_email: activeSub?.customers?.email || 'customer@example.com',
                            },
                          },
                        },
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </CardContent>
            </Card>

            {errorMsg && (
              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-800">
                {errorMsg}
              </div>
            )}

            {result && (
              <Card className="border-blue-200 bg-blue-50/20 shadow-xs animate-in fade-in duration-200">
                <CardHeader className="pb-3 border-b border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-sm font-bold text-blue-950">
                        Autonomous Decision Result
                      </CardTitle>
                    </div>
                    <Badge variant={result.action_executed?.outcome === 'success' ? 'success' : 'warning'}>
                      {result.action_executed?.outcome}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-blue-100 space-y-1">
                    <p className="font-bold text-blue-950">AI Strategic Reasoning:</p>
                    <p className="text-slate-700 leading-relaxed">{result.action_executed?.ai_reasoning}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                      <p className="text-slate-400 text-[10px]">Action</p>
                      <p className="font-bold text-slate-900 mt-0.5 truncate">{result.action_executed?.action_type}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                      <p className="text-slate-400 text-[10px]">Confidence</p>
                      <p className="font-bold text-blue-600 mt-0.5">{Math.round((result.action_executed?.ai_confidence || 0) * 100)}%</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                      <p className="text-slate-400 text-[10px]">Outcome</p>
                      <p className="font-bold text-emerald-700 mt-0.5 capitalize">{result.action_executed?.outcome}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
                      <p className="text-slate-400 text-[10px]">Recovered</p>
                      <p className="font-bold text-emerald-700 mt-0.5">{formatCurrency(result.action_executed?.amount_recovered || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: NUDGE PREVIEWS */}
      {sandboxTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">Select Template Strategy</CardTitle>
                <CardDescription>Multi-channel recovery messaging</CardDescription>
              </CardHeader>
              <CardContent className="pt-3 space-y-2">
                {Object.entries(MESSAGE_TEMPLATES).map(([key, t]) => {
                  const isSelected = key === activeTemplateKey;
                  const isSms = key === 'sms_nudge';

                  return (
                    <div
                      key={key}
                      onClick={() => {
                        setActiveTemplateKey(key);
                        if (isSms) setPreviewMode('sms');
                        else setPreviewMode('email');
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isSms ? (
                            <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                          ) : (
                            <Mail className="h-3.5 w-3.5 text-blue-600" />
                          )}
                          <span className="font-semibold text-xs text-slate-900 capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <Badge variant={isSelected ? 'info' : 'outline'} className="text-[9px]">
                          {isSms ? 'SMS' : 'Email'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">Dynamic Injected Variables</CardTitle>
                <CardDescription>Live personalization parameters</CardDescription>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Customer Name</label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Plan Name</label>
                  <Input value={planName} onChange={(e) => setPlanName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Pending Amount</label>
                  <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={handleCopy}>
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied to Clipboard' : 'Copy Rendered Message'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7">
            {previewMode === 'email' ? (
              <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-medium text-slate-500 ml-2">Inbox — CoverUP AI Dunning</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-white">HTML Email</Badge>
                </div>

                <div className="p-5 border-b border-slate-100 bg-white space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">From:</span>
                    <span className="font-semibold text-slate-800">CoverUP Billing &lt;billing@coverup.app&gt;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">To:</span>
                    <span className="text-slate-700">{customerName} &lt;customer@example.com&gt;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Subject:</span>
                    <span className="font-bold text-slate-900">{renderedSubject}</span>
                  </div>
                </div>

                <div className="p-6 bg-white space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-2xs">
                      CU
                    </div>
                    <span className="font-bold text-sm text-slate-900">CoverUP Payment Portal</span>
                  </div>

                  <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {renderedBody}
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-medium text-slate-500">Subscription Plan</p>
                        <p className="text-sm font-bold text-slate-900">{planName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-medium text-slate-500">Pending Amount</p>
                        <p className="text-lg font-bold text-blue-600">{amount}</p>
                      </div>
                    </div>

                    <a
                      href="#pay"
                      onClick={(e) => e.preventDefault()}
                      className="block w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-center text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                    >
                      Update Payment Method / Pay Now
                    </a>

                    <p className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      256-bit encrypted checkout powered by Razorpay Subscriptions
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-sm mx-auto">
                <div className="rounded-[36px] border-8 border-slate-900 bg-slate-900 shadow-xl p-2.5 overflow-hidden">
                  <div className="rounded-[24px] bg-slate-100 overflow-hidden flex flex-col h-[480px]">
                    <div className="bg-slate-200 px-5 py-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-700">
                      <span>9:41</span>
                      <div className="h-3 w-16 bg-black rounded-full mx-auto" />
                      <span>5G 100%</span>
                    </div>

                    <div className="bg-white px-4 py-2.5 border-b border-slate-200 text-center">
                      <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-xs shadow-2xs">
                        CU
                      </div>
                      <p className="font-semibold text-xs text-slate-900 mt-1">COVERUP-ALERTS</p>
                      <p className="text-[9px] text-slate-400">Verified Business SMS</p>
                    </div>

                    <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
                      <div className="max-w-[88%] bg-white rounded-2xl rounded-tl-xs p-3 shadow-2xs border border-slate-200 space-y-1.5">
                        <p className="text-xs text-slate-900 leading-relaxed">{renderedBody}</p>
                        <p className="text-[11px] text-blue-600 underline font-medium">https://coverup.app/pay/sub_preview89</p>
                        <p className="text-[9px] text-slate-400 text-right">Delivered</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: GUARDRAILS & RULES */}
      {sandboxTab === 'guardrails' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Shield className="text-blue-600 h-4 w-4" />
                <CardTitle className="text-sm font-bold text-slate-900">Stopping Rules & Guardrails</CardTitle>
              </div>
              <CardDescription>Hard constraints evaluated in 0ms before AI invocation</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-700">Max Retry Attempts</span>
                <Badge variant="outline" className="font-mono">{STOPPING_RULES.MAX_RETRY_COUNT} attempts</Badge>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-700">Max Days Overdue</span>
                <Badge variant="outline" className="font-mono">{STOPPING_RULES.MAX_DAYS_SINCE_FAILURE} days</Badge>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-700">Action Cooldown Window</span>
                <Badge variant="outline" className="font-mono">{STOPPING_RULES.COOLDOWN_HOURS} hours anti-spam</Badge>
              </div>
              <div>
                <span className="font-semibold text-slate-700 block mb-2">Non-Retryable Fatal Codes</span>
                <div className="flex flex-wrap gap-1.5">
                  {STOPPING_RULES.NON_RETRYABLE_REASONS.map((reason) => (
                    <Badge key={reason} variant="destructive" className="capitalize text-[10px]">
                      {reason.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Activity className="text-emerald-600 h-4 w-4" />
                <CardTitle className="text-sm font-bold text-slate-900">Baseline Calibrated Probabilities</CardTitle>
              </div>
              <CardDescription>Empirical recovery rates by failure category</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-2.5 text-xs">
              {Object.entries(RECOVERY_PROBABILITIES).map(([reason, prob]) => (
                <div key={reason} className="flex justify-between items-center">
                  <span className="text-slate-600 capitalize">{reason.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Number(prob) * 100}%` }} />
                    </div>
                    <span className="font-mono text-slate-800 w-8 text-right font-semibold">
                      {Math.round(Number(prob) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: DEMO GUIDE */}
      {sandboxTab === 'demo' && (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
          <div className="text-center space-y-2 py-4">
            <h2 className="text-2xl font-bold text-slate-900">Judge 2-Minute Architectural Walkthrough</h2>
            <p className="text-xs text-slate-500">How CoverUP addresses all hackathon evaluation criteria</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-5 space-y-2 border-slate-200">
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">1</div>
              <h3 className="font-bold text-slate-900 text-sm">1. Detect</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Scans overdue cohorts in 0.2s and calculates multi-factor risk scores.</p>
            </Card>

            <Card className="p-5 space-y-2 border-blue-200 bg-blue-50/20">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">2</div>
              <h3 className="font-bold text-blue-950 text-sm">2. Decide</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Evaluates stopping rules, then invokes Gemini Flash in parallel workers.</p>
            </Card>

            <Card className="p-5 space-y-2 border-slate-200">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">3</div>
              <h3 className="font-bold text-slate-900 text-sm">3. Execute</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Bulk dispatches interventions, recaptures revenue, and writes immutable audit logs.</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Zap, Send, ShieldAlert, CheckCircle2, Clock, Brain, ArrowRight, RefreshCw, AlertTriangle, Radio } from 'lucide-react';
import Link from 'next/link';

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
    amount: 149900,
  },
  {
    id: 'card_expired',
    name: '2. Card Expired (Recurring Mandate Failure)',
    failure_reason: 'card_expired',
    error_code: 'GATEWAY_ERROR',
    error_description: 'Card has passed its expiration date. Payment cannot be authorized.',
    payment_method: 'card',
    amount: 399900,
  },
  {
    id: 'authentication_required',
    name: '3. 3D Secure / SCA Challenge Required',
    failure_reason: 'authentication_required',
    error_code: 'AUTHENTICATION_REQUIRED',
    error_description: '3D Secure OTP verification was not completed by the cardholder.',
    payment_method: 'card',
    amount: 299900,
  },
  {
    id: 'network_error',
    name: '4. Bank Network Gateway Timeout (UPI Mandate)',
    failure_reason: 'network_error',
    error_code: 'GATEWAY_TIMEOUT',
    error_description: 'Issuer bank server timed out while processing automated UPI debit.',
    payment_method: 'upi',
    amount: 99900,
  },
  {
    id: 'fraud_suspected',
    name: '5. Fraud Risk Detection Alert (Immediate Escalate)',
    failure_reason: 'fraud_suspected',
    error_code: 'RISK_THRESHOLD_EXCEEDED',
    error_description: 'Transaction flagged by automated fraud intelligence system.',
    payment_method: 'card',
    amount: 999900,
  },
  {
    id: 'account_closed',
    name: '6. Bank Account Closed (Unrecoverable)',
    failure_reason: 'account_closed',
    error_code: 'ACCOUNT_CLOSED',
    error_description: 'Bank reports customer account permanently closed. No further charges allowed.',
    payment_method: 'mandate',
    amount: 149900,
  },
];

interface SubscriptionOption {
  id: string;
  plan_name: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  status: string;
}

interface WebhookResult {
  success: boolean;
  event: string;
  razorpay_payment_id: string;
  subscription: {
    id: string;
    plan_name: string;
    amount: number;
    customer_name: string;
    customer_email: string;
  };
  failure_reason: string;
  error_description: string;
  ai_intervention: {
    action: string;
    reasoning: string;
    confidence: number;
    outcome: string;
    amount_recovered: number;
    skipped: boolean;
    skip_reason?: string;
  };
  performance: {
    decide_ms: number;
    execute_ms: number;
    total_ms: number;
  };
  batch_id: string;
}

export default function SimulatorPage() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0].id);
  const [subscriptions, setSubscriptions] = useState<SubscriptionOption[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [firing, setFiring] = useState(false);
  const [result, setResult] = useState<WebhookResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<number>(149900);

  const activePreset = PRESETS.find((p) => p.id === selectedPresetId) || PRESETS[0];

  useEffect(() => {
    async function loadSubs() {
      try {
        const res = await fetch('/api/subscriptions?limit=25');
        const json = await res.json();
        if (json.success && json.data.subscriptions) {
          const formatted: SubscriptionOption[] = json.data.subscriptions.map((s: any) => ({
            id: s.id,
            plan_name: s.plan_name,
            amount: s.amount,
            customer_name: s.customers?.name || 'Customer',
            customer_email: s.customers?.email || 'user@example.com',
            status: s.status,
          }));
          setSubscriptions(formatted);
          if (formatted.length > 0) {
            setSelectedSubId(formatted[0].id);
            setCustomAmount(formatted[0].amount);
          }
        }
      } catch (err) {
        console.error('Failed to load subscriptions for simulator:', err);
      } finally {
        setLoadingSubs(false);
      }
    }
    loadSubs();
  }, []);

  const handleSubChange = (subId: string) => {
    setSelectedSubId(subId);
    const sub = subscriptions.find((s) => s.id === subId);
    if (sub) {
      setCustomAmount(sub.amount);
    }
  };

  const handleFireWebhook = async () => {
    setFiring(true);
    setErrorMsg('');
    setResult(null);

    const payload = {
      entity: 'event',
      account_id: 'acc_rzp_live_2025',
      event: 'payment.failed',
      subscription_id: selectedSubId || undefined,
      contains: ['payment'],
      payload: {
        payment: {
          entity: {
            id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            amount: customAmount,
            currency: 'INR',
            status: 'failed',
            order_id: `order_${Date.now().toString(36)}`,
            invoice_id: `inv_${Date.now().toString(36)}`,
            method: activePreset.payment_method,
            card: {
              last4: '5424',
              network: 'Mastercard',
              type: 'credit',
              issuer: 'HDFC',
            },
            error_code: activePreset.error_code,
            error_description: activePreset.error_description,
            error_source: 'bank',
            error_step: 'payment_authorization',
            error_reason: activePreset.failure_reason,
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Zap className="h-5 w-5" />
            </span>
            <h1 className="text-3xl font-bold text-slate-900">Razorpay Webhook Simulator</h1>
          </div>
          <p className="text-slate-500 mt-1">
            Simulate real-time Razorpay <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-blue-700">payment.failed</code> events and observe CoverUP's autonomous AI agent react in sub-seconds.
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 text-sm gap-1.5 self-start sm:self-auto">
          <Radio className="h-3.5 w-3.5 text-blue-600 animate-pulse" /> Live Event Ingestion
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset & Target Selection */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">1. Select Failure Scenario</CardTitle>
              <CardDescription>Choose an authentic payment decline pattern to test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {PRESETS.map((preset) => {
                  const isSelected = preset.id === selectedPresetId;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/60 shadow-sm ring-1 ring-blue-500'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-slate-900">{preset.name}</span>
                        <Badge variant={isSelected ? 'info' : 'outline'} className="text-[10px]">
                          {preset.failure_reason}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{preset.error_description}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">2. Target Subscription</CardTitle>
              <CardDescription>Select which customer subscription receives this webhook</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingSubs ? (
                <Skeleton className="h-10 w-full" />
              ) : subscriptions.length === 0 ? (
                <div className="p-4 rounded-lg bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>No subscriptions found. Click "Seed Data" on Dashboard first.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Customer & Plan</label>
                    <Select
                      value={selectedSubId}
                      onChange={(e) => handleSubChange(e.target.value)}
                    >
                      {subscriptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.customer_name} — {s.plan_name} ({formatCurrency(s.amount)})
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span>Transaction Value:</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(customAmount)}</span>
                  </div>
                </div>
              )}

              <Button
                variant="default"
                className="w-full h-11 text-base shadow-sm gap-2"
                onClick={handleFireWebhook}
                loading={firing}
                disabled={loadingSubs || subscriptions.length === 0}
              >
                <Send className="h-4 w-4" />
                Dispatch Razorpay Webhook
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Webhook Payload & Agent Live Response */}
        <div className="lg:col-span-7 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Autonomous Reaction Card */}
          {result ? (
            <Card className="border-blue-200 bg-gradient-to-b from-white to-blue-50/20 shadow-md">
              <CardHeader className="pb-3 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Autonomous Agent Intervention
                    </CardTitle>
                  </div>
                  <Badge variant="success" className="text-xs">
                    HTTP 200 Processed in {result.performance.total_ms}ms
                  </Badge>
                </div>
                <CardDescription>
                  CoverUP intercepted the webhook, evaluated stopping rules, queried Google Gemini AI, and executed intervention.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* 3 Step Pipeline Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Step 1: Ingestion</p>
                    <p className="text-sm font-bold text-slate-900 mt-1 capitalize">{result.failure_reason.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-500 truncate">{result.error_description}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 shadow-2xs">
                    <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Step 2: AI Decision</p>
                    <p className="text-sm font-bold text-blue-900 mt-1 capitalize">{result.ai_intervention.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-blue-700">Confidence: {(result.ai_intervention.confidence * 100).toFixed(0)}%</p>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Step 3: Outcome</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="capitalize font-bold text-sm text-slate-900">{result.ai_intervention.outcome}</span>
                      {result.ai_intervention.outcome === 'success' && (
                        <Badge variant="success" className="text-[10px]">+{formatCurrency(result.ai_intervention.amount_recovered)}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{result.performance.total_ms}ms total turnaround</p>
                  </div>
                </div>

                {/* AI Reasoning Box */}
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 text-xs font-semibold">
                    <Brain className="h-4 w-4" />
                    <span>Gemini AI Autonomous Reasoning:</span>
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed italic">
                    "{result.ai_intervention.reasoning}"
                  </p>
                  {result.ai_intervention.skipped && (
                    <div className="mt-2 text-xs text-amber-700 font-medium">
                      ⚠️ Stopping Rule Triggered: {result.ai_intervention.skip_reason}
                    </div>
                  )}
                </div>

                {/* Subscription & Customer context */}
                <div className="flex flex-wrap items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 gap-2">
                  <div>
                    <span className="font-semibold text-slate-900">{result.subscription.customer_name}</span> ({result.subscription.customer_email})
                  </div>
                  <div>
                    <span>Plan: <strong>{result.subscription.plan_name}</strong></span> · 
                    <span className="ml-1 text-emerald-700 font-medium">{formatCurrency(result.subscription.amount)}</span>
                  </div>
                </div>

                {/* Action Links */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Link href={`/recovery/${result.batch_id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      View Batch Record <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Link href="/audit">
                    <Button variant="default" size="sm" className="gap-1.5 text-xs">
                      Inspect Audit Trail <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
              <CardContent className="py-16 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">Ready for Live Webhook Dispatch</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Select a failure scenario on the left and click <strong>"Dispatch Razorpay Webhook"</strong> to trigger real-time AI recovery.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Simulated Razorpay JSON Payload Card */}
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-mono font-semibold text-slate-600 uppercase tracking-wider">
                  Raw Razorpay Webhook Payload (POST /api/webhooks/razorpay)
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">application/json</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <pre className="p-4 rounded-lg bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-64 border border-slate-800">
                {JSON.stringify(
                  {
                    entity: 'event',
                    account_id: 'acc_rzp_live_2025',
                    event: 'payment.failed',
                    subscription_id: selectedSubId || 'sub_demo_123',
                    payload: {
                      payment: {
                        entity: {
                          id: 'pay_live_sample_' + activePreset.id,
                          amount: customAmount,
                          currency: 'INR',
                          status: 'failed',
                          method: activePreset.payment_method,
                          error_code: activePreset.error_code,
                          error_description: activePreset.error_description,
                          error_reason: activePreset.failure_reason,
                        },
                      },
                    },
                    created_at: Math.floor(Date.now() / 1000),
                  },
                  null,
                  2
                )}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

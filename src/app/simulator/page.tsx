'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Zap, Send, Brain, ArrowRight, AlertTriangle, Radio } from 'lucide-react';
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

export default function SimulatorPage() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('insufficient_funds');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [loadingSubs, setLoadingSubs] = useState<boolean>(true);
  const [firing, setFiring] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleSubChange = (subId: string) => {
    setSelectedSubId(subId);
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Zap className="h-5 w-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Webhook Simulator</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Simulate incoming <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-indigo-600">payment.failed</code> events and test real-time AI decision-making.
          </p>
        </div>
        <Badge variant="secondary" className="px-2.5 py-1 text-xs gap-1.5 self-start sm:self-auto">
          <Radio className="h-3 w-3 text-indigo-600 animate-pulse" /> Live Ingestion
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset & Target Selection */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-900">1. Select Failure Scenario</CardTitle>
              <CardDescription>Choose an authentic decline code</CardDescription>
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
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600 shadow-2xs'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-gray-900">{preset.name}</span>
                      <Badge variant={isSelected ? 'info' : 'outline'} className="text-[9px]">
                        {preset.failure_reason}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{preset.error_description}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-900">2. Target Subscription</CardTitle>
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
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Customer & Plan</label>
                    <Select
                      value={selectedSubId}
                      onChange={(e) => handleSubChange(e.target.value)}
                    >
                      {subscriptions.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.customers?.name || 'Customer'} — {sub.plan_name} ({formatCurrency(sub.amount)})
                        </option>
                      ))}
                    </Select>
                  </div>

                  {activeSub && (
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Current Status:</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{activeSub.status}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Customer Email:</span>
                        <span className="font-mono text-gray-800 text-[11px]">{activeSub.customers?.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Billing Amount:</span>
                        <span className="font-bold text-gray-900">{formatCurrency(activeSub.amount)}</span>
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
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-900">3. JSON Webhook Payload</CardTitle>
              <CardDescription>Simulated webhook body dispatched to CoverUP</CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              <pre className="p-3.5 rounded-lg bg-gray-900 text-gray-100 font-mono text-[11px] overflow-x-auto max-h-64 border border-gray-800">
                {JSON.stringify(
                  {
                    event: 'payment.failed',
                    payload: {
                      payment: {
                        entity: {
                          id: 'pay_sim_98412894',
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
            <Card className="border-indigo-200 bg-indigo-50/20 shadow-xs animate-in fade-in duration-200">
              <CardHeader className="pb-3 border-b border-indigo-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-indigo-600" />
                    <CardTitle className="text-sm font-bold text-indigo-950">
                      Autonomous Decision Result
                    </CardTitle>
                  </div>
                  <Badge variant={result.action_executed?.outcome === 'success' ? 'success' : 'warning'}>
                    {result.action_executed?.outcome}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-indigo-100 space-y-1">
                  <p className="font-bold text-indigo-950">AI Strategic Reasoning:</p>
                  <p className="text-gray-700 leading-relaxed">{result.action_executed?.ai_reasoning}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200 text-center">
                    <p className="text-gray-400 text-[10px]">Action</p>
                    <p className="font-bold text-gray-900 mt-0.5 truncate">{result.action_executed?.action_type}</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200 text-center">
                    <p className="text-gray-400 text-[10px]">Confidence</p>
                    <p className="font-bold text-indigo-600 mt-0.5">{Math.round((result.action_executed?.ai_confidence || 0) * 100)}%</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200 text-center">
                    <p className="text-gray-400 text-[10px]">Outcome</p>
                    <p className="font-bold text-emerald-700 mt-0.5 capitalize">{result.action_executed?.outcome}</p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200 text-center">
                    <p className="text-gray-400 text-[10px]">Recovered</p>
                    <p className="font-bold text-emerald-700 mt-0.5">{formatCurrency(result.action_executed?.amount_recovered || 0)}</p>
                  </div>
                </div>

                {selectedSubId && (
                  <div className="pt-1 flex justify-end">
                    <Link href={`/customers/${activeSub?.customer_id}`}>
                      <Button variant="outline" size="sm" className="gap-1 text-xs">
                        View Customer Timeline <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

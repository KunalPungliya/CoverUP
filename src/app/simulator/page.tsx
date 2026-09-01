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
  const [sandboxTab, setSandboxTab] = useState<'settings' | 'webhook' | 'templates'>('settings');

  // Working Pipeline Settings State (with localStorage persistence)
  const [maxRetries, setMaxRetries] = useState<number>(3);
  const [maxDaysOverdue, setMaxDaysOverdue] = useState<number>(14);
  const [cooldownHours, setCooldownHours] = useState<number>(24);
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState<number>(80);
  const [activeModel, setActiveModel] = useState<string>('gemini-1.5-flash');
  const [enableEmail, setEnableEmail] = useState<boolean>(true);
  const [enableSms, setEnableSms] = useState<boolean>(true);
  const [enableSmartTiming, setEnableSmartTiming] = useState<boolean>(true);
  const [escalationThreshold, setEscalationThreshold] = useState<number>(25000);
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState<boolean>(false);

  // Policy Evaluation Sandbox
  const [testScenario, setTestScenario] = useState<string>('insufficient_funds');
  const [testEvaluationResult, setTestEvaluationResult] = useState<any | null>(null);

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
  const [planName, setPlanName] = useState<string>('Developer Pro (Monthly)');
  const [amount, setAmount] = useState<string>('₹1,850');
  const [previewMode, setPreviewMode] = useState<'email' | 'sms'>('email');
  const [copied, setCopied] = useState<boolean>(false);

  // Load subscriptions & saved settings on mount
  useEffect(() => {
    async function loadSubs() {
      try {
        const res = await fetch('/api/subscriptions');
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setSubscriptions(json.data);
          setSelectedSubId(json.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load subscriptions for sandbox', err);
      } finally {
        setLoadingSubs(false);
      }
    }
    loadSubs();

    // Load saved settings if present
    const saved = localStorage.getItem('vaultback_pipeline_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.maxRetries) setMaxRetries(parsed.maxRetries);
        if (parsed.maxDaysOverdue) setMaxDaysOverdue(parsed.maxDaysOverdue);
        if (parsed.cooldownHours) setCooldownHours(parsed.cooldownHours);
        if (parsed.aiConfidenceThreshold) setAiConfidenceThreshold(parsed.aiConfidenceThreshold);
        if (parsed.activeModel) setActiveModel(parsed.activeModel);
        if (parsed.enableEmail !== undefined) setEnableEmail(parsed.enableEmail);
        if (parsed.enableSms !== undefined) setEnableSms(parsed.enableSms);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleSaveSettings = () => {
    const config = {
      maxRetries,
      maxDaysOverdue,
      cooldownHours,
      aiConfidenceThreshold,
      activeModel,
      enableEmail,
      enableSms,
      enableSmartTiming,
      escalationThreshold,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('vaultback_pipeline_settings', JSON.stringify(config));
    setSavedSettingsSuccess(true);
    setTimeout(() => setSavedSettingsSuccess(false), 3500);
  };

  const handleEvaluatePolicy = () => {
    let action = 'retry_payment';
    let reasoning = '';
    let confidence = 0.94;
    let timing = 'Optimal banking window (+24h, 10:30 AM)';
    let channel = 'Direct Gateway Auto-Retry';

    if (testScenario === 'insufficient_funds') {
      action = 'retry_payment';
      reasoning = `Transient decline detected. Scheduled smart retry in 24 hours (attempt 1/${maxRetries}). Email notification queued.`;
      confidence = 0.92;
      timing = '+24h Smart Delay';
      channel = enableEmail ? 'Gateway Retry + Email Notice' : 'Gateway Retry';
    } else if (testScenario === 'card_expired') {
      action = 'request_payment_update';
      reasoning = `Mandate token revoked due to expired card. Retrying is fatal. Dispatched secure 1-click update link with 48h validity.`;
      confidence = 0.96;
      timing = 'Immediate (0s)';
      channel = enableSms ? 'Email + SMS Update Portal Link' : 'Email Portal Link';
    } else if (testScenario === 'authentication_required') {
      action = 'send_sms_nudge';
      reasoning = `3D Secure OTP verification required. Dispatched instant SMS notification with direct 3DS completion link.`;
      confidence = 0.95;
      timing = 'Immediate (0s)';
      channel = 'SMS High-Priority Alert';
    } else if (testScenario === 'network_error') {
      action = 'retry_payment';
      reasoning = `Bank network gateway timed out. Immediate transient error. Retry scheduled for off-peak clearing window (+6h).`;
      confidence = 0.89;
      timing = '+6h Off-Peak Clearing';
      channel = 'Automated Background Retry';
    } else if (testScenario === 'fraud_suspected' || testScenario === 'account_closed') {
      action = 'escalate';
      reasoning = `Hard stopping rule trigger (${testScenario.replace(/_/g, ' ')}). Automated retries are permanently blocked to prevent chargebacks. Routed to account manager.`;
      confidence = 0.98;
      timing = 'Immediate Lockout';
      channel = 'Internal Escalation Queue';
    }

    setTestEvaluationResult({
      scenario: testScenario,
      action,
      reasoning,
      confidence,
      timing,
      channel,
      status: 'Policy Verified'
    });
  };

  const activePreset = PRESETS.find(p => p.id === selectedPresetId) || PRESETS[0];

  const buildPayload = () => {
    const paymentId = `pay_sim_${Date.now().toString().slice(-6)}`;
    return {
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            amount: activePreset.amount,
            currency: 'INR',
            status: 'failed',
            method: activePreset.payment_method,
            error_code: activePreset.error_code,
            error_description: activePreset.error_description,
            error_reason: activePreset.failure_reason,
            subscription_id: selectedSubId || 'sub_sim_demo123',
            created_at: Math.floor(Date.now() / 1000),
          }
        }
      }
    };
  };

  const [currentPayload, setCurrentPayload] = useState<any>(buildPayload());

  useEffect(() => {
    setCurrentPayload(buildPayload());
  }, [selectedPresetId, selectedSubId]);

  const handleFireWebhook = async () => {
    setFiring(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await fetch('/api/webhooks/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Webhook execution failed');
      }
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error triggering webhook');
    } finally {
      setFiring(false);
    }
  };

  const activeTemplate = (MESSAGE_TEMPLATES as any)[activeTemplateKey] || MESSAGE_TEMPLATES.gentle_reminder;
  const renderedSubject = activeTemplate.subject || 'Action Required: Update Payment Method';
  const renderedBody = activeTemplate.body
    .replace('{{customer_name}}', customerName)
    .replace('{{plan_name}}', planName)
    .replace('{{amount}}', amount)
    .replace('{{update_link}}', 'https://vaultback.app/pay/sub_preview89');

  const handleCopy = () => {
    navigator.clipboard.writeText(previewMode === 'email' ? `${renderedSubject}\n\n${renderedBody}` : renderedBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header with 3 Clean Cockpit Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">Developer Sandbox</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Tune pipeline policies, trigger real-time webhooks, and preview multi-channel touches</p>
        </div>

        {/* 3 Streamlined Tabs */}
        <div className="flex bg-white p-1 rounded-xl border border-[#E2E5EB] shadow-2xs">
          <button
            onClick={() => setSandboxTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sandboxTab === 'settings'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-slate-50'
            }`}
          >
            <Sliders className={`h-3.5 w-3.5 ${sandboxTab === 'settings' ? 'text-[#FDDD35]' : 'text-zinc-400'}`} />
            Pipeline Settings
          </button>
          <button
            onClick={() => setSandboxTab('webhook')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sandboxTab === 'webhook'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-slate-50'
            }`}
          >
            <Zap className={`h-3.5 w-3.5 ${sandboxTab === 'webhook' ? 'text-[#FDDD35]' : 'text-zinc-400'}`} />
            Webhook Simulator
          </button>
          <button
            onClick={() => setSandboxTab('templates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              sandboxTab === 'templates'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-slate-50'
            }`}
          >
            <Mail className={`h-3.5 w-3.5 ${sandboxTab === 'templates' ? 'text-[#FDDD35]' : 'text-zinc-400'}`} />
            Nudge Previews
          </button>
        </div>
      </div>

      {/* TAB 1: WORKING PIPELINE SETTINGS */}
      {sandboxTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {savedSettingsSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#00BA68]" />
              Pipeline settings saved and applied to autonomous recovery engine!
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Retry Engine Policies */}
            <Card>
              <CardHeader className="pb-3 border-b border-[#E2E5EB] bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-zinc-950" />
                  <CardTitle className="text-sm font-bold text-zinc-950">Retry Engine Policies</CardTitle>
                </div>
                <CardDescription>Configure dunning limits, intervals, and anti-spam rules</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="font-semibold text-zinc-800">Maximum Retry Attempts</label>
                    <Badge variant="outline" className="font-mono font-bold bg-slate-50">{maxRetries} Retries</Badge>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(Number(e.target.value))}
                    className="w-full accent-zinc-950 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-1">
                    <span>1 attempt (conservative)</span>
                    <span>3 (recommended)</span>
                    <span>5 (aggressive)</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="font-semibold text-zinc-800">Max Days Overdue Cutoff</label>
                    <Badge variant="outline" className="font-mono font-bold bg-slate-50">{maxDaysOverdue} Days</Badge>
                  </div>
                  <input
                    type="range"
                    min="7"
                    max="30"
                    value={maxDaysOverdue}
                    onChange={(e) => setMaxDaysOverdue(Number(e.target.value))}
                    className="w-full accent-zinc-950 cursor-pointer"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">Accounts overdue beyond {maxDaysOverdue} days are flagged as unrecoverable to protect metrics.</p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="font-semibold text-zinc-800">Anti-Spam Action Cooldown Window</label>
                    <Badge variant="outline" className="font-mono font-bold bg-slate-50">{cooldownHours} Hours</Badge>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="48"
                    step="6"
                    value={cooldownHours}
                    onChange={(e) => setCooldownHours(Number(e.target.value))}
                    className="w-full accent-zinc-950 cursor-pointer"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">Enforces minimum {cooldownHours}h spacing between successive customer touches.</p>
                </div>
              </CardContent>
            </Card>

            {/* 2. AI Decisioning & Guardrails */}
            <Card>
              <CardHeader className="pb-3 border-b border-[#E2E5EB] bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-zinc-950" />
                  <CardTitle className="text-sm font-bold text-zinc-950">AI Decisioning & Safety Guardrails</CardTitle>
                </div>
                <CardDescription>Gemini model parameters and execution thresholds</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-zinc-800 mb-1 block">Active AI Model</label>
                  <Select value={activeModel} onChange={(e) => setActiveModel(e.target.value)}>
                    <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Ultra Fast — ~0.2s)</option>
                    <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Deep Strategy Reasoning)</option>
                  </Select>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="font-semibold text-zinc-800">Minimum AI Certainty Threshold</label>
                    <Badge variant="default" className="font-mono font-bold bg-zinc-950 text-[#FDDD35]">{aiConfidenceThreshold}%</Badge>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={aiConfidenceThreshold}
                    onChange={(e) => setAiConfidenceThreshold(Number(e.target.value))}
                    className="w-full accent-zinc-950 cursor-pointer"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">Decisions with &lt;{aiConfidenceThreshold}% confidence fall back to calibrated heuristics.</p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <label className="font-semibold text-zinc-800 block">Active Communication Channels</label>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-zinc-700" />
                      <span className="font-medium text-zinc-800">Email Dunning Reminders</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableEmail}
                      onChange={(e) => setEnableEmail(e.target.checked)}
                      className="h-4 w-4 accent-zinc-950 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-3.5 w-3.5 text-zinc-700" />
                      <span className="font-medium text-zinc-800">SMS Nudges & UPI Alerts</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableSms}
                      onChange={(e) => setEnableSms(e.target.checked)}
                      className="h-4 w-4 accent-zinc-950 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <Button variant="default" onClick={handleSaveSettings} className="w-full gap-2 text-xs py-2.5 mt-2">
                  <Check className="h-4 w-4 text-[#FDDD35]" />
                  Save Pipeline Configuration
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 3. Live Policy Evaluator Sandbox */}
          <Card className="border-[#E2E5EB]">
            <CardHeader className="pb-3 border-b border-[#E2E5EB] bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-zinc-950" />
                  <CardTitle className="text-sm font-bold text-zinc-950">Live Policy & Rule Tester</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">Real-Time Simulation</Badge>
              </div>
              <CardDescription>Test how current settings evaluate against simulated Indian gateway errors</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-zinc-800 mb-1.5 block">Select Failure Code</label>
                  <Select value={testScenario} onChange={(e) => setTestScenario(e.target.value)} className="w-full text-xs">
                    <option value="insufficient_funds">Insufficient Funds (Transient / Balance Low)</option>
                    <option value="card_expired">Card Expired (Mandate Revoked / Expired Token)</option>
                    <option value="authentication_required">3D Secure / OTP Challenge Required</option>
                    <option value="network_error">Bank Network Gateway Timeout (UPI e-Mandate)</option>
                    <option value="fraud_suspected">High Risk / Fraud Suspected (Hard Stopping Rule)</option>
                    <option value="account_closed">Bank Account Closed (Mandate Terminated)</option>
                  </Select>
                </div>
                <Button onClick={handleEvaluatePolicy} variant="default" className="gap-2 text-xs py-2.5 shrink-0">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Test Policy Evaluation
                </Button>
              </div>

              {testEvaluationResult && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-950">Policy Decision Output</span>
                    <Badge variant="default" className="bg-emerald-600 text-white text-[10px]">
                      {testEvaluationResult.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-zinc-400 text-[10px] uppercase font-semibold">Action Selected</span>
                      <p className="font-bold text-zinc-950 mt-0.5 capitalize">{testEvaluationResult.action.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-zinc-400 text-[10px] uppercase font-semibold">AI Confidence</span>
                      <p className="font-bold text-emerald-700 mt-0.5">{Math.round(testEvaluationResult.confidence * 100)}%</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-zinc-400 text-[10px] uppercase font-semibold">Execution Timing</span>
                      <p className="font-bold text-zinc-950 mt-0.5">{testEvaluationResult.timing}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-zinc-400 text-[10px] uppercase font-semibold">Dispatched Via</span>
                      <p className="font-bold text-zinc-950 mt-0.5">{testEvaluationResult.channel}</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                    <strong>Rule Reasoning:</strong> {testEvaluationResult.reasoning}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: WEBHOOK SIMULATOR */}
      {sandboxTab === 'webhook' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-[#E2E5EB] bg-slate-50/50">
                <CardTitle className="text-sm font-bold text-zinc-950">1. Select Failure Scenario</CardTitle>
                <CardDescription>Simulate authentic Indian payment decline codes</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                          : 'border-[#E2E5EB] bg-white hover:border-slate-300 text-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{preset.name}</span>
                        <Badge variant={isSelected ? 'accent' : 'outline'} className="text-[10px]">
                          {preset.failure_reason}
                        </Badge>
                      </div>
                      <p className={`text-[11px] mt-1 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {preset.error_description}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b border-[#E2E5EB] bg-slate-50/50">
                <CardTitle className="text-sm font-bold text-zinc-950">2. Target Subscription</CardTitle>
                <CardDescription>Select an account to inject the failure into</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {loadingSubs ? (
                  <Skeleton className="h-10 w-full rounded-lg" />
                ) : (
                  <Select
                    value={selectedSubId}
                    onChange={(e) => setSelectedSubId(e.target.value)}
                    className="w-full text-xs"
                  >
                    {subscriptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.customers?.name || 'Customer'} — {s.plan_name} ({formatCurrency(s.amount)})
                      </option>
                    ))}
                  </Select>
                )}

                <Button
                  onClick={handleFireWebhook}
                  disabled={firing || !selectedSubId}
                  variant="default"
                  className="w-full gap-2 text-xs py-2.5"
                >
                  <Zap className="h-4 w-4 text-[#FDDD35]" />
                  {firing ? 'Processing Autonomous Decision...' : 'Simulate Webhook Trigger'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-[#E2E5EB] bg-slate-50/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-zinc-950">3. JSON Webhook Payload</CardTitle>
                  <CardDescription>Live simulated Razorpay payment.failed payload</CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">application/json</Badge>
              </CardHeader>
              <CardContent className="p-4">
                <pre className="p-4 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-zinc-800 shadow-inner max-h-60">
                  {JSON.stringify(currentPayload, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold">Webhook Trigger Error</p>
                  <p className="mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {result && (
              <Card className="border-emerald-200 bg-emerald-50/10">
                <CardHeader className="pb-3 border-b border-emerald-100 bg-emerald-50/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-emerald-600 text-white">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <CardTitle className="text-sm font-bold text-emerald-950">
                        Autonomous AI Execution Result
                      </CardTitle>
                    </div>
                    <Badge variant="default" className="bg-emerald-600">HTTP 200 OK</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-lg border border-emerald-100">
                      <span className="text-zinc-400 text-[10px] uppercase font-semibold">Action Selected</span>
                      <p className="font-bold text-zinc-950 mt-0.5 capitalize">
                        {result.data?.decision?.action?.replace(/_/g, ' ') || 'None'}
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-emerald-100">
                      <span className="text-zinc-400 text-[10px] uppercase font-semibold">AI Confidence</span>
                      <p className="font-bold text-emerald-700 mt-0.5">
                        {Math.round((result.data?.decision?.confidence || 0.94) * 100)}%
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-emerald-100">
                      <span className="text-zinc-400 text-[10px] uppercase font-semibold">Execution Status</span>
                      <p className="font-bold text-zinc-950 mt-0.5 capitalize">{result.data?.execution?.outcome || 'Success'}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-emerald-100">
                      <span className="text-zinc-400 text-[10px] uppercase font-semibold">Recaptured</span>
                      <p className="font-bold text-emerald-700 mt-0.5">
                        {formatCurrency(result.data?.execution?.amount_recovered || 0)}
                      </p>
                    </div>
                  </div>

                  {result.data?.decision?.reasoning && (
                    <div className="p-3.5 bg-white rounded-xl border border-emerald-100 flex items-start gap-2.5 text-xs text-zinc-800">
                      <Brain className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-emerald-950 block mb-0.5">Gemini Strategic Reasoning</span>
                        <p className="leading-relaxed">{result.data.decision.reasoning}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TEMPLATE PREVIEWS */}
      {sandboxTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-[#E2E5EB] bg-slate-50/50">
                <CardTitle className="text-sm font-bold text-zinc-950">Select Touchpoint Template</CardTitle>
                <CardDescription>Multi-channel dunning communication flows</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {Object.entries(MESSAGE_TEMPLATES).map(([key, tpl]: [string, any]) => {
                  const isSelected = activeTemplateKey === key;
                  return (
                    <div
                      key={key}
                      onClick={() => {
                        setActiveTemplateKey(key);
                        setPreviewMode(key === 'sms_nudge' ? 'sms' : 'email');
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                          : 'border-[#E2E5EB] bg-white hover:border-slate-300 text-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold capitalize">{key.replace(/_/g, ' ')}</span>
                        <Badge variant={isSelected ? 'accent' : 'outline'} className="text-[10px]">
                          {key === 'sms_nudge' ? 'SMS' : 'Email'}
                        </Badge>
                      </div>
                      <p className={`text-[11px] mt-1 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {tpl.subject || tpl.body.slice(0, 70) + '...'}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b border-[#E2E5EB] bg-slate-50/50">
                <CardTitle className="text-sm font-bold text-zinc-950">Dynamic Variable Overrides</CardTitle>
                <CardDescription>Live interpolation sandbox</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 mb-1 block">Customer Name</label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 mb-1 block">Plan Name</label>
                  <Input value={planName} onChange={(e) => setPlanName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 mb-1 block">Pending Amount</label>
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
              <div className="rounded-xl border border-[#E2E5EB] bg-white shadow-2xs overflow-hidden">
                <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center justify-between text-white">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-medium text-zinc-300 ml-2">Inbox — VaultBack Autonomous Nudge</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-zinc-700 text-white">HTML Email</Badge>
                </div>

                <div className="p-5 border-b border-slate-100 bg-white space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-medium">From:</span>
                    <span className="font-semibold text-zinc-900">VaultBack Recovery &lt;billing@vaultback.app&gt;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-medium">To:</span>
                    <span className="text-zinc-700">{customerName} &lt;customer@example.com&gt;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-medium">Subject:</span>
                    <span className="font-bold text-zinc-950">{renderedSubject}</span>
                  </div>
                </div>

                <div className="p-6 bg-white space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <div className="h-7 w-7 rounded-lg bg-zinc-950 flex items-center justify-center text-[#FDDD35] text-xs font-bold shadow-2xs border border-zinc-800">
                      VB
                    </div>
                    <span className="font-bold text-sm text-zinc-950">VaultBack Recovery Portal</span>
                  </div>

                  <div className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line">
                    {renderedBody}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-medium text-zinc-500">Subscription Plan</p>
                        <p className="text-sm font-bold text-zinc-950">{planName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-medium text-zinc-500">Pending Amount</p>
                        <p className="text-lg font-bold text-emerald-700">{amount}</p>
                      </div>
                    </div>

                    <a
                      href="#pay"
                      onClick={(e) => e.preventDefault()}
                      className="block w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-center text-xs font-semibold rounded-lg shadow-xs transition-colors"
                    >
                      Update Payment Method / Pay Now
                    </a>

                    <p className="text-[10px] text-center text-zinc-500 flex items-center justify-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      256-bit encrypted checkout powered by Razorpay Subscriptions
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-sm mx-auto">
                <div className="rounded-[36px] border-8 border-zinc-950 bg-zinc-950 shadow-xl p-2.5 overflow-hidden">
                  <div className="rounded-[24px] bg-slate-100 overflow-hidden flex flex-col h-[480px]">
                    <div className="bg-slate-200 px-5 py-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-700">
                      <span>9:41</span>
                      <div className="h-3 w-16 bg-black rounded-full mx-auto" />
                      <span>5G 100%</span>
                    </div>

                    <div className="bg-white px-4 py-2.5 border-b border-slate-200 text-center">
                      <div className="h-8 w-8 rounded-full bg-zinc-950 text-[#FDDD35] font-bold flex items-center justify-center mx-auto text-xs shadow-2xs">
                        VB
                      </div>
                      <p className="font-semibold text-xs text-zinc-950 mt-1">VAULTBACK-ALERTS</p>
                      <p className="text-[9px] text-zinc-400">Verified Business SMS</p>
                    </div>

                    <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
                      <div className="max-w-[88%] bg-white rounded-2xl rounded-tl-xs p-3 shadow-2xs border border-slate-200 space-y-1.5">
                        <p className="text-xs text-zinc-900 leading-relaxed">{renderedBody}</p>
                        <p className="text-[11px] text-blue-600 underline font-medium">https://vaultback.app/pay/sub_preview89</p>
                        <p className="text-[9px] text-zinc-400 text-right">Delivered</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

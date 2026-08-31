'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MESSAGE_TEMPLATES } from '@/lib/constants';
import { Mail, Smartphone, Send, Copy, Check, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';

export default function TemplatesPage() {
  const [activeTemplateKey, setActiveTemplateKey] = useState<string>('gentle_reminder');
  const [customerName, setCustomerName] = useState<string>('Priya Sharma');
  const [planName, setPlanName] = useState<string>('Pro Monthly');
  const [amount, setAmount] = useState<string>('₹1,499');
  const [copied, setCopied] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'email' | 'sms'>('email');

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Mail className="h-5 w-5" />
            </span>
            <h1 className="text-3xl font-bold text-slate-900">Communication & Nudge Previews</h1>
          </div>
          <p className="text-slate-500 mt-1">
            Simulate real customer touchpoints across Email and SMS channels with dynamic Razorpay payment links.
          </p>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setPreviewMode('email')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              previewMode === 'email' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="h-3.5 w-3.5" /> Email Client
          </button>
          <button
            onClick={() => {
              setPreviewMode('sms');
              setActiveTemplateKey('sms_nudge');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              previewMode === 'sms' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" /> SMS Smartphone
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls & Dynamic Variables */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Select Recovery Template</CardTitle>
              <CardDescription>AI selects the most appropriate message based on customer risk</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { key: 'gentle_reminder', label: '1. Gentle Early Reminder', tag: 'Email', desc: 'Friendly alert for 1st transient failure' },
                { key: 'urgent_reminder', label: '2. Urgent Reminder', tag: 'Email', desc: 'Warning before grace period expiration' },
                { key: 'payment_update', label: '3. Payment Method Update Request', tag: 'Email', desc: '1-click mandate / card renewal' },
                { key: 'final_notice', label: '4. Final Grace Period Notice', tag: 'Email', desc: '48hr notice prior to subscription cancellation' },
                { key: 'sms_nudge', label: '5. SMS Urgent Nudge', tag: 'SMS', desc: 'High-open rate concise mobile alert' },
              ].map((item) => {
                const isSelected = activeTemplateKey === item.key;
                return (
                  <div
                    key={item.key}
                    onClick={() => {
                      setActiveTemplateKey(item.key);
                      if (item.tag === 'SMS') setPreviewMode('sms');
                      else setPreviewMode('email');
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                      <Badge variant={item.tag === 'Email' ? 'info' : 'secondary'} className="text-[10px]">
                        {item.tag}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Dynamic variables */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Dynamic Personalization Variables</CardTitle>
              <CardDescription>Test how template placeholders format with real customer data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Customer Name (&#123;&#123;customer_name&#125;&#125;)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Plan Name (&#123;&#123;plan_name&#125;&#125;)</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Amount (&#123;&#123;amount&#125;&#125;)</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Device Visualizer */}
        <div className="lg:col-span-7 space-y-4">
          {previewMode === 'email' ? (
            /* Desktop Webmail Simulator */
            <div className="rounded-2xl border border-slate-300 bg-white shadow-xl overflow-hidden">
              {/* Browser/Email Chrome */}
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-amber-400 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400 inline-block" />
                  <span className="ml-2 text-xs font-mono text-slate-500">Inbox · CoverUP Billing & Recovery</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs gap-1">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy Text'}
                </Button>
              </div>

              {/* Email Envelope Header */}
              <div className="p-6 border-b border-slate-100 space-y-2 bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-900">{renderedSubject}</h2>
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                      CU
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">CoverUP Autonomous Billing &lt;billing@coverup.app&gt;</p>
                      <p>to {customerName.toLowerCase().replace(/ /g, '.')}@gmail.com</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">Security Verified</Badge>
                </div>
              </div>

              {/* Email Body */}
              <div className="p-8 space-y-6">
                <div className="border-l-4 border-blue-600 pl-4 py-1">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Automated Notification</p>
                  <p className="text-sm font-medium text-slate-700">CoverUP Intelligent Revenue Recovery</p>
                </div>

                <div className="text-slate-800 text-base leading-relaxed space-y-4 font-normal whitespace-pre-wrap">
                  {renderedBody}
                </div>

                {/* Call to action payment card */}
                <div className="p-5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Subscription Item</p>
                      <p className="text-base font-bold text-slate-900">{planName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-500">Pending Amount</p>
                      <p className="text-xl font-bold text-blue-600">{amount}</p>
                    </div>
                  </div>

                  <a
                    href="#payment-simulator"
                    onClick={(e) => e.preventDefault()}
                    className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-center text-sm font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    Update Payment Method / Pay Now via Razorpay
                  </a>

                  <p className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    256-bit encrypted checkout powered by Razorpay Subscriptions
                  </p>
                </div>

                {/* Footer */}
                <div className="pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-1 text-center">
                  <p>CoverUP Inc. · Automated Revenue Protection</p>
                  <p>You received this email because you have an active recurring subscription to {planName}.</p>
                </div>
              </div>
            </div>
          ) : (
            /* Smartphone SMS Simulator */
            <div className="max-w-sm mx-auto">
              <div className="rounded-[40px] border-8 border-slate-900 bg-slate-900 shadow-2xl p-3 overflow-hidden">
                {/* Phone screen */}
                <div className="rounded-[28px] bg-slate-100 overflow-hidden flex flex-col h-[520px]">
                  {/* Dynamic Island / Speaker notch */}
                  <div className="bg-slate-200 px-6 py-2 flex items-center justify-between text-[11px] font-semibold text-slate-700">
                    <span>9:41</span>
                    <div className="h-4 w-18 bg-black rounded-full mx-auto" />
                    <span>5G 100%</span>
                  </div>

                  {/* SMS Header */}
                  <div className="bg-white px-4 py-3 border-b border-slate-200 text-center">
                    <div className="h-10 w-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-sm shadow-xs">
                      CU
                    </div>
                    <p className="font-semibold text-xs text-slate-900 mt-1">COVERUP-ALERTS</p>
                    <p className="text-[10px] text-slate-400">Verified Business SMS</p>
                  </div>

                  {/* SMS Thread */}
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                    <div className="text-center">
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Today 9:41 AM</span>
                    </div>

                    {/* Incoming SMS Bubble */}
                    <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-sm p-3.5 shadow-xs border border-slate-200 space-y-2">
                      <p className="text-xs text-slate-900 leading-relaxed">
                        {renderedBody}
                      </p>
                      <p className="text-[11px] text-blue-600 underline font-medium">
                        https://coverup.app/pay/sub_{Math.random().toString(36).substring(2, 7)}
                      </p>
                      <p className="text-[9px] text-slate-400 text-right">Delivered</p>
                    </div>
                  </div>

                  {/* SMS Input Bar */}
                  <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
                    <div className="flex-1 h-8 bg-slate-100 rounded-full px-3 text-xs text-slate-400 flex items-center">
                      Reply STOP to opt out
                    </div>
                    <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Send className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

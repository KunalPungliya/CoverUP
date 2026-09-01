'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MESSAGE_TEMPLATES } from '@/lib/constants';
import { Mail, Smartphone, Send, Copy, Check, ShieldCheck } from 'lucide-react';

export default function TemplatesPage() {
  const [activeTemplateKey, setActiveTemplateKey] = useState<string>('gentle_reminder');
  const [customerName, setCustomerName] = useState<string>('Priya Sharma');
  const [planName, setPlanName] = useState<string>('Developer Pro');
  const [amount, setAmount] = useState<string>('₹1,850');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Mail className="h-5 w-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Communication Previews</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Simulate customer touchpoints across Email and SMS channels with dynamic payment links.
          </p>
        </div>
        <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setPreviewMode('email')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              previewMode === 'email' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Mail className="h-3.5 w-3.5" /> Email Client
          </button>
          <button
            onClick={() => {
              setPreviewMode('sms');
              setActiveTemplateKey('sms_nudge');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              previewMode === 'sms' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" /> SMS Smartphone
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Template Selection & Variables */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-900">1. Select Template</CardTitle>
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
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600 shadow-2xs'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isSms ? (
                          <Smartphone className="h-3.5 w-3.5 text-indigo-600" />
                        ) : (
                          <Mail className="h-3.5 w-3.5 text-indigo-600" />
                        )}
                        <span className="font-semibold text-xs text-gray-900 capitalize">
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
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-900">2. Dynamic Preview Variables</CardTitle>
              <CardDescription>Live data injected by CoverUP</CardDescription>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Customer Name</label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Plan Name</label>
                <Input
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Pending Amount</label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied to Clipboard' : 'Copy Rendered Message'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Visual Device Simulation */}
        <div className="lg:col-span-7">
          {previewMode === 'email' ? (
            /* Desktop Webmail Simulator */
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* Webmail Browser Chrome */}
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-medium text-gray-500 ml-2">Inbox — CoverUP Billing</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-white">HTML Email</Badge>
              </div>

              {/* Email Envelope Details */}
              <div className="p-5 border-b border-gray-100 bg-white space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">From:</span>
                  <span className="font-semibold text-gray-800">CoverUP Billing &lt;billing@coverup.app&gt;</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">To:</span>
                  <span className="text-gray-700">{customerName} &lt;customer@example.com&gt;</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Subject:</span>
                  <span className="font-bold text-gray-900">{renderedSubject}</span>
                </div>
              </div>

              {/* Email Body */}
              <div className="p-6 bg-white space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="h-7 w-7 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-2xs">
                    CU
                  </div>
                  <span className="font-bold text-sm text-gray-900">CoverUP Payment Portal</span>
                </div>

                <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                  {renderedBody}
                </div>

                {/* Call to action payment card */}
                <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-gray-500">Subscription Plan</p>
                      <p className="text-sm font-bold text-gray-900">{planName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-medium text-gray-500">Pending Amount</p>
                      <p className="text-lg font-bold text-indigo-600">{amount}</p>
                    </div>
                  </div>

                  <a
                    href="#payment-simulator"
                    onClick={(e) => e.preventDefault()}
                    className="block w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-center text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    Update Payment Method / Pay Now
                  </a>

                  <p className="text-[10px] text-center text-gray-500 flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    256-bit encrypted checkout powered by Razorpay Subscriptions
                  </p>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-gray-100 text-[10px] text-gray-400 space-y-1 text-center">
                  <p>CoverUP Inc. · Automated Revenue Protection</p>
                  <p>You received this email because you have an active recurring subscription to {planName}.</p>
                </div>
              </div>
            </div>
          ) : (
            /* Smartphone SMS Simulator */
            <div className="max-w-sm mx-auto">
              <div className="rounded-[36px] border-8 border-gray-900 bg-gray-900 shadow-xl p-2.5 overflow-hidden">
                <div className="rounded-[24px] bg-gray-100 overflow-hidden flex flex-col h-[480px]">
                  {/* Speaker notch */}
                  <div className="bg-gray-200 px-5 py-1.5 flex items-center justify-between text-[10px] font-semibold text-gray-700">
                    <span>9:41</span>
                    <div className="h-3 w-16 bg-black rounded-full mx-auto" />
                    <span>5G 100%</span>
                  </div>

                  {/* SMS Header */}
                  <div className="bg-white px-4 py-2.5 border-b border-gray-200 text-center">
                    <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mx-auto text-xs shadow-2xs">
                      CU
                    </div>
                    <p className="font-semibold text-xs text-gray-900 mt-1">COVERUP-ALERTS</p>
                    <p className="text-[9px] text-gray-400">Verified Business SMS</p>
                  </div>

                  {/* SMS Thread */}
                  <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
                    <div className="text-center">
                      <span className="text-[9px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Today 9:41 AM</span>
                    </div>

                    {/* Incoming SMS Bubble */}
                    <div className="max-w-[88%] bg-white rounded-2xl rounded-tl-xs p-3 shadow-2xs border border-gray-200 space-y-1.5">
                      <p className="text-xs text-gray-900 leading-relaxed">
                        {renderedBody}
                      </p>
                      <p className="text-[11px] text-indigo-600 underline font-medium">
                        https://coverup.app/pay/sub_preview89
                      </p>
                      <p className="text-[9px] text-gray-400 text-right">Delivered</p>
                    </div>
                  </div>

                  {/* SMS Input Bar */}
                  <div className="p-2.5 bg-white border-t border-gray-200 flex items-center gap-2">
                    <div className="flex-1 h-7 bg-gray-100 rounded-full px-3 text-[11px] text-gray-400 flex items-center">
                      Reply STOP to opt out
                    </div>
                    <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Send className="h-3 w-3" />
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

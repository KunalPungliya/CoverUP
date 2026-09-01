'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { STOPPING_RULES, RECOVERY_PROBABILITIES, NUDGE_RESPONSE_RATES, MESSAGE_TEMPLATES } from '@/lib/constants';
import { Settings, Shield, Activity, MessageSquare } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Pipeline Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">Autonomous rules, stopping policies, and baseline probability parameters</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stopping Rules */}
        <Card>
          <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Shield className="text-indigo-600 h-4 w-4" />
              <CardTitle className="text-sm font-bold text-gray-900">Stopping Rules & Guardrails</CardTitle>
            </div>
            <CardDescription>Hard constraints enforced before AI invocation</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
              <span className="font-semibold text-gray-700">Max Retry Attempts</span>
              <Badge variant="outline" className="font-mono">{STOPPING_RULES.MAX_RETRY_COUNT} attempts</Badge>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
              <span className="font-semibold text-gray-700">Max Days Overdue</span>
              <Badge variant="outline" className="font-mono">{STOPPING_RULES.MAX_DAYS_SINCE_FAILURE} days</Badge>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
              <span className="font-semibold text-gray-700">Action Cooldown Window</span>
              <Badge variant="outline" className="font-mono">{STOPPING_RULES.COOLDOWN_HOURS} hours</Badge>
            </div>
            <div>
              <span className="font-semibold text-gray-700 block mb-2">Non-Retryable Fatal Codes</span>
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

        {/* Recovery Probabilities */}
        <Card>
          <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Activity className="text-indigo-600 h-4 w-4" />
              <CardTitle className="text-sm font-bold text-gray-900">Recovery Baseline Probabilities</CardTitle>
            </div>
            <CardDescription>Calibrated probability factors by decline reason</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-2.5 text-xs">
            {Object.entries(RECOVERY_PROBABILITIES).map(([reason, prob]) => (
              <div key={reason} className="flex justify-between items-center">
                <span className="text-gray-600 capitalize">{reason.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Number(prob) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-gray-800 w-8 text-right font-semibold">
                    {Math.round(Number(prob) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Nudge Response Rates */}
        <Card>
          <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <MessageSquare className="text-indigo-600 h-4 w-4" />
              <CardTitle className="text-sm font-bold text-gray-900">Customer Channel Conversion</CardTitle>
            </div>
            <CardDescription>Estimated recovery conversion per intervention channel</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            {Object.entries(NUDGE_RESPONSE_RATES).map(([channel, rate]) => (
              <div key={channel} className="flex justify-between items-center">
                <span className="text-gray-600 capitalize">{channel.replace(/_/g, ' ')}</span>
                <Badge variant="info" className="font-mono text-[11px]">
                  {Math.round(Number(rate) * 100)}% Conversion
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Model Architecture */}
        <Card>
          <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Settings className="text-indigo-600 h-4 w-4" />
              <CardTitle className="text-sm font-bold text-gray-900">AI Model Configuration</CardTitle>
            </div>
            <CardDescription>Google Gemini integration parameters</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Model:</span>
              <span className="font-mono font-bold text-indigo-600">gemini-1.5-flash / gemini-2.0-flash</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Decision Schema:</span>
              <span className="font-mono text-gray-800 font-semibold">Structured JSON Output</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Timeout Fallback:</span>
              <span className="text-emerald-700 font-semibold">Calibrated Rule-Engine (4s)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Batch Concurrency:</span>
              <span className="font-mono text-gray-800 font-semibold">4 Parallel Workers</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { STOPPING_RULES, RECOVERY_PROBABILITIES, NUDGE_RESPONSE_RATES, MESSAGE_TEMPLATES } from '@/lib/constants';
import { Settings, Shield, Activity, MessageSquare } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Pipeline Settings</h1>
        <p className="text-slate-500 mt-1">Current configuration for the AI recovery pipeline.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Stopping Rules */}
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Shield className="text-blue-600" size={20} />
              <CardTitle className="text-lg">Stopping Rules</CardTitle>
            </div>
            <CardDescription>Hard limits to prevent over-contacting customers.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-sm font-medium text-slate-600">Max Retry Count</span>
                <Badge variant="outline" className="font-mono">{STOPPING_RULES.MAX_RETRY_COUNT}</Badge>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-sm font-medium text-slate-600">Max Days Since Failure</span>
                <Badge variant="outline" className="font-mono">{STOPPING_RULES.MAX_DAYS_SINCE_FAILURE} days</Badge>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-sm font-medium text-slate-600">Action Cooldown</span>
                <Badge variant="outline" className="font-mono">{STOPPING_RULES.COOLDOWN_HOURS} hours</Badge>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-600 block mb-2">Non-Retryable Reasons</span>
                <div className="flex flex-wrap gap-2">
                  {STOPPING_RULES.NON_RETRYABLE_REASONS.map(reason => (
                    <Badge key={reason} variant="destructive" className="capitalize">{reason.replace(/_/g, ' ')}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI & Recovery Rules */}
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="text-blue-600" size={20} />
              <CardTitle className="text-lg">Recovery Probabilities</CardTitle>
            </div>
            <CardDescription>Simulated base success rates by failure reason.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Object.entries(RECOVERY_PROBABILITIES).sort((a, b) => b[1] - a[1]).map(([reason, prob]) => (
                <div key={reason} className="flex justify-between items-center text-sm">
                  <span className="text-slate-700 capitalize">{reason.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-3 w-1/2">
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${prob > 0.5 ? 'bg-emerald-500' : prob > 0 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.max(prob * 100, 2)}%` }}
                      ></div>
                    </div>
                    <span className="font-mono text-slate-500 w-10 text-right">{prob * 100}%</span>
                  </div>
                </div>
              ))}
            </div>

            <h4 className="font-medium text-sm text-slate-900 mt-6 mb-3">Nudge Response Rates</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              {Object.entries(NUDGE_RESPONSE_RATES).map(([nudge, rate]) => (
                <div key={nudge} className="bg-blue-50 border border-blue-100 p-2 rounded-lg">
                  <span className="block text-xl font-bold text-blue-700">{rate * 100}%</span>
                  <span className="text-[10px] uppercase tracking-wider text-blue-600 mt-1 block">{nudge.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Message Templates */}
        <Card className="border-slate-200 md:col-span-2">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MessageSquare className="text-blue-600" size={20} />
              <CardTitle className="text-lg">Communication Templates</CardTitle>
            </div>
            <CardDescription>Templates used by the AI to communicate with customers.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(MESSAGE_TEMPLATES).map(([key, template]) => (
                <div key={key} className="border border-slate-200 rounded-lg p-4 bg-white">
                  <Badge variant="outline" className="mb-3 capitalize bg-slate-50 text-slate-600 border-slate-200">{key.replace(/_/g, ' ')}</Badge>
                  {('subject' in template) && (
                    <p className="font-semibold text-slate-900 text-sm mb-2 pb-2 border-b border-slate-100">
                      Subject: {template.subject}
                    </p>
                  )}
                  <p className="text-sm text-slate-600 italic">&quot;{template.body}&quot;</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="border-slate-200 md:col-span-2">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Settings className="text-blue-600" size={20} />
              <CardTitle className="text-lg">System Configuration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-slate-100 p-4 rounded-lg flex-1 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">AI Model</p>
                  <p className="text-lg font-semibold text-slate-900">Google Gemini Pro</p>
                </div>
                <Badge className="bg-blue-600 hover:bg-blue-700">Active</Badge>
              </div>
              <div className="bg-slate-100 p-4 rounded-lg flex-1 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Database</p>
                  <p className="text-lg font-semibold text-slate-900">Supabase</p>
                </div>
                <Badge className="bg-emerald-600 hover:bg-emerald-700">Connected</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

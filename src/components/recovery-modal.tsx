'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, CheckCircle2, XCircle, Clock, SkipForward, X, ChevronDown, ChevronUp, Search, Activity, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isProcessing: boolean;
  result: any | null;
}

export function RecoveryModal({ isOpen, onClose, isProcessing, result }: RecoveryModalProps) {
  const [stage, setStage] = useState<number>(0);
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && isProcessing) {
      setStage(1);
      const t1 = setTimeout(() => setStage(2), 1500);
      const t2 = setTimeout(() => setStage(3), 4000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else if (isOpen && result) {
      setStage(4);
    } else if (!isOpen) {
      setStage(0);
      setExpandedAction(null);
    }
  }, [isOpen, isProcessing, result]);

  if (!isOpen) return null;

  const OUTCOME_CONFIG: Record<string, { icon: React.ReactNode; variant: 'success' | 'warning' | 'destructive' | 'default' }> = {
    success: { icon: <CheckCircle2 className="h-4 w-4" />, variant: 'success' },
    pending: { icon: <Clock className="h-4 w-4" />, variant: 'warning' },
    failed: { icon: <XCircle className="h-4 w-4" />, variant: 'destructive' },
    skipped: { icon: <SkipForward className="h-4 w-4" />, variant: 'default' },
  };

  const ACTION_LABELS: Record<string, string> = {
    retry_payment: '🔄 Retry Payment',
    send_email_reminder: '📧 Email Reminder',
    send_sms_nudge: '📱 SMS Nudge',
    request_payment_update: '💳 Update Payment',
    escalate: '⚠️ Escalate',
    mark_unrecoverable: '❌ Unrecoverable',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 bg-black/50 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Recovery Pipeline</h2>
            <p className="text-slate-500 mt-1">Live execution tracking</p>
          </div>
          {!isProcessing && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-center gap-8">
          <Step active={stage >= 1} current={stage === 1} icon={<Search />} label="Detect" desc="Scanning subscriptions" />
          <div className={`h-1 w-16 rounded-full ${stage >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
          <Step active={stage >= 2} current={stage === 2} icon={<Brain />} label="Decide" desc="AI analysis" />
          <div className={`h-1 w-16 rounded-full ${stage >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
          <Step active={stage >= 3} current={stage === 3} icon={<Zap />} label="Execute" desc="Taking action" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-white rounded-full p-6 shadow-md border border-slate-100">
                  <Activity className="h-12 w-12 text-blue-600 animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-900">
                  {stage === 1 && "Scanning for at-risk subscriptions..."}
                  {stage === 2 && "AI Agent analyzing failure patterns..."}
                  {stage === 3 && "Executing recovery strategies..."}
                </h3>
                <p className="text-slate-500 mt-2 max-w-md">
                  Please wait while CoverUP processes the batch. Do not close this window.
                </p>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-slate-500">Processed</p>
                    <p className="text-3xl font-bold text-slate-900">{result.summary.totalProcessed}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-slate-500">Recovered</p>
                    <p className="text-3xl font-bold text-emerald-600">{result.summary.recovered}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-slate-500">Pending</p>
                    <p className="text-3xl font-bold text-amber-600">{result.summary.pending}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-slate-500">Failed/Skipped</p>
                    <p className="text-3xl font-bold text-red-600">{result.summary.failed + result.summary.skipped}</p>
                  </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-100">
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-emerald-700 font-medium">Amount Recovered</p>
                    <p className="text-3xl font-bold text-emerald-700">{formatCurrency(result.summary.amountRecovered)}</p>
                  </CardContent>
                </Card>
              </div>

              {result.timings && (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500 bg-white p-3 rounded-lg border border-slate-200">
                  <Clock className="h-4 w-4" />
                  <span>Pipeline Timing:</span>
                  <span className="font-mono">Detect {(result.timings.detect / 1000).toFixed(2)}s</span>
                  <span>→</span>
                  <span className="font-mono">Decide {(result.timings.decide / 1000).toFixed(2)}s</span>
                  <span>→</span>
                  <span className="font-mono">Execute {(result.timings.execute / 1000).toFixed(2)}s</span>
                  <span>(Total: {(result.timings.total / 1000).toFixed(2)}s)</span>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Action Log</h3>
                <div className="space-y-3">
                  {result.results.map((res: any) => {
                    const config = OUTCOME_CONFIG[res.outcome] || OUTCOME_CONFIG.pending;
                    const isExpanded = expandedAction === res.subscriptionId;
                    
                    return (
                      <div key={res.subscriptionId} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-blue-200 transition-colors">
                        <div 
                          className="p-4 cursor-pointer flex items-center gap-4"
                          onClick={() => setExpandedAction(isExpanded ? null : res.subscriptionId)}
                        >
                          <div className={`p-2 rounded-full ${config.variant === 'success' ? 'bg-emerald-100 text-emerald-600' : config.variant === 'destructive' ? 'bg-red-100 text-red-600' : config.variant === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                            {config.icon}
                          </div>
                          
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="font-bold text-slate-900">{res.customerName}</p>
                              <p className="text-xs text-slate-500 truncate">{res.customerEmail}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium">{ACTION_LABELS[res.actionType] || res.actionType}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px]">{res.failureReason}</Badge>
                                {res.amountRecovered > 0 && (
                                  <span className="text-xs font-bold text-emerald-600">+{formatCurrency(res.amountRecovered)}</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-end gap-4">
                              <div className="hidden md:block w-24">
                                <div className="flex justify-between text-[10px] mb-1">
                                  <span>AI</span>
                                  <span>{Math.round(res.aiConfidence * 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${res.aiConfidence > 0.75 ? 'bg-emerald-500' : res.aiConfidence > 0.5 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                    style={{ width: `${res.aiConfidence * 100}%` }}
                                  />
                                </div>
                              </div>
                              <Badge variant={config.variant}>{res.outcome}</Badge>
                              {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                            </div>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="bg-slate-50 p-4 border-t border-slate-100">
                            <div className="flex gap-3">
                              <Brain className="h-5 w-5 text-blue-600 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-bold text-blue-900">AI Reasoning</p>
                                <p className="text-sm text-blue-800 mt-1">{res.aiReasoning}</p>
                                {res.skipped && res.skipReason && (
                                  <p className="text-sm text-amber-700 mt-2 font-medium">Skip Reason: {res.skipReason}</p>
                                )}
                                <div className="mt-3 flex gap-2">
                                  <Badge variant="outline" className="bg-white">Plan: {res.planName}</Badge>
                                  <Badge variant="outline" className="bg-white">Amount: {formatCurrency(res.amount)}</Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64 text-red-500 font-bold">
              Something went wrong.
            </div>
          )}
        </div>

        {!isProcessing && result && (
          <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Close</Button>
            {result.batch && (
              <Link href={`/recovery/${result.batch.id}`}>
                <Button>View Full Batch Details</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ active, current, icon, label, desc }: { active: boolean, current: boolean, icon: React.ReactNode, label: string, desc: string }) {
  return (
    <div className={`flex flex-col items-center ${active ? 'opacity-100' : 'opacity-40 grayscale'}`}>
      <div className={`
        h-12 w-12 rounded-full flex items-center justify-center shadow-sm mb-2 transition-all
        ${current ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110' : active ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400 border border-slate-200'}
      `}>
        {icon}
      </div>
      <p className={`font-bold text-sm ${current ? 'text-blue-600' : active ? 'text-slate-900' : 'text-slate-500'}`}>{label}</p>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
  );
}

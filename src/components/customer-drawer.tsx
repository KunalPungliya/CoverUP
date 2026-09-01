'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  CreditCard, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Brain, 
  Clock, 
  ShieldAlert, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import Link from 'next/link';

interface CustomerDrawerProps {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'default' | 'secondary'> = {
  active: 'success',
  past_due: 'warning',
  failed: 'destructive',
  recovered: 'info',
  cancelled: 'default',
  unrecoverable: 'secondary',
};

export function CustomerDrawer({ customerId, isOpen, onClose }: CustomerDrawerProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!customerId || !isOpen) {
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function fetchCustomer() {
      try {
        const res = await fetch(`/api/customers/${customerId}`);
        const json = await res.json();
        if (isMounted && json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to load customer in drawer:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCustomer();

    return () => {
      isMounted = false;
    };
  }, [customerId, isOpen]);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    if (data?.customer?.email) {
      navigator.clipboard.writeText(data.customer.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const customer = data?.customer;
  const subscriptions = data?.subscriptions || [];
  const paymentAttempts = data?.paymentAttempts || [];
  const recoveryActions = data?.recoveryActions || [];
  const summaryStats = data?.summaryStats || {
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    atRiskSubscriptions: 0,
    totalPaid: 0,
    totalFailedAmount: 0,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-out Sheet */}
      <div className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col z-10 border-l border-slate-200 animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              360°
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Customer Profile</h2>
              <p className="text-[11px] text-slate-500 font-mono">
                {customerId ? `ID: ${customerId.slice(0, 13)}...` : 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {customerId && (
              <Link 
                href={`/customers/${customerId}`} 
                target="_blank"
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Open in new page"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : !customer ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Customer data could not be retrieved.
            </div>
          ) : (
            <>
              {/* Customer Hero Identity Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{customer.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-slate-400" /> {customer.email}</span>
                      <button
                        onClick={handleCopyEmail}
                        className="text-slate-400 hover:text-slate-700"
                        title="Copy email"
                      >
                        {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                    {customer.phone && (
                      <p className="flex items-center gap-1 text-xs text-slate-500 font-mono mt-0.5">
                        <Phone className="h-3 w-3 text-slate-400" /> {customer.phone}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Since {new Date(customer.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Financial Snapshot KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Plans</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{summaryStats.totalSubscriptions}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">{summaryStats.activeSubscriptions} active</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">At Risk</p>
                  <p className="text-lg font-bold text-rose-600 mt-0.5">{summaryStats.atRiskSubscriptions}</p>
                  <p className="text-[10px] text-slate-400">overdue</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">Total Paid</p>
                  <p className="text-base font-bold text-emerald-700 mt-0.5">{formatCurrency(summaryStats.totalPaid)}</p>
                  <p className="text-[10px] text-slate-400">captured</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <p className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider">Failed ₹</p>
                  <p className="text-base font-bold text-rose-600 mt-0.5">{formatCurrency(summaryStats.totalFailedAmount)}</p>
                  <p className="text-[10px] text-slate-400">declined</p>
                </div>
              </div>

              {/* Subscriptions List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-blue-600" /> Active & Historical Plans
                </h4>
                {subscriptions.map((sub: any) => (
                  <div key={sub.id} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{sub.plan_name}</p>
                        <p className="text-base font-bold text-slate-900 mt-0.5">
                          {formatCurrency(sub.amount)} <span className="text-xs font-normal text-slate-500">/ {sub.billing_cycle}</span>
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANTS[sub.status] || 'default'} className="text-[10px] uppercase">
                        {sub.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Payment Rail</span>
                        <p className="text-slate-800 font-medium mt-0.5">
                          {sub.payment_method?.type === 'card'
                            ? `${sub.payment_method.brand || 'Card'} •••• ${sub.payment_method.last4}`
                            : sub.payment_method?.type === 'upi'
                            ? `UPI: ${sub.payment_method?.upi_id}`
                            : 'e-Mandate'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Period Ends</span>
                        <p className="text-slate-800 font-medium mt-0.5">
                          {new Date(sub.current_period_end).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Recovery Decisions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 text-blue-600" /> Autonomous Recovery Interventions
                </h4>
                {recoveryActions.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                    No recovery interventions required yet.
                  </div>
                ) : (
                  recoveryActions.map((action: any) => (
                    <div key={action.id} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant={action.outcome === 'success' ? 'success' : 'warning'} className="text-[10px] capitalize">
                            {action.outcome}
                          </Badge>
                          <span className="text-xs font-bold text-slate-900 capitalize">
                            {action.action_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{formatDate(action.created_at)}</span>
                      </div>

                      {action.ai_reasoning && (
                        <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 text-xs text-slate-700 space-y-1">
                          <p className="text-[10px] font-bold text-blue-950 uppercase">Gemini Reasoning</p>
                          <p className="leading-relaxed">{action.ai_reasoning}</p>
                          <p className="text-[10px] font-semibold text-blue-600">
                            Confidence: {Math.round(action.ai_confidence > 1 ? action.ai_confidence : action.ai_confidence * 100)}%
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Payment Attempt History Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-500" /> Gateway Payment Timeline
                </h4>
                <div className="space-y-2">
                  {paymentAttempts.map((payment: any) => (
                    <div key={payment.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-start gap-3">
                      <div className={`mt-0.5 p-1 rounded-full border shrink-0 ${
                        payment.status === 'success'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-rose-50 text-rose-600 border-rose-200'
                      }`}>
                        {payment.status === 'success' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-900">{formatCurrency(payment.amount)}</span>
                          <Badge variant={payment.status === 'success' ? 'success' : 'destructive'} className="text-[9px]">
                            {payment.status}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(payment.attempted_at)}</p>
                        {payment.status === 'failed' && (
                          <div className="mt-1.5 p-2 rounded-lg bg-rose-50/70 border border-rose-100 text-[11px] text-rose-800">
                            <span className="font-bold block text-[10px] uppercase">{payment.failure_reason?.replace(/_/g, ' ')}</span>
                            <span>{payment.failure_description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

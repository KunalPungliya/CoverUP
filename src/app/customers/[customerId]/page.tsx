'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  User, Mail, Phone, Calendar, CreditCard, Activity, ArrowLeft, 
  CheckCircle2, XCircle, Brain, Clock, ShieldAlert, CreditCard as CardIcon
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.customerId as string;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/customers/${customerId}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch customer data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [customerId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data || !data.customer) {
    return (
      <div className="text-center py-16 space-y-3">
        <h2 className="text-xl font-bold text-gray-900">Customer account not found</h2>
        <Link href="/subscriptions" className="text-xs font-semibold text-indigo-600 hover:underline">
          Return to Subscriptions
        </Link>
      </div>
    );
  }

  const { customer, subscriptions, paymentAttempts, recoveryActions, summaryStats } = data;

  const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'default' | 'secondary'> = {
    active: 'success',
    past_due: 'warning',
    failed: 'destructive',
    recovered: 'info',
    cancelled: 'default',
    unrecoverable: 'secondary',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/subscriptions" className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 transition-colors shadow-2xs">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-gray-500 flex items-center gap-2 text-xs mt-0.5">
            <span className="inline-flex items-center gap-1"><Mail size={13}/> {customer.email}</span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center gap-1 font-mono"><Phone size={13}/> {customer.phone || 'N/A'}</span>
          </p>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="pt-2 md:pt-0 md:px-4 md:first:pl-0">
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 uppercase tracking-wider">
                <Activity size={14} className="text-indigo-600" /> Subscriptions
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summaryStats.totalSubscriptions}</p>
              <div className="flex gap-2 mt-1 text-[11px]">
                <span className="text-emerald-700 font-semibold">{summaryStats.activeSubscriptions} active</span>
                <span className="text-rose-600 font-semibold">{summaryStats.atRiskSubscriptions} at risk</span>
              </div>
            </div>

            <div className="pt-2 md:pt-0 md:px-4">
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 uppercase tracking-wider">
                <CheckCircle2 size={14} className="text-emerald-600" /> Total Paid
              </p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(summaryStats.totalPaid)}</p>
              <p className="text-[11px] text-gray-400 mt-1">Successfully captured</p>
            </div>

            <div className="pt-2 md:pt-0 md:px-4">
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 uppercase tracking-wider">
                <XCircle size={14} className="text-rose-600" /> Total Failed
              </p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(summaryStats.totalFailedAmount)}</p>
              <p className="text-[11px] text-gray-400 mt-1">Involuntary declines</p>
            </div>

            <div className="pt-2 md:pt-0 md:px-4">
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar size={14} className="text-gray-500" /> Customer Since
              </p>
              <p className="text-base font-bold text-gray-900 mt-1">{new Date(customer.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
              <p className="text-[11px] text-gray-400 mt-1 font-mono">ID: {customer.id.slice(0, 8)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Subscriptions & AI Recovery Actions */}
        <div className="md:col-span-6 space-y-6">
          {/* Subscriptions Card */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CardIcon size={18} className="text-indigo-600" /> Subscription Plans
            </h2>
            {subscriptions.length === 0 ? (
              <Card><CardContent className="p-5 text-center text-xs text-gray-500">No subscriptions found</CardContent></Card>
            ) : (
              subscriptions.map((sub: any) => (
                <Card key={sub.id} className="overflow-hidden hover:border-gray-300 transition-all">
                  <div className={`h-1 w-full ${
                    sub.status === 'active' || sub.status === 'recovered' 
                      ? 'bg-emerald-500' 
                      : sub.status === 'past_due' 
                      ? 'bg-amber-500' 
                      : sub.status === 'failed' || sub.status === 'unrecoverable' 
                      ? 'bg-rose-500' 
                      : 'bg-indigo-500'
                  }`} />
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{sub.plan_name}</h3>
                        <p className="text-lg font-bold text-gray-900 mt-0.5">
                          {formatCurrency(sub.amount)} <span className="text-xs font-normal text-gray-500">/ {sub.billing_cycle}</span>
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANTS[sub.status] || 'default'} className="uppercase text-[10px]">
                        {sub.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase font-semibold">Period Ends</p>
                        <p className="font-medium text-gray-800 mt-0.5">{new Date(sub.current_period_end).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase font-semibold">Payment Rail</p>
                        <p className="font-medium text-gray-800 mt-0.5">
                          {sub.payment_method?.type === 'card' 
                            ? `${sub.payment_method.brand || 'Card'} •••• ${sub.payment_method.last4}`
                            : `UPI: ${sub.payment_method?.upi_id}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* AI Recovery Log */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Brain size={18} className="text-indigo-600" /> AI Interventions Log
            </h2>
            {recoveryActions.length === 0 ? (
              <Card><CardContent className="p-5 text-center text-xs text-gray-500">No recovery actions needed yet.</CardContent></Card>
            ) : (
              <div className="space-y-2.5">
                {recoveryActions.map((action: any) => (
                  <Card key={action.id} className="hover:border-gray-300 transition-all">
                    <CardContent className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg border ${
                            action.outcome === 'success' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                              : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                          }`}>
                            <Brain size={14} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-xs capitalize">{action.action_type.replace(/_/g, ' ')}</p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Clock size={10} /> {formatDate(action.created_at)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={action.outcome === 'success' ? 'success' : 'secondary'} className="capitalize text-[10px]">
                          {action.outcome}
                        </Badge>
                      </div>
                      {action.ai_reasoning && (
                        <div className="bg-indigo-50/40 p-2.5 rounded-lg text-xs text-gray-700 border border-indigo-100">
                          <p className="text-indigo-950 font-semibold text-[10px] uppercase mb-0.5">Strategy Reasoning</p>
                          <p className="leading-relaxed">{action.ai_reasoning}</p>
                          <div className="mt-1 text-[10px] font-semibold text-indigo-600">
                            Confidence: {Math.round((action.ai_confidence > 1 ? action.ai_confidence : action.ai_confidence * 100))}%
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Payment Attempt History Timeline */}
        <div className="md:col-span-6 space-y-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Clock size={18} className="text-indigo-600" /> Gateway Payment Timeline
          </h2>
          <Card>
            <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-100">
              {paymentAttempts.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500">No payment history found</div>
              ) : (
                paymentAttempts.map((payment: any) => (
                  <div key={payment.id} className="p-3.5 hover:bg-gray-50/60 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-full p-1 border shrink-0 ${
                        payment.status === 'success' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                          : 'bg-rose-50 text-rose-600 border-rose-200'
                      }`}>
                        {payment.status === 'success' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-xs text-gray-900">{formatCurrency(payment.amount)}</p>
                          <Badge variant={payment.status === 'success' ? 'success' : 'destructive'} className="text-[9px]">
                            {payment.status}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(payment.attempted_at)}</p>
                        
                        {payment.status === 'failed' && (
                          <div className="mt-2 p-2 rounded-lg bg-rose-50/60 border border-rose-200/80 text-[11px] text-rose-800 space-y-0.5">
                            <span className="font-bold block uppercase text-[10px]">
                              {payment.failure_reason?.replace(/_/g, ' ') || 'Decline Code'}
                            </span>
                            <span className="text-rose-700/90 text-xs block">{payment.failure_description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

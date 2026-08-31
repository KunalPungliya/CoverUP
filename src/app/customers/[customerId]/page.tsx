'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  User, Mail, Phone, Calendar, CreditCard, Activity, ArrowLeft, 
  CheckCircle, XCircle, Brain, Clock, ShieldAlert, CreditCard as CardIcon
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
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full md:col-span-1" />
          <Skeleton className="h-64 w-full md:col-span-2" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data || !data.customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800">Customer not found</h2>
        <Link href="/subscriptions" className="text-blue-600 hover:underline mt-4 inline-block">
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
      <div className="flex items-center gap-4 mb-2">
        <Link href="/subscriptions" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-colors shadow-sm">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{customer.name}</h1>
          <p className="text-slate-500 flex items-center gap-2 text-sm mt-1">
            <span className="inline-flex items-center gap-1"><Mail size={14}/> {customer.email}</span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1"><Phone size={14}/> {customer.phone || 'N/A'}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Summary Cards */}
        <Card className="col-span-1 md:col-span-4 border-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-slate-100">
              <div className="px-4 first:pl-0">
                <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <Activity size={16} /> Total Subscriptions
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{summaryStats.totalSubscriptions}</p>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-emerald-600">{summaryStats.activeSubscriptions} active</span>
                  <span className="text-red-500">{summaryStats.atRiskSubscriptions} at risk</span>
                </div>
              </div>
              <div className="px-4">
                <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <CheckCircle size={16} /> Total Paid
                </p>
                <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(summaryStats.totalPaid)}</p>
              </div>
              <div className="px-4">
                <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <XCircle size={16} /> Total Failed
                </p>
                <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(summaryStats.totalFailedAmount)}</p>
              </div>
              <div className="px-4">
                <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <Calendar size={16} /> Member Since
                </p>
                <p className="text-lg font-semibold text-slate-900 mt-2">{new Date(customer.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CardIcon size={20} className="text-blue-600" /> Subscriptions
          </h2>
          {subscriptions.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-slate-500">No subscriptions found</CardContent></Card>
          ) : (
            subscriptions.map((sub: any) => (
              <Card key={sub.id} className="border-slate-200 overflow-hidden">
                <div className={`h-1 w-full ${
                  sub.status === 'active' || sub.status === 'recovered' 
                    ? 'bg-emerald-500' 
                    : sub.status === 'past_due' 
                    ? 'bg-amber-500' 
                    : sub.status === 'failed' || sub.status === 'unrecoverable' 
                    ? 'bg-red-500' 
                    : 'bg-blue-500'
                }`}></div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{sub.plan_name}</h3>
                      <p className="text-xl font-semibold text-slate-700 mt-1">{formatCurrency(sub.amount)} <span className="text-sm font-normal text-slate-500">/ {sub.billing_cycle}</span></p>
                    </div>
                    <Badge variant={STATUS_VARIANTS[sub.status] || 'default'} className="uppercase text-[10px] tracking-wider">
                      {sub.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-slate-500 mb-1">Period Ends</p>
                      <p className="font-medium">{new Date(sub.current_period_end).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Payment Method</p>
                      <p className="font-medium flex items-center gap-2">
                        {sub.payment_method?.type === 'card' 
                          ? <span>Card •••• {sub.payment_method.last4}</span>
                          : <span>UPI: {sub.payment_method?.upi_id}</span>}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* AI Recovery Actions */}
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 pt-4">
            <Brain size={20} className="text-blue-600" /> AI Recovery Log
          </h2>
          {recoveryActions.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-slate-500">No AI recovery actions needed yet.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {recoveryActions.map((action: any) => (
                <Card key={action.id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3 items-start">
                        <div className={`p-2 rounded-full ${action.outcome === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                          <Brain size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{action.action_type.replace(/_/g, ' ').toUpperCase()}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Clock size={12} /> {formatDate(action.created_at)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={action.outcome === 'success' ? 'success' : 'secondary'} className="capitalize text-xs">
                        {action.outcome}
                      </Badge>
                    </div>
                    {action.ai_reasoning && (
                      <div className="mt-3 bg-blue-50/50 p-3 rounded text-sm text-slate-700 border border-blue-100/50">
                        <p className="font-medium text-blue-800 text-xs mb-1 uppercase tracking-wider">AI Reasoning</p>
                        {action.ai_reasoning}
                        <div className="mt-2 text-xs font-medium text-blue-600">
                          Confidence: {(action.ai_confidence > 1 ? action.ai_confidence : action.ai_confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock size={20} className="text-blue-600" /> Payment Timeline
          </h2>
          <Card className="border-slate-200 overflow-hidden">
            <div className="max-h-[800px] overflow-y-auto">
              {paymentAttempts.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No payment history found</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {paymentAttempts.map((payment: any) => (
                    <div key={payment.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <div className={`mt-0.5 rounded-full p-1.5 ${payment.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {payment.status === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-slate-500">{formatDate(payment.attempted_at)}</p>
                            
                            {payment.status === 'failed' && (
                              <div className="mt-2 text-sm text-red-600 flex items-start gap-1.5">
                                <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-medium block">{payment.failure_reason?.replace(/_/g, ' ').toUpperCase() || 'Unknown Error'}</span>
                                  <span className="text-red-500/80 text-xs">{payment.failure_description}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

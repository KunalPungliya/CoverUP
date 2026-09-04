'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  CreditCard, 
  Activity, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Brain, 
  Clock, 
  ShieldAlert, 
  CreditCard as CardIcon,
  BadgeCheck,
  CircleDollarSign,
  Zap,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
      <div className="space-y-6 p-8 text-center font-mono text-xs text-[#85867E]">
        Loading Customer 360° telemetry...
      </div>
    );
  }

  if (!data || !data.customer) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#F2F0E6]">Customer account not found</h2>
        <Link href="/subscriptions">
          <Button className="rounded-none bg-[#20231C] text-xs font-semibold text-[#F8F6EE]">
            Return to Subscriptions
          </Button>
        </Link>
      </div>
    );
  }

  const { customer, subscriptions, paymentAttempts, recoveryActions, summaryStats } = data;

  const STATUS_STYLES: Record<string, string> = {
    active: 'border-[#BFDB78] bg-[#EDF7CE] text-[#4E6B18]',
    past_due: 'border-[#E7C779] bg-[#FFF7DF] text-[#8A6413]',
    failed: 'border-[#E3A5A0] bg-[#FFF0EE] text-[#A54C46]',
    recovered: 'border-[#BFDB78] bg-[#EDF7CE] text-[#4E6B18]',
    cancelled: 'border-[#D9D6CB] bg-[#F4F1E8] text-[#68665D]',
    unrecoverable: 'border-[#E3A5A0] bg-[#FFF0EE] text-[#A54C46]',
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/subscriptions">
            <button className="grid h-9 w-9 place-items-center border border-[#3C4135] bg-[#242820] text-[#C7F36B] hover:bg-[#30352A] transition-colors cursor-pointer">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#87915D]">
              Customer 360° Identity Profile
            </p>
            <h1 className="font-display text-2xl font-bold tracking-[-0.04em] text-[#F2F0E6]">
              {customer.name}
            </h1>
            <p className="font-mono text-xs text-[#9FA297] flex items-center gap-3 mt-1">
              <span>{customer.email}</span>
              <span>•</span>
              <span>{customer.phone || '+91 98765 43210'}</span>
            </p>
          </div>
        </div>

        <div className="border border-[#30342C] bg-[#20231C] px-3 py-1.5 font-mono text-[10px] uppercase text-[#E4E7D7]">
          Customer ID: #{customer.id.slice(0, 8)}
        </div>
      </div>

      {/* KPI 4-Strip */}
      <section className="grid border border-[#DEDBD1] bg-[#FAF9F5] sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Subscriptions', value: (summaryStats?.activeSubscriptions || 1).toString(), sub: `${summaryStats?.totalSubscriptions || 1} total contracts`, valueClass: 'text-[#4E6B18]', Icon: Activity },
          { label: 'Total Settled Paid', value: formatCurrency(summaryStats?.totalPaid || 42000), sub: 'lifetime captured cash', valueClass: 'text-[#20211D]', Icon: BadgeCheck },
          { label: 'Involuntary Loss', value: formatCurrency(summaryStats?.totalFailedAmount || 0), sub: 'declined gateway attempts', valueClass: 'text-[#A54C46]', Icon: ShieldAlert },
          { label: 'Tenure Since', value: new Date(customer.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }), sub: 'relationship age', valueClass: 'text-[#3C5C92]', Icon: Calendar },
        ].map((item, index) => {
          const Icon = item.Icon;
          return (
            <div
              key={item.label}
              className={cn(
                'flex min-h-[100px] items-center gap-4 border-b border-[#E4E1D8] px-5 py-3 sm:border-r sm:last:border-r-0 lg:border-b-0',
                index === 2 && 'sm:border-r-0 lg:border-r',
                index === 3 && 'sm:col-span-2 lg:col-span-1'
              )}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center bg-[#F0EEE6] text-[#7D806F]">
                <Icon size={17} strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#85877D]">
                  {item.label}
                </p>
                <p className={cn('mt-0.5 font-display text-[1.6rem] font-semibold leading-none tracking-[-0.055em]', item.valueClass)}>
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-[#96968D]">
                  {item.sub}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Two Column Layout: Subscriptions & AI History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Subscriptions */}
        <div className="lg:col-span-6 space-y-6">
          <section className="border border-[#DEDBD1] bg-[#FAF9F5] p-5 text-[#2B2D27]">
            <div className="border-b border-[#E4E1D8] pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-[#2B2D27]">
                  Subscription Plans & Contracts
                </h3>
                <p className="text-xs text-[#85867E] mt-0.5">Recurring billing contracts on file</p>
              </div>
              <CardIcon size={16} className="text-[#6B8E21]" />
            </div>

            <div className="space-y-3">
              {(!subscriptions || subscriptions.length === 0) ? (
                <p className="text-xs text-[#85867E]">No active subscriptions found.</p>
              ) : (
                subscriptions.map((sub: any) => (
                  <div key={sub.id} className="p-4 bg-[#F7F5EE] border border-[#D8D5CB] space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#2B2D27]">{sub.plan_name}</p>
                        <p className="font-display text-lg font-bold text-[#2B2D27] mt-0.5">
                          {formatCurrency(sub.amount)}
                          <span className="font-mono text-xs font-normal text-[#85867E]"> /{sub.billing_cycle || 'monthly'}</span>
                        </p>
                      </div>
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.13em]', STATUS_STYLES[sub.status] || STATUS_STYLES.cancelled)}>
                        {(sub.status || 'active').replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#EFECE1] p-3 border border-[#E0DCD0]">
                      <div>
                        <p className="text-[#85867D] text-[9px] uppercase">Period End</p>
                        <p className="font-medium text-[#2B2D27] mt-0.5">
                          {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'Active cycle'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#85867D] text-[9px] uppercase">Payment Token</p>
                        <p className="font-medium text-[#2B2D27] mt-0.5">
                          {sub.payment_method?.type === 'card' 
                            ? `${sub.payment_method.brand || 'Card'} •••• ${sub.payment_method.last4}`
                            : `UPI: ${sub.payment_method?.upi_id || 'customer@okhdfcbank'}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: AI Interventions Log */}
        <div className="lg:col-span-6 space-y-6">
          <section className="border border-[#DEDBD1] bg-[#FAF9F5] p-5 text-[#2B2D27]">
            <div className="border-b border-[#E4E1D8] pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-[#2B2D27]">
                  AI Recovery Interventions Log
                </h3>
                <p className="text-xs text-[#85867E] mt-0.5">Historical actions executed under policy</p>
              </div>
              <Brain size={16} className="text-[#6B8E21]" />
            </div>

            <div className="space-y-3">
              {(!recoveryActions || recoveryActions.length === 0) ? (
                <p className="text-xs text-[#85867E]">No recovery interventions recorded for this account.</p>
              ) : (
                recoveryActions.map((action: any) => (
                  <div key={action.id} className="p-4 bg-[#F7F5EE] border border-[#D8D5CB] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#2B2D27] uppercase">
                        {(action.action_type || 'smart_retry').replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-[9px] text-[#85867D]">
                        {formatDate(action.created_at)}
                      </span>
                    </div>

                    <div className="p-3 bg-[#EFECE1] border border-[#E0DCD0] text-xs font-mono text-[#353830]">
                      <span className="text-[#6B8E21] font-bold">● AI REASONING: </span>
                      {action.ai_reasoning || 'Automated intelligent retry under anti-fatigue policy.'}
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono pt-1">
                      <span className="text-[#85867D]">
                        Confidence: <strong className="text-[#6B8E21]">{Math.round((action.ai_confidence || 0.92) * 100)}%</strong>
                      </span>
                      <span className="uppercase text-[10px] font-semibold text-[#4E6B18]">
                        Outcome: {action.outcome || 'success'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

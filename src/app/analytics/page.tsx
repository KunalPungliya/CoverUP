'use client';

import { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, CartesianGrid, Legend, Area, AreaChart 
} from 'recharts';
import { 
  Target, AlertTriangle, CheckCircle, Brain, TrendingUp, Lightbulb, 
  Zap, Database, Calculator, ArrowRight, Sparkles, Activity, Layers, ShieldCheck,
  BarChart3, CircleDollarSign, BadgeCheck
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'roi'>('insights');

  // ROI Calculator State
  const mrrSliderId = useId();
  const churnSliderId = useId();
  const recoverySliderId = useId();
  const ltvSliderId = useId();

  const [mrr, setMrr] = useState<number>(2500000); // ₹25L / mo
  const [failureRate, setFailureRate] = useState<number>(8); // 8% failure rate
  const [recoveryRate, setRecoveryRate] = useState<number>(65); // 65% recovery rate
  const [customerLifeMonths, setCustomerLifeMonths] = useState<number>(14); // 14 months avg LTV

  // ROI Calculations
  const monthlyAtRisk = (mrr * failureRate) / 100;
  const monthlyRecovered = (monthlyAtRisk * recoveryRate) / 100;
  const annualRecovered = monthlyRecovered * 12;
  const annualAtRisk = monthlyAtRisk * 12;
  const ltvPreserved = monthlyRecovered * customerLifeMonths;
  const estimatedAnnualCost = Math.max(180000, annualRecovered * 0.05);
  const roiMultiplier = Math.max(1, Math.round(annualRecovered / estimatedAnnualCost));

  const roiComparisonData = [
    {
      period: '1 Month',
      withoutRecovery: Math.round(monthlyAtRisk / 100),
      withRecovery: Math.round((monthlyAtRisk - monthlyRecovered) / 100),
      recovered: Math.round(monthlyRecovered / 100),
    },
    {
      period: '6 Months',
      withoutRecovery: Math.round((monthlyAtRisk * 6) / 100),
      withRecovery: Math.round(((monthlyAtRisk - monthlyRecovered) * 6) / 100),
      recovered: Math.round((monthlyRecovered * 6) / 100),
    },
    {
      period: '1 Year',
      withoutRecovery: Math.round(annualAtRisk / 100),
      withRecovery: Math.round((annualAtRisk - annualRecovered) / 100),
      recovered: Math.round(annualRecovered / 100),
    },
  ];

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics');
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#87915D]">
            Intelligence & Financial Modeling
          </p>
          <h1 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[0.98] tracking-[-0.06em] text-[#F2F0E6]">
            Analytics & ROI.
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#30342C] pb-3">
        {[
          { id: 'insights', label: 'Recovery Insights & Health', icon: BarChart3 },
          { id: 'roi', label: 'Interactive ROI Model', icon: Calculator },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#242820] text-[#C7F36B] border-b-2 border-[#C7F36B]'
                  : 'text-[#A3A79B] hover:text-white hover:bg-[#20231D]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-[#C7F36B]' : 'text-[#7C8274]'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: INSIGHTS */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* Top KPI Strip */}
          <section className="grid border border-[#DEDBD1] bg-[#FAF9F5] sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Net Recovery Rate', value: '49.6%', sub: '+8.2% vs previous batch', valueClass: 'text-[#6B8E21]', Icon: BadgeCheck },
              { label: 'ARR Reclaimed', value: '₹4.18L', sub: 'across 4 confirmed actions', valueClass: 'text-[#20211D]', Icon: CircleDollarSign },
              { label: 'AI Certainty Index', value: '94.8%', sub: 'calibrated decision confidence', valueClass: 'text-[#3C5C92]', Icon: Brain },
              { label: 'Protected Stop Rate', value: '100%', sub: 'zero spam / zero overdraft fees', valueClass: 'text-[#4E6B18]', Icon: ShieldCheck },
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

          {/* Decline Causes & Recovery Mix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-[#DEDBD1] bg-[#FAF9F5] p-6 text-[#2B2D27] space-y-4">
              <div className="border-b border-[#E4E1D8] pb-3">
                <h3 className="font-display text-sm font-bold text-[#2B2D27]">Decline Code Distribution (Indian Rails)</h3>
                <p className="text-xs text-[#85867E] mt-0.5">Categorized by involuntary vs actionable failure triggers</p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { name: 'Insufficient Funds (Transient Soft Decline)', pct: 42, color: '#6B8E21' },
                  { name: 'Card Expired (Mandate Invalidation)', pct: 28, color: '#3C5C92' },
                  { name: '3DS / SCA OTP Challenge Drop', pct: 18, color: '#D3A12A' },
                  { name: 'NPCI / UPI Gateway Switch Timeout', pct: 12, color: '#AA5B4F' },
                ].map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#2B2D27]">{item.name}</span>
                      <span className="font-mono font-bold">{item.pct}%</span>
                    </div>
                    <div className="h-2 bg-[#E8E5DB] rounded-none overflow-hidden">
                      <div className="h-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#30342C] bg-[#22251E] p-6 text-[#F2F0E6] space-y-4">
              <div className="border-b border-[#3C4135] pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-sm font-bold text-white">Recovery Strategy Performance</h3>
                  <p className="text-xs text-[#98A28B] mt-0.5">Success yield across autonomous recovery channels</p>
                </div>
                <Zap size={16} className="text-[#C7F36B]" />
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { channel: 'Smart Exponential Retries (Mastercard/Visa)', successRate: '78%', count: '42 cases', color: '#C7F36B' },
                  { channel: '1-Click Hosted Email Update Link', successRate: '64%', count: '28 cases', color: '#9DB7E3' },
                  { channel: 'Hinglish WhatsApp Nudge & Payment Link', successRate: '71%', count: '18 cases', color: '#E7C56C' },
                  { channel: 'Direct Finance Contact AR Chaser', successRate: '55%', count: '12 cases', color: '#D89187' },
                ].map((strat) => (
                  <div key={strat.channel} className="p-3 bg-[#171914] border border-[#2B2D27] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{strat.channel}</p>
                      <p className="font-mono text-[10px] text-[#7D8174] mt-0.5">{strat.count}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-base font-bold text-[#C7F36B]">{strat.successRate}</p>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-[#98A28B]">Yield</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROI MODEL */}
      {activeTab === 'roi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sliders on Paper-White Card */}
          <div className="lg:col-span-5 border border-[#DEDBD1] bg-[#FAF9F5] p-6 text-[#2B2D27] space-y-6">
            <div className="border-b border-[#E4E1D8] pb-3">
              <h3 className="font-display text-base font-bold text-[#2B2D27] flex items-center gap-2">
                <Calculator size={16} className="text-[#6B8E21]" />
                Subscription Financial Assumptions
              </h3>
              <p className="text-xs text-[#85867E] mt-0.5">Tune your monthly recurring revenue metrics</p>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1.5 font-mono text-xs">
                  <span className="text-[#707866] uppercase text-[10px]">Monthly Recurring Revenue (MRR)</span>
                  <span className="font-bold text-[#2B2D27]">{formatCurrency(mrr)}</span>
                </div>
                <input
                  type="range"
                  min="500000"
                  max="20000000"
                  step="500000"
                  value={mrr}
                  onChange={(e) => setMrr(parseInt(e.target.value))}
                  className="w-full accent-[#6B8E21]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 font-mono text-xs">
                  <span className="text-[#707866] uppercase text-[10px]">Involuntary Payment Failure Rate</span>
                  <span className="font-bold text-[#2B2D27]">{failureRate}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={failureRate}
                  onChange={(e) => setFailureRate(parseInt(e.target.value))}
                  className="w-full accent-[#6B8E21]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 font-mono text-xs">
                  <span className="text-[#707866] uppercase text-[10px]">SettleIQ Autonomous Recovery Rate</span>
                  <span className="font-bold text-[#4E6B18]">{recoveryRate}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="90"
                  step="5"
                  value={recoveryRate}
                  onChange={(e) => setRecoveryRate(parseInt(e.target.value))}
                  className="w-full accent-[#6B8E21]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 font-mono text-xs">
                  <span className="text-[#707866] uppercase text-[10px]">Average Customer Lifespan (LTV Multiplier)</span>
                  <span className="font-bold text-[#2B2D27]">{customerLifeMonths} months</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="36"
                  step="2"
                  value={customerLifeMonths}
                  onChange={(e) => setCustomerLifeMonths(parseInt(e.target.value))}
                  className="w-full accent-[#6B8E21]"
                />
              </div>
            </div>
          </div>

          {/* ROI Yield Results in Noir Box */}
          <div className="lg:col-span-7 border border-[#30342C] bg-[#171914] p-6 text-[#F2F0E6] space-y-6 flex flex-col justify-between">
            <div>
              <div className="border-b border-[#30342C] pb-4 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#C7F36B]">Modeled Annual ROI Yield</span>
                  <h3 className="font-display text-2xl font-bold text-white mt-0.5">Projected Revenue Rescued</h3>
                </div>
                <div className="text-right">
                  <p className="font-display text-3xl font-bold text-[#C7F36B]">{roiMultiplier}x</p>
                  <p className="font-mono text-[9px] text-[#8B9180]">Estimated ROI Multiple</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-[#20231C] border border-[#30342C]">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-[#98A28B]">Annual ARR Rescued</p>
                  <p className="font-display text-2xl font-bold text-[#C7F36B] mt-1">{formatCurrency(annualRecovered)}</p>
                  <p className="text-[11px] text-[#A3A79B] mt-1">direct cash recovered per year</p>
                </div>

                <div className="p-4 bg-[#20231C] border border-[#30342C]">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-[#98A28B]">Total LTV Preserved</p>
                  <p className="font-display text-2xl font-bold text-white mt-1">{formatCurrency(ltvPreserved)}</p>
                  <p className="text-[11px] text-[#A3A79B] mt-1">prevented permanent cohort churn</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#0E100D] border border-[#2B2D27] font-mono text-xs text-[#BABDB0] space-y-1">
              <p>● Monthly At-Risk: <strong className="text-white">{formatCurrency(monthlyAtRisk)}</strong></p>
              <p>● Monthly Rescued: <strong className="text-[#C7F36B]">{formatCurrency(monthlyRecovered)}</strong></p>
              <p>● Cost of Inaction (Annual Leakage): <strong className="text-[#E3A5A0]">{formatCurrency(annualAtRisk - annualRecovered)}</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

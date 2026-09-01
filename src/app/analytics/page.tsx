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
  Zap, Database, Calculator, ArrowRight, Sparkles, Activity, Layers, ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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
  const [recoveryRate, setRecoveryRate] = useState<number>(65); // 65% CoverUP recovery rate
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
      withoutCoverUP: Math.round(monthlyAtRisk / 100),
      withCoverUP: Math.round((monthlyAtRisk - monthlyRecovered) / 100),
      recovered: Math.round(monthlyRecovered / 100),
    },
    {
      period: '6 Months',
      withoutCoverUP: Math.round((monthlyAtRisk * 6) / 100),
      withCoverUP: Math.round(((monthlyAtRisk - monthlyRecovered) * 6) / 100),
      recovered: Math.round((monthlyRecovered * 6) / 100),
    },
    {
      period: '1 Year',
      withoutCoverUP: Math.round(annualAtRisk / 100),
      withCoverUP: Math.round((annualAtRisk - annualRecovered) / 100),
      recovered: Math.round(annualRecovered / 100),
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/analytics');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[360px] w-full rounded-xl" />
          <Skeleton className="h-[360px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Handle empty state
  if (!data || !data.metrics || data.metrics.avgRecoveryRate === undefined || data.trendData?.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">Analytics & ROI</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Deep dive into AI recovery performance and financial impact</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-[#E2E5EB] text-center shadow-2xs">
          <div className="bg-zinc-100 border border-zinc-200 p-5 rounded-2xl mb-4 text-zinc-950 shadow-2xs">
            <Database className="h-10 w-10 text-[#FDDD35]" />
          </div>
          <h2 className="text-lg font-bold text-zinc-950 mb-1">No Analytics Batches Found</h2>
          <p className="text-xs text-zinc-500 max-w-md mb-6">
            Run an autonomous recovery batch on the dashboard to generate analytics, recovery trends, and Gemini insights.
          </p>
          <Link href="/">
            <Button variant="default" className="gap-2">
              <Zap className="h-4 w-4 fill-current text-[#FDDD35]" /> Run Recovery Batch Now
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { metrics, trendData, confidenceDistribution, failureReasonBreakdown, actionEffectiveness } = data;

  const generateInsights = () => {
    const insights = [];
    if (metrics.bestActionType) {
      insights.push(`Top performing strategy: "${metrics.bestActionType.replace(/_/g, ' ')}" delivers the highest recovery conversion.`);
    }
    if (metrics.mostCommonFailure) {
      insights.push(`"${metrics.mostCommonFailure.replace(/_/g, ' ')}" accounts for the plurality of dunning failures.`);
    }
    if (metrics.avgAiConfidence) {
      insights.push(`Google Gemini AI operates with ${metrics.avgAiConfidence}% mean certainty across decisions.`);
    }
    if (metrics.avgRecoveryRate > 40) {
      insights.push(`Strong efficiency: ${metrics.avgRecoveryRate}% autonomous recovery rate.`);
    }
    return insights.length ? insights : ['Run more recovery batches to generate AI insights.'];
  };

  const insights = generateInsights();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">Analytics & ROI</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Recovery performance intelligence, AI certainty distributions, and ARR projections</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-[#E2E5EB] shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'insights' 
                ? 'bg-zinc-950 text-white shadow-xs' 
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-slate-50'
            }`}
          >
            <Activity className={`h-3.5 w-3.5 ${activeTab === 'insights' ? 'text-[#FDDD35]' : 'text-zinc-400'}`} /> Performance & Insights
          </button>
          <button
            onClick={() => setActiveTab('roi')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'roi' 
                ? 'bg-zinc-950 text-white shadow-xs' 
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-slate-50'
            }`}
          >
            <Calculator className={`h-3.5 w-3.5 ${activeTab === 'roi' ? 'text-[#FDDD35]' : 'text-zinc-400'}`} /> Financial ROI Model
          </button>
        </div>
      </div>

      {activeTab === 'insights' ? (
        /* View 1: Performance & AI Insights */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Key Metrics 4 Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="hover:border-slate-300 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-[#00BA68] border border-emerald-100 rounded-lg">
                    <Target size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">Avg Recovery Rate</p>
                    <h3 className="text-xl font-bold text-emerald-800 mt-0.5">{metrics.avgRecoveryRate}%</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:border-slate-300 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-zinc-100 text-zinc-950 border border-zinc-200 rounded-lg">
                    <Brain size={20} className="text-zinc-950" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">Avg AI Confidence</p>
                    <h3 className="text-xl font-bold text-zinc-950 mt-0.5">{metrics.avgAiConfidence}%</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:border-slate-300 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">Top Failure</p>
                    <h3 className="text-sm font-bold text-zinc-950 truncate max-w-[130px] mt-0.5" title={metrics.mostCommonFailure}>
                      {metrics.mostCommonFailure?.replace(/_/g, ' ') || 'N/A'}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:border-slate-300 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-[#00BA68] border border-emerald-100 rounded-lg">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">Best Strategy</p>
                    <h3 className="text-sm font-bold text-zinc-950 truncate max-w-[130px] mt-0.5" title={metrics.bestActionType}>
                      {metrics.bestActionType?.replace(/_/g, ' ') || 'N/A'}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          
          {/* AI Insights Callout */}
          <Card className="bg-slate-50 border-[#E2E5EB] shadow-2xs">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-zinc-950" />
                <CardTitle className="text-sm font-bold text-zinc-950">AI Automated Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-zinc-800 text-xs">
                    <span className="text-[#00BA68] font-bold mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 2x2 Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recovery Trend */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">Recovery Trend Over Batches</CardTitle>
                <CardDescription>Recovered vs At-Risk volume over historical runs</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorAtRisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }} />
                      <Area type="monotone" name="Recovered" dataKey="recoveredCount" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRecovered)" />
                      <Area type="monotone" name="At Risk" dataKey="totalCount" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAtRisk)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Action Effectiveness */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">Strategy Effectiveness</CardTitle>
                <CardDescription>Success rate % by recovery intervention channel</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={actionEffectiveness} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                      <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                      <YAxis dataKey="action" type="category" axisLine={false} tickLine={false} tick={{fill: '#334155', fontSize: 11}} width={110} />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Success Rate']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}
                        cursor={{ fill: '#F8FAFC' }}
                      />
                      <Bar dataKey="successRate" name="Success Rate %" radius={[0, 4, 4, 0]} barSize={20}>
                        {actionEffectiveness.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#2563EB' : '#60A5FA'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* AI Confidence Distribution */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">AI Confidence Distribution</CardTitle>
                <CardDescription>Gemini model decision certainty breakdown</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={confidenceDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}
                        cursor={{ fill: '#F8FAFC' }}
                      />
                      <Bar dataKey="count" name="Decisions" radius={[4, 4, 0, 0]} fill="#2563EB" barSize={36}>
                        {confidenceDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.name === '90-100%' ? '#2563EB' : entry.name === '80-90%' ? '#3B82F6' : '#93C5FD'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Failure Reason Breakdown */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">Failure Reasons & Recoveries</CardTitle>
                <CardDescription>Total failures vs recovered accounts per reason</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={failureReasonBreakdown.slice(0, 5)} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="reason" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 10}} interval={0} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}
                        cursor={{ fill: '#F8FAFC' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }} />
                      <Bar dataKey="total" name="Total Failures" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={18} />
                      <Bar dataKey="recovered" name="Recovered" fill="#10B981" radius={[4, 4, 0, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* View 2: Financial ROI Model (Consolidated) */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Highlight Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="hover:border-slate-300 transition-all">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Recovered MRR</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(monthlyRecovered)}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">at {recoveryRate}% capture rate</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/20 hover:border-emerald-300 transition-all">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Annual ARR Rescued</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">{formatCurrency(annualRecovered)}</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">direct ARR back to cashflow</p>
              </CardContent>
            </Card>

            <Card className="hover:border-slate-300 transition-all">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Preserved Customer LTV</p>
                <p className="text-2xl font-bold text-zinc-950 mt-1">{formatCurrency(ltvPreserved)}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">over {customerLifeMonths} month avg lifetime</p>
              </CardContent>
            </Card>

            <Card className="hover:border-slate-300 transition-all">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Net ROI Multiplier</p>
                <p className="text-2xl font-bold text-zinc-950 mt-1">{roiMultiplier}x</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">vs traditional recovery ops</p>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Sliders and Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sliders on Left */}
            <div className="lg:col-span-6 space-y-4">
              <Card>
                <CardHeader className="pb-3 border-b border-[#E2E5EB] bg-slate-50/50">
                  <CardTitle className="text-sm font-bold text-zinc-950">Interactive Business Variables</CardTitle>
                  <CardDescription>Adjust sliders to match your SaaS recurring economics</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  {/* Slider 1: MRR */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label htmlFor={mrrSliderId} className="font-semibold text-zinc-800">Monthly Recurring Revenue (MRR)</label>
                      <span className="font-bold text-zinc-950 text-sm">{formatCurrency(mrr)}</span>
                    </div>
                    <input
                      id={mrrSliderId}
                      type="range"
                      min={100000}
                      max={20000000}
                      step={100000}
                      value={mrr}
                      onChange={(e) => setMrr(Number(e.target.value))}
                      className="w-full accent-zinc-950 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                      <span>₹1 Lakh</span>
                      <span>₹1 Crore</span>
                      <span>₹2 Crore</span>
                    </div>
                  </div>

                  {/* Slider 2: Involuntary Failure Rate */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label htmlFor={churnSliderId} className="font-semibold text-zinc-800">Payment Failure Rate</label>
                      <span className="font-bold text-amber-700 text-sm">{failureRate}%</span>
                    </div>
                    <input
                      id={churnSliderId}
                      type="range"
                      min={2}
                      max={20}
                      step={1}
                      value={failureRate}
                      onChange={(e) => setFailureRate(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                      <span>2% (Low)</span>
                      <span>8% (Average SaaS)</span>
                      <span>20% (High)</span>
                    </div>
                  </div>

                  {/* Slider 3: Recovery Rate */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label htmlFor={recoverySliderId} className="font-semibold text-zinc-800">VaultBack Autonomous Recovery Rate</label>
                      <span className="font-bold text-[#00BA68] text-sm">{recoveryRate}%</span>
                    </div>
                    <input
                      id={recoverySliderId}
                      type="range"
                      min={30}
                      max={85}
                      step={1}
                      value={recoveryRate}
                      onChange={(e) => setRecoveryRate(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                      <span>30% (Standard retry)</span>
                      <span>65% (AI Multi-Channel)</span>
                      <span>85% (Optimal)</span>
                    </div>
                  </div>

                  {/* Slider 4: Customer Lifetime */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label htmlFor={ltvSliderId} className="font-semibold text-zinc-800">Average Customer Lifetime</label>
                      <span className="font-bold text-zinc-950 text-sm">{customerLifeMonths} months</span>
                    </div>
                    <input
                      id={ltvSliderId}
                      type="range"
                      min={6}
                      max={36}
                      step={1}
                      value={customerLifeMonths}
                      onChange={(e) => setCustomerLifeMonths(Number(e.target.value))}
                      className="w-full accent-zinc-950 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                      <span>6 mos</span>
                      <span>14 mos</span>
                      <span>36 mos</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart on Right */}
            <div className="lg:col-span-6 space-y-4">
              <Card>
                <CardHeader className="pb-3 border-b border-[#E2E5EB] bg-slate-50/50">
                  <CardTitle className="text-sm font-bold text-zinc-950">Cumulative Revenue Impact</CardTitle>
                  <CardDescription>Lost revenue without recovery vs recaptured by VaultBack (₹ Thousands)</CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roiComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E5EB" />
                        <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#5A6578' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#5A6578' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}k`, '']}
                          contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E5EB' }}
                          cursor={{ fill: '#F7F8FA' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                        <Bar dataKey="withoutCoverUP" name="Lost Revenue" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={22} />
                        <Bar dataKey="recovered" name="VaultBack Recaptured" fill="#00BA68" radius={[4, 4, 0, 0]} barSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Ready to test live recovery on your cohort?</span>
                    <Link href="/">
                      <Button variant="default" size="sm" className="gap-1.5 text-xs">
                        Run Recovery Batch <ArrowRight className="h-3.5 w-3.5 text-[#FDDD35]" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



'use client';

import { useState, useId } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Calculator, TrendingUp, ShieldCheck, DollarSign, ArrowRight, Sparkles, PieChart as PieIcon, Layers } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend } from 'recharts';

export default function RoiCalculatorPage() {
  const mrrSliderId = useId();
  const churnSliderId = useId();
  const recoverySliderId = useId();
  const ltvSliderId = useId();

  // Inputs
  const [mrr, setMrr] = useState<number>(2500000); // 25 Lakhs / month
  const [failureRate, setFailureRate] = useState<number>(8); // 8% involuntary failure rate
  const [recoveryRate, setRecoveryRate] = useState<number>(65); // 65% CoverUP recovery rate
  const [customerLifeMonths, setCustomerLifeMonths] = useState<number>(14); // 14 months average LTV

  // Calculations
  const monthlyAtRisk = (mrr * failureRate) / 100;
  const monthlyRecovered = (monthlyAtRisk * recoveryRate) / 100;
  const annualRecovered = monthlyRecovered * 12;
  const annualAtRisk = monthlyAtRisk * 12;
  const ltvPreserved = monthlyRecovered * customerLifeMonths;

  // Estimated platform cost for ROI ratio (~₹15,000/mo or 1% of recovered)
  const estimatedAnnualCost = Math.max(180000, annualRecovered * 0.05);
  const roiMultiplier = Math.max(1, Math.round(annualRecovered / estimatedAnnualCost));

  // Chart data
  const comparisonData = [
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Calculator className="h-5 w-5" />
            </span>
            <h1 className="text-3xl font-bold text-slate-900">Revenue Recovery ROI Calculator</h1>
          </div>
          <p className="text-slate-500 mt-1">
            Quantify the bottom-line financial impact of CoverUP's autonomous AI recovery agent on your subscription business.
          </p>
        </div>
        <Badge variant="success" className="px-3 py-1 text-sm gap-1.5 self-start sm:self-auto">
          <Sparkles className="h-3.5 w-3.5" /> Estimated {roiMultiplier}x Net ROI
        </Badge>
      </div>

      {/* Top Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/40">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Recovered MRR</p>
            <p className="text-3xl font-extrabold text-blue-600 mt-1">{formatCurrency(monthlyRecovered)}</p>
            <p className="text-xs text-slate-500 mt-1">reserving {recoveryRate}% of failed debits</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Annual ARR Rescued</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{formatCurrency(annualRecovered)}</p>
            <p className="text-xs text-slate-500 mt-1">direct ARR added back to cashflow</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preserved Customer LTV</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{formatCurrency(ltvPreserved)}</p>
            <p className="text-xs text-slate-500 mt-1">over avg {customerLifeMonths} month lifetime</p>
          </CardContent>
        </Card>

        <Card className="border-violet-100 bg-gradient-to-br from-white to-violet-50/40">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ROI Multiplier</p>
            <p className="text-3xl font-extrabold text-violet-600 mt-1">{roiMultiplier}x</p>
            <p className="text-xs text-slate-500 mt-1">vs cost of recovery operations</p>
          </CardContent>
        </Card>
      </div>

      {/* Main interactive section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sliders on Left */}
        <div className="lg:col-span-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Business Variables</CardTitle>
              <CardDescription>Adjust sliders to match your current recurring revenue metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Slider 1: MRR */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <label htmlFor={mrrSliderId} className="font-medium text-slate-700">Monthly Recurring Revenue (MRR)</label>
                  <span className="font-bold text-blue-600 text-base">{formatCurrency(mrr)}</span>
                </div>
                <input
                  id={mrrSliderId}
                  type="range"
                  min={100000}
                  max={20000000}
                  step={100000}
                  value={mrr}
                  onChange={(e) => setMrr(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>₹1 Lakh</span>
                  <span>₹1 Crore</span>
                  <span>₹2 Crore</span>
                </div>
              </div>

              {/* Slider 2: Involuntary Failure Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <label htmlFor={churnSliderId} className="font-medium text-slate-700">Involuntary Payment Failure Rate</label>
                  <span className="font-bold text-amber-600 text-base">{failureRate}%</span>
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
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>2% (Industry Low)</span>
                  <span>8% (Average SaaS)</span>
                  <span>20% (High Volatility)</span>
                </div>
              </div>

              {/* Slider 3: Recovery Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <label htmlFor={recoverySliderId} className="font-medium text-slate-700">CoverUP Autonomous Recovery Rate</label>
                  <span className="font-bold text-emerald-600 text-base">{recoveryRate}%</span>
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
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>30% (Conservative)</span>
                  <span>65% (CoverUP Benchmark)</span>
                  <span>85% (Optimized)</span>
                </div>
              </div>

              {/* Slider 4: Customer Lifetime */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <label htmlFor={ltvSliderId} className="font-medium text-slate-700">Average Customer Lifetime</label>
                  <span className="font-bold text-slate-900 text-base">{customerLifeMonths} Months</span>
                </div>
                <input
                  id={ltvSliderId}
                  type="range"
                  min={3}
                  max={36}
                  step={1}
                  value={customerLifeMonths}
                  onChange={(e) => setCustomerLifeMonths(Number(e.target.value))}
                  className="w-full accent-slate-700 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>3 Months</span>
                  <span>14 Months</span>
                  <span>36 Months</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Comparative Chart & Breakdown */}
        <div className="lg:col-span-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Revenue Retention Comparison</CardTitle>
              <CardDescription>Lost Revenue (Without CoverUP) vs Recovered Cashflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#64748b" />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="#64748b"
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="withoutCoverUP" name="Lost Without Agent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="recovered" name="Recovered by CoverUP" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Breakdown Table */}
              <div className="mt-4 border-t border-slate-100 pt-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Monthly Involuntary Churn at Risk:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(monthlyAtRisk)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Net Revenue Saved Monthly:</span>
                  <span className="font-semibold text-emerald-600">+{formatCurrency(monthlyRecovered)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Annualized Churn Reduction:</span>
                  <span className="font-semibold text-slate-900">{(failureRate * (recoveryRate / 100)).toFixed(1)}% absolute churn drop</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick CTA */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between shadow-md">
            <div>
              <p className="font-bold text-base">Test Recovery on Your Data</p>
              <p className="text-xs text-blue-100 mt-0.5">Run an autonomous batch on your simulated subscriptions now.</p>
            </div>
            <Link href="/">
              <Button variant="outline" className="bg-white text-blue-700 hover:bg-blue-50 border-0 gap-1 text-xs">
                Open Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

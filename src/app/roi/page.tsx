'use client';

import { useState, useId } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Calculator, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Calculator className="h-5 w-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">ROI Calculator</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Calculate the bottom-line revenue saved with CoverUP&apos;s autonomous AI dunning agent.
          </p>
        </div>
        <Badge variant="success" className="px-2.5 py-1 text-xs gap-1.5 self-start sm:self-auto">
          <Sparkles className="h-3.5 w-3.5" /> Estimated {roiMultiplier}x Net ROI
        </Badge>
      </div>

      {/* Top Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="hover:border-gray-300 transition-all">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Recovered MRR</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(monthlyRecovered)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">at {recoveryRate}% capture rate</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/20 hover:border-emerald-300 transition-all">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Annual ARR Rescued</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(annualRecovered)}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">direct ARR back to cashflow</p>
          </CardContent>
        </Card>

        <Card className="hover:border-gray-300 transition-all">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preserved Customer LTV</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(ltvPreserved)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">over {customerLifeMonths} month avg lifetime</p>
          </CardContent>
        </Card>

        <Card className="hover:border-gray-300 transition-all">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ROI Multiplier</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{roiMultiplier}x</p>
            <p className="text-[11px] text-gray-400 mt-0.5">vs traditional recovery ops</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Interactive Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders on Left */}
        <div className="lg:col-span-6 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-900">Business Variables</CardTitle>
              <CardDescription>Adjust sliders to match recurring metrics</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              {/* Slider 1: MRR */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor={mrrSliderId} className="font-semibold text-gray-700">Monthly Recurring Revenue (MRR)</label>
                  <span className="font-bold text-indigo-600 text-sm">{formatCurrency(mrr)}</span>
                </div>
                <input
                  id={mrrSliderId}
                  type="range"
                  min={100000}
                  max={20000000}
                  step={100000}
                  value={mrr}
                  onChange={(e) => setMrr(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>₹1 Lakh</span>
                  <span>₹1 Crore</span>
                  <span>₹2 Crore</span>
                </div>
              </div>

              {/* Slider 2: Involuntary Failure Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor={churnSliderId} className="font-semibold text-gray-700">Payment Failure Rate</label>
                  <span className="font-bold text-amber-600 text-sm">{failureRate}%</span>
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
                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>2% (Low)</span>
                  <span>8% (Average SaaS)</span>
                  <span>20% (High)</span>
                </div>
              </div>

              {/* Slider 3: Recovery Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor={recoverySliderId} className="font-semibold text-gray-700">CoverUP Autonomous Recovery Rate</label>
                  <span className="font-bold text-emerald-600 text-sm">{recoveryRate}%</span>
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
                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>30% (Standard retry)</span>
                  <span>65% (AI Multi-Channel)</span>
                  <span>85% (Optimal)</span>
                </div>
              </div>

              {/* Slider 4: Customer Lifetime */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor={ltvSliderId} className="font-semibold text-gray-700">Average Customer Lifetime</label>
                  <span className="font-bold text-gray-900 text-sm">{customerLifeMonths} months</span>
                </div>
                <input
                  id={ltvSliderId}
                  type="range"
                  min={6}
                  max={36}
                  step={1}
                  value={customerLifeMonths}
                  onChange={(e) => setCustomerLifeMonths(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
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
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-900">Cumulative Revenue Impact</CardTitle>
              <CardDescription>Revenue lost without recovery vs recaptured by CoverUP (₹ Thousands)</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}k`, '']}
                      contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      cursor={{ fill: '#F9FAFB' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="withoutCoverUP" name="Lost Revenue" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="recovered" name="CoverUP Recaptured" fill="#10B981" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">Ready to test recovery live?</span>
                <Link href="/">
                  <Button variant="default" size="sm" className="gap-1.5 text-xs">
                    Run Recovery Batch <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

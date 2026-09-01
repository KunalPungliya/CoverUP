'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, CartesianGrid, Legend, Area, AreaChart 
} from 'recharts';
import { Target, AlertTriangle, CheckCircle, Brain, TrendingUp, Lightbulb, Zap, Database, Calculator, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Analytics & Insights</h1>
            <p className="text-xs text-gray-500 mt-0.5">Deep dive into AI recovery performance and metrics</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-16 bg-gray-50/60 rounded-2xl border border-dashed border-gray-300 text-center">
          <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl mb-4 text-indigo-600 shadow-2xs">
            <Database className="h-10 w-10" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">No Analytics Data Yet</h2>
          <p className="text-xs text-gray-500 max-w-md mb-6">
            Run a recovery batch first to see analytics, performance trends, and AI insights.
          </p>
          <Link href="/">
            <Button variant="default" className="gap-2">
              <Zap className="h-4 w-4 fill-current" /> Go to Dashboard & Run Recovery
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Analytics & Insights</h1>
          <p className="text-xs text-gray-500 mt-0.5">Deep dive into AI recovery performance, failure breakdowns, and ROI</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/roi">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-gray-700">
              <Calculator className="h-3.5 w-3.5 text-indigo-600" />
              Open ROI Calculator
            </Button>
          </Link>
          <Badge variant="info" className="px-2.5 py-1 text-xs">
            <Zap className="h-3 w-3 mr-1 fill-current" />
            AI Recovery Active
          </Badge>
        </div>
      </div>

      {/* Key Metrics 4 Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="hover:border-gray-300 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
                <Target size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Avg Recovery Rate</p>
                <h3 className="text-xl font-bold text-emerald-700 mt-0.5">{metrics.avgRecoveryRate}%</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:border-gray-300 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg">
                <Brain size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Avg AI Confidence</p>
                <h3 className="text-xl font-bold text-indigo-600 mt-0.5">{metrics.avgAiConfidence}%</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:border-gray-300 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Top Failure</p>
                <h3 className="text-sm font-bold text-gray-900 truncate max-w-[130px] mt-0.5" title={metrics.mostCommonFailure}>
                  {metrics.mostCommonFailure?.replace(/_/g, ' ') || 'N/A'}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:border-gray-300 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Best Strategy</p>
                <h3 className="text-sm font-bold text-gray-900 truncate max-w-[130px] mt-0.5" title={metrics.bestActionType}>
                  {metrics.bestActionType?.replace(/_/g, ' ') || 'N/A'}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* AI Insights Callout */}
      <Card className="bg-indigo-50/40 border-indigo-200/80 shadow-2xs">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-sm font-bold text-indigo-950">AI Automated Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5">
            {insights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2 text-indigo-900 text-xs">
                <span className="text-indigo-600 font-bold mt-0.5">•</span>
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
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-bold text-gray-900">Recovery Trend Over Batches</CardTitle>
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}
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
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-bold text-gray-900">Strategy Effectiveness</CardTitle>
            <CardDescription>Success rate % by recovery intervention channel</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionEffectiveness} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} />
                  <YAxis dataKey="action" type="category" axisLine={false} tickLine={false} tick={{fill: '#374151', fontSize: 11}} width={110} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Success Rate']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}
                    cursor={{ fill: '#F9FAFB' }}
                  />
                  <Bar dataKey="successRate" name="Success Rate %" radius={[0, 4, 4, 0]} barSize={20}>
                    {actionEffectiveness.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#4F46E5' : '#818CF8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Confidence Distribution */}
        <Card>
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-bold text-gray-900">AI Confidence Distribution</CardTitle>
            <CardDescription>Gemini model decision certainty breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confidenceDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}
                    cursor={{ fill: '#F9FAFB' }}
                  />
                  <Bar dataKey="count" name="Decisions" radius={[4, 4, 0, 0]} fill="#4F46E5" barSize={36}>
                    {confidenceDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.name === '90-100%' ? '#4F46E5' : entry.name === '80-90%' ? '#6366F1' : '#A5B4FC'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Failure Reason Breakdown */}
        <Card>
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-sm font-bold text-gray-900">Failure Reasons & Recoveries</CardTitle>
            <CardDescription>Total failures vs recovered accounts per reason</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={failureReasonBreakdown.slice(0, 5)} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="reason" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10}} interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}
                    cursor={{ fill: '#F9FAFB' }}
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
  );
}

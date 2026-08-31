'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, CartesianGrid, Legend, Area, AreaChart 
} from 'recharts';
import { Target, AlertTriangle, CheckCircle, Brain, TrendingUp, Lightbulb, Zap, Database } from 'lucide-react';
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
        <h1 className="text-3xl font-bold text-slate-900">Analytics & Insights</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  // Handle empty state (no data returned or 0 batches)
  if (!data || !data.metrics || data.metrics.avgRecoveryRate === undefined || data.trendData?.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics & Insights</h1>
            <p className="text-slate-500 mt-1">Deep dive into AI recovery performance and metrics</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm text-center">
          <div className="bg-blue-50 p-6 rounded-full mb-6">
            <Database className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Analytics Data Yet</h2>
          <p className="text-slate-500 max-w-md">
            Run a recovery batch first to see analytics, performance trends, and AI insights.
          </p>
        </div>
      </div>
    );
  }

  const { metrics, trendData, confidenceDistribution, failureReasonBreakdown, actionEffectiveness } = data;

  // Auto-generate some text insights based on the data
  const generateInsights = () => {
    const insights = [];
    
    if (metrics.bestActionType) {
      insights.push(`The most effective recovery action is currently "${metrics.bestActionType.replace(/_/g, ' ')}".`);
    }
    
    if (metrics.mostCommonFailure) {
      insights.push(`"${metrics.mostCommonFailure.replace(/_/g, ' ')}" remains the top reason for payment failures, requiring targeted follow-ups.`);
    }
    
    if (metrics.avgAiConfidence) {
      insights.push(`The AI is operating with high certainty, averaging ${metrics.avgAiConfidence}% confidence across all recovery decisions.`);
    }
    
    if (metrics.avgRecoveryRate > 50) {
      insights.push(`Excellent performance: Your recovery rate is strong at ${metrics.avgRecoveryRate}%, significantly above industry averages.`);
    }
    
    return insights.length ? insights : ["Run more recovery batches to generate AI insights."];
  };

  const insights = generateInsights();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics & Insights</h1>
          <p className="text-slate-500 mt-1">Deep dive into AI recovery performance and metrics</p>
        </div>
        <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200 px-3 py-1 shadow-sm">
          <Zap className="h-3 w-3 mr-1 fill-blue-600" />
          AI Recovery Active
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                <Target size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Avg Recovery Rate</p>
                <h3 className="text-2xl font-bold text-slate-900">{metrics.avgRecoveryRate}%</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <Brain size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Avg AI Confidence</p>
                <h3 className="text-2xl font-bold text-slate-900">{metrics.avgAiConfidence}%</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Top Failure</p>
                <h3 className="text-lg font-bold text-slate-900 truncate max-w-[120px]" title={metrics.mostCommonFailure}>
                  {metrics.mostCommonFailure?.replace(/_/g, ' ') || 'N/A'}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Best Action</p>
                <h3 className="text-lg font-bold text-slate-900 truncate max-w-[120px]" title={metrics.bestActionType}>
                  {metrics.bestActionType?.replace(/_/g, ' ') || 'N/A'}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* AI Insights Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-900">AI Generated Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {insights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2 text-blue-800 text-sm">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recovery Trend */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Recovery Trend</CardTitle>
            <CardDescription>Recovered vs At-Risk subscriptions over last 10 batches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorAtRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Area type="monotone" name="Recovered" dataKey="recoveredCount" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorRecovered)" />
                  <Area type="monotone" name="At Risk" dataKey="totalCount" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAtRisk)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Action Effectiveness */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Action Effectiveness</CardTitle>
            <CardDescription>Success rate of AI recovery actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionEffectiveness} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis dataKey="action" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11}} width={100} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Success Rate']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="successRate" name="Success Rate %" radius={[0, 4, 4, 0]} barSize={24}>
                    {actionEffectiveness.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#2563eb' : '#60a5fa'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Confidence Distribution */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>AI Confidence Distribution</CardTitle>
            <CardDescription>Model confidence in chosen recovery actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confidenceDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="count" name="Actions Taken" radius={[4, 4, 0, 0]} fill="#8b5cf6" barSize={40}>
                    {confidenceDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.name === '90-100%' ? '#8b5cf6' : entry.name === '80-90%' ? '#a78bfa' : '#c4b5fd'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Failure Reason Breakdown */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Failure Reasons & Recovery</CardTitle>
            <CardDescription>Total failures vs recovered per reason</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={failureReasonBreakdown.slice(0, 5)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="reason" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="total" name="Total Failures" fill="#f87171" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="recovered" name="Recovered" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

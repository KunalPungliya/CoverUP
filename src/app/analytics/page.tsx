'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, CartesianGrid, Legend, Area, AreaChart 
} from 'recharts';
import { Target, AlertTriangle, CheckCircle, Brain, TrendingUp } from 'lucide-react';

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

  const { metrics, trendData, confidenceDistribution, failureReasonBreakdown, actionEffectiveness } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Analytics & Insights</h1>
        <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200 px-3 py-1">
          AI Recovery Active
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
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
        
        <Card className="border-slate-200">
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
        
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Top Failure</p>
                <h3 className="text-lg font-bold text-slate-900 truncate" title={metrics.mostCommonFailure}>
                  {metrics.mostCommonFailure}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Best Action</p>
                <h3 className="text-lg font-bold text-slate-900 truncate" title={metrics.bestActionType}>
                  {metrics.bestActionType}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Area type="monotone" name="Recovered" dataKey="recoveredCount" stroke="#059669" fillOpacity={1} fill="url(#colorRecovered)" />
                  <Area type="monotone" name="At Risk" dataKey="totalCount" stroke="#ef4444" fillOpacity={0.1} fill="#ef4444" />
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
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis dataKey="action" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 11, width: 100}} width={120} />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Success Rate']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="count" name="Actions Taken" radius={[4, 4, 0, 0]} fill="#8b5cf6" barSize={40} />
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="reason" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend />
                  <Bar dataKey="total" name="Total Failures" fill="#f87171" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recovered" name="Recovered" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

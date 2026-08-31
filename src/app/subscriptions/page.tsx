'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Subscription, Customer } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, ArrowUpDown } from 'lucide-react';

type SubWithCustomer = Subscription & { customers: Customer };

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'default' | 'secondary'> = {
  active: 'success',
  past_due: 'warning',
  failed: 'destructive',
  recovered: 'info',
  cancelled: 'default',
  unrecoverable: 'secondary',
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  const [stats, setStats] = useState({ total: 0, active: 0, past_due: 0, failed: 0, recovered: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          status: statusFilter,
          page: page.toString(),
          limit: '100', // Increased limit for client-side search/sort since hackathon
        });
        const res = await fetch(`/api/subscriptions?${params}`);
        const json = await res.json();
        if (json.success) {
          setSubscriptions(json.data.subscriptions);
          setTotal(json.data.total);
          setTotalPages(json.data.totalPages);
          
          if (statusFilter === 'all') {
            const subs = json.data.subscriptions;
            setStats({
              total: json.data.total,
              active: subs.filter((s: any) => s.status === 'active').length,
              past_due: subs.filter((s: any) => s.status === 'past_due').length,
              failed: subs.filter((s: any) => s.status === 'failed').length,
              recovered: subs.filter((s: any) => s.status === 'recovered').length,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [statusFilter, page]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedSubs = useMemo(() => {
    let result = [...subscriptions];
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(sub => 
        sub.customers?.name?.toLowerCase().includes(lowerQuery) || 
        sub.customers?.email?.toLowerCase().includes(lowerQuery)
      );
    }
    
    if (sortConfig) {
      result.sort((a, b) => {
        let aVal: any = a[sortConfig.key as keyof SubWithCustomer];
        let bVal: any = b[sortConfig.key as keyof SubWithCustomer];
        
        if (sortConfig.key === 'amount') {
          aVal = a.amount;
          bVal = b.amount;
        } else if (sortConfig.key === 'status') {
          aVal = a.status;
          bVal = b.status;
        } else if (sortConfig.key === 'updated_at') {
          aVal = new Date(a.updated_at).getTime();
          bVal = new Date(b.updated_at).getTime();
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [subscriptions, searchQuery, sortConfig]);

  const calculateDaysOverdue = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = now.getTime() - end.getTime();
    const days = Math.floor(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  };

  const getRowClass = (status: string) => {
    switch(status) {
      case 'failed': return 'bg-red-50/50 hover:bg-red-50 transition-colors';
      case 'past_due': return 'bg-amber-50/50 hover:bg-amber-50 transition-colors';
      case 'recovered': return 'bg-emerald-50/50 hover:bg-emerald-50 transition-colors';
      default: return 'hover:bg-blue-50/50 transition-colors';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscriptions</h1>
          <p className="text-slate-500 mt-1">{total} total subscriptions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search customers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="past_due">Past Due</option>
            <option value="failed">Failed</option>
            <option value="recovered">Recovered</option>
            <option value="cancelled">Cancelled</option>
            <option value="unrecoverable">Unrecoverable</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:border-slate-300 transition-colors" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total || total}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-emerald-300 transition-colors" onClick={() => setStatusFilter('active')}>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-emerald-600">Active</p>
            <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-amber-300 transition-colors" onClick={() => setStatusFilter('past_due')}>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-amber-600">Past Due</p>
            <p className="text-2xl font-bold text-amber-700">{stats.past_due}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-red-300 transition-colors" onClick={() => setStatusFilter('failed')}>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-red-600">Failed</p>
            <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setStatusFilter('recovered')}>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-blue-600">Recovered</p>
            <p className="text-2xl font-bold text-blue-700">{stats.recovered}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Customer</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Plan</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer hover:text-slate-800" onClick={() => handleSort('amount')}>
                      Amount <ArrowUpDown className="inline h-3 w-3 ml-1" />
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer hover:text-slate-800" onClick={() => handleSort('status')}>
                      Status <ArrowUpDown className="inline h-3 w-3 ml-1" />
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">At Risk / Overdue</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Payment</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase cursor-pointer hover:text-slate-800" onClick={() => handleSort('updated_at')}>
                      Updated <ArrowUpDown className="inline h-3 w-3 ml-1" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAndSortedSubs.map((sub) => {
                    const isAtRisk = sub.status === 'past_due' || sub.status === 'failed';
                    const daysOverdue = isAtRisk ? calculateDaysOverdue(sub.current_period_end) : 0;
                    
                    return (
                      <tr key={sub.id} className={getRowClass(sub.status)}>
                        <td className="px-6 py-4">
                          <Link href={`/customers/${sub.customer_id}`} className="block group">
                            <p className="font-medium text-blue-600 group-hover:text-blue-800 transition-colors">{sub.customers?.name}</p>
                            <p className="text-xs text-slate-500">{sub.customers?.email}</p>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-700">{sub.plan_name}</p>
                          <Badge variant="outline" className="mt-1 text-[10px]">{sub.billing_cycle}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(sub.amount)}</td>
                        <td className="px-6 py-4">
                          <Badge variant={STATUS_VARIANTS[sub.status] || 'default'}>{sub.status.replace(/_/g, ' ')}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          {isAtRisk ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-red-600 font-medium text-xs">{formatCurrency(sub.amount)}</span>
                              <span className="text-amber-600 text-[10px]">{daysOverdue} days overdue</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {sub.payment_method?.type === 'card'
                            ? `${sub.payment_method.brand || 'Card'} •••• ${sub.payment_method.last4}`
                            : sub.payment_method?.upi_id || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">{formatDate(sub.updated_at)}</td>
                      </tr>
                    );
                  })}
                  {filteredAndSortedSubs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        No subscriptions found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {totalPages > 1 && !searchQuery && !sortConfig && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40"
                onClick={() => setPage(p => p - 1)}
                disabled={page <= 1}
              >
                Previous
              </button>
              <button
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

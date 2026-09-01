'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Subscription, Customer } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Search, ArrowUpDown, ArrowRight, UserCheck, ShieldAlert, Sparkles, ClipboardList } from 'lucide-react';
import { CustomerDrawer } from '@/components/customer-drawer';

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

  // Drawer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          status: statusFilter,
          page: page.toString(),
          limit: '100',
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

  const handleOpenDrawer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setDrawerOpen(true);
  };

  const filteredAndSortedSubs = useMemo(() => {
    let result = [...subscriptions];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (sub) =>
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
    switch (status) {
      case 'failed':
        return 'bg-rose-50/20 hover:bg-rose-50/50 transition-colors cursor-pointer';
      case 'past_due':
        return 'bg-amber-50/20 hover:bg-amber-50/50 transition-colors cursor-pointer';
      case 'recovered':
        return 'bg-emerald-50/20 hover:bg-emerald-50/50 transition-colors cursor-pointer';
      default:
        return 'hover:bg-slate-50/80 transition-colors cursor-pointer';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Subscriptions & Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {total} customer subscription accounts — Click any row for 360° timeline
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link href="/audit" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <ClipboardList className="h-3.5 w-3.5" /> Full Audit Trail →
          </Link>
          <div className="w-full sm:w-64">
            <Input
              icon={<Search className="h-4 w-4" />}
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-44"
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

      {/* Filter Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card
          className={`cursor-pointer transition-all ${
            statusFilter === 'all' ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/20' : 'hover:border-slate-300'
          }`}
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="p-3 text-center">
            <p className="text-xs text-slate-500 font-medium">Total Accounts</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.total || total}</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${
            statusFilter === 'active' ? 'border-emerald-600 ring-1 ring-emerald-600 bg-emerald-50/30' : 'hover:border-emerald-300'
          }`}
          onClick={() => setStatusFilter('active')}
        >
          <CardContent className="p-3 text-center">
            <p className="text-xs text-emerald-700 font-medium">Active</p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{stats.active}</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${
            statusFilter === 'past_due' ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-50/30' : 'hover:border-amber-300'
          }`}
          onClick={() => setStatusFilter('past_due')}
        >
          <CardContent className="p-3 text-center">
            <p className="text-xs text-amber-700 font-medium">Past Due</p>
            <p className="text-xl font-bold text-amber-700 mt-0.5">{stats.past_due}</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${
            statusFilter === 'failed' ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/30' : 'hover:border-rose-300'
          }`}
          onClick={() => setStatusFilter('failed')}
        >
          <CardContent className="p-3 text-center">
            <p className="text-xs text-rose-700 font-medium">Failed</p>
            <p className="text-xl font-bold text-rose-700 mt-0.5">{stats.failed}</p>
          </CardContent>
        </Card>
        <Card
          className={`col-span-2 sm:col-span-1 cursor-pointer transition-all ${
            statusFilter === 'recovered' ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/30' : 'hover:border-blue-300'
          }`}
          onClick={() => setStatusFilter('recovered')}
        >
          <CardContent className="p-3 text-center">
            <p className="text-xs text-blue-700 font-medium">Recovered</p>
            <p className="text-xl font-bold text-blue-700 mt-0.5">{stats.recovered}</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider">Customer & Company</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider">Plan</th>
                    <th
                      className="text-right px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-900"
                      onClick={() => handleSort('amount')}
                    >
                      Amount <ArrowUpDown className="inline h-3 w-3 ml-0.5" />
                    </th>
                    <th
                      className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-900"
                      onClick={() => handleSort('status')}
                    >
                      Status <ArrowUpDown className="inline h-3 w-3 ml-0.5" />
                    </th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider">Recovery & Risk Detail</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider">Payment Method</th>
                    <th className="text-right px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider">Customer 360°</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAndSortedSubs.map((sub) => {
                    const isAtRisk = sub.status === 'past_due' || sub.status === 'failed';
                    const isRecovered = sub.status === 'recovered';
                    const daysOverdue = isAtRisk ? calculateDaysOverdue(sub.current_period_end) : 0;
                    const pm = sub.payment_method as any;

                    return (
                      <tr 
                        key={sub.id} 
                        className={getRowClass(sub.status)}
                        onClick={() => handleOpenDrawer(sub.customer_id)}
                      >
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                              {sub.customers?.name || 'Customer'}
                            </p>
                            <p className="text-[11px] text-slate-500">{sub.customers?.email}</p>
                            {sub.customers?.phone && (
                              <p className="text-[10px] text-slate-400 font-mono">{sub.customers.phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-800">{sub.plan_name}</p>
                          <Badge variant="outline" className="mt-0.5 text-[9px] uppercase font-mono tracking-wider">
                            {sub.billing_cycle}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="font-bold text-slate-900">{formatCurrency(sub.amount)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={STATUS_VARIANTS[sub.status] || 'default'} className="capitalize text-[11px]">
                            {sub.status.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          {isRecovered ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                                ✓ Recovered {formatCurrency(sub.amount)}
                              </span>
                              <span className="text-[10px] text-emerald-600">Auto-captured</span>
                            </div>
                          ) : isAtRisk ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-rose-600 font-bold text-xs">
                                At Risk: {formatCurrency(sub.amount)}
                              </span>
                              <span className="text-amber-700 text-[10px] font-medium bg-amber-50 px-1.5 py-0.2 rounded w-fit border border-amber-200">
                                {daysOverdue} days overdue
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">In good standing</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {pm?.type === 'card' ? (
                            <div className="flex flex-col gap-0.5 text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-800">{pm.brand || 'Card'}</span>
                                <span className="font-mono text-slate-500">•••• {pm.last4}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Exp: <span className="font-mono text-slate-600">{pm.expiry || '12/28'}</span>
                                {pm.bank && ` · ${pm.bank}`}
                              </div>
                            </div>
                          ) : pm?.type === 'upi' ? (
                            <div className="flex flex-col gap-0.5 text-xs">
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" className="text-[9px] px-1 py-0">{pm.app || 'UPI'}</Badge>
                                <span className="font-mono text-slate-700 text-[11px]">{pm.upi_id}</span>
                              </div>
                              {pm.autopay_limit && (
                                <span className="text-[10px] text-slate-400">Limit: {pm.autopay_limit}</span>
                              )}
                            </div>
                          ) : pm?.type === 'mandate' ? (
                            <div className="flex flex-col gap-0.5 text-xs">
                              <span className="font-semibold text-slate-800">{pm.bank || 'Bank e-Mandate'}</span>
                              <span className="text-[10px] text-slate-400">{pm.auth_mode || 'e-NACH Recurring'}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Standard Mandate</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDrawer(sub.customer_id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-100 transition-colors"
                          >
                            <span>Profile</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAndSortedSubs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                        No subscriptions found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer 360 Slide-Over Drawer */}
      <CustomerDrawer
        customerId={selectedCustomerId}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedCustomerId(null);
        }}
      />
    </div>
  );
}


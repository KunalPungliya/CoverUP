'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Subscription, Customer } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUpRight, 
  UserCheck, 
  ShieldAlert, 
  Sparkles, 
  ClipboardList,
  ListFilter,
  CreditCard,
  CircleDollarSign,
  BadgeCheck,
  Zap,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CustomerDrawer } from '@/components/customer-drawer';
import { cn } from '@/lib/utils';

type SubWithCustomer = Subscription & { 
  customers: Customer;
  failure_reason?: string;
  retry_count?: number;
  risk_score?: number;
  next_retry_at?: string;
};

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'border-[#BFDB78] bg-[#EDF7CE] text-[#4E6B18]',
    past_due: 'border-[#E7C779] bg-[#FFF7DF] text-[#8A6413]',
    failed: 'border-[#E3A5A0] bg-[#FFF0EE] text-[#A54C46]',
    recovered: 'border-[#BFDB78] bg-[#EDF7CE] text-[#4E6B18]',
    cancelled: 'border-[#D9D6CB] bg-[#F4F1E8] text-[#68665D]',
    unrecoverable: 'border-[#E3A5A0] bg-[#FFF0EE] text-[#A54C46]',
  };
  const label = status.replace(/_/g, ' ');
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.13em]', styles[status] || styles.cancelled)}>
      <span className={cn(
        'h-1.5 w-1.5 rounded-full',
        status === 'active' || status === 'recovered' ? 'bg-[#89B82C]' :
        status === 'past_due' ? 'bg-[#D3A12A]' :
        status === 'failed' || status === 'unrecoverable' ? 'bg-[#CE6861]' : 'bg-[#9E9B90]'
      )} />
      {label}
    </span>
  );
}

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

        if (sortConfig.key === 'customer_name') {
          aVal = a.customers?.name || '';
          bVal = b.customers?.name || '';
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [subscriptions, searchQuery, sortConfig]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#87915D]">
            Queue & Ledger · Live Razorpay Sync
          </p>
          <h1 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[0.98] tracking-[-0.06em] text-[#F2F0E6]">
            Recovery queue.
          </h1>
        </div>
        <div className="text-right font-mono text-xs text-[#9FA297]">
          <span>Total tracked: </span>
          <span className="font-bold text-[#C7F36B]">{total} subscriptions</span>
        </div>
      </div>

      {/* KPI Strip */}
      <section className="grid border border-[#DEDBD1] bg-[#FAF9F5] sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Healthy', value: stats.active.toString(), sub: 'retaining ARR', valueClass: 'text-[#4E6B18]', Icon: BadgeCheck },
          { label: 'Past Due', value: stats.past_due.toString(), sub: 'in recovery window', valueClass: 'text-[#8A6413]', Icon: CircleDollarSign },
          { label: 'Failed At Gateway', value: stats.failed.toString(), sub: 'requires intervention', valueClass: 'text-[#A54C46]', Icon: ShieldAlert },
          { label: 'Autonomous Rescues', value: stats.recovered.toString(), sub: 'reclaimed by agent', valueClass: 'text-[#3C5C92]', Icon: Zap },
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

      {/* Table Section */}
      <section className="border border-[#DEDBD1] bg-[#FAF9F5] text-[#2B2D27]">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DEDBD1] px-5 py-4 md:px-6">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#85867E]" />
              <input
                type="text"
                placeholder="Search by customer name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 text-xs font-mono bg-[#F7F5EE] border border-[#D8D5CB] outline-none text-[#2B2D27] placeholder:text-[#9A9B91] focus:border-[#9AB54D]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#888980] sm:flex">
              <ListFilter size={14} /> Status
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 border border-[#D8D5CB] bg-[#F7F5EE] px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[#55574E] outline-none focus:border-[#9AB54D]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="failed">Failed</option>
              <option value="recovered">Recovered</option>
            </select>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="border-b border-[#EBE8DF] bg-[#F7F5EE]">
              <tr className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#97988E]">
                <th className="px-5 py-3 font-medium md:px-6 cursor-pointer" onClick={() => handleSort('customer_name')}>
                  <div className="flex items-center gap-1">
                    Customer <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-3 py-3 font-medium cursor-pointer" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    Status <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-3 py-3 font-medium cursor-pointer" onClick={() => handleSort('amount')}>
                  <div className="flex items-center gap-1">
                    Amount <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-3 py-3 font-medium">Decline Reason</th>
                <th className="px-3 py-3 font-medium cursor-pointer" onClick={() => handleSort('risk_score')}>
                  <div className="flex items-center gap-1">
                    Risk Score <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-3 py-3 font-medium cursor-pointer" onClick={() => handleSort('next_retry_at')}>
                  <div className="flex items-center gap-1">
                    Next Action <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="px-5 py-3 text-right font-medium md:px-6">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center font-mono text-xs text-[#85867E]">
                    Loading subscription ledger...
                  </td>
                </tr>
              ) : filteredAndSortedSubs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center font-mono text-xs text-[#85867E]">
                    No subscriptions found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredAndSortedSubs.map((sub) => {
                  const initials = sub.customers?.name
                    ? sub.customers.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                    : 'CU';
                  const failureReason = sub.failure_reason || (sub.status === 'active' ? 'None · Healthy' : 'Soft decline');
                  const riskScore = sub.risk_score || 20;
                  return (
                    <tr
                      key={sub.id}
                      onClick={() => handleOpenDrawer(sub.customer_id)}
                      className="group cursor-pointer border-b border-[#EBE8DF] transition-colors hover:bg-[#F4F1E7]"
                    >
                      <td className="px-5 py-3.5 md:px-6">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 shrink-0 place-items-center bg-[#E8E5DB] font-mono text-[10px] font-semibold text-[#61645A]">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#2B2D27]">
                              {sub.customers?.name || 'Anonymous Customer'}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#8B8C82] font-mono">
                              {sub.customers?.email || 'No email provided'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusPill status={sub.status} />
                      </td>
                      <td className="px-3 py-3.5 font-display text-sm font-semibold tracking-[-0.03em] text-[#2D3028]">
                        {formatCurrency(sub.amount)}
                        <span className="text-[10px] font-mono font-normal text-[#8B8C82]"> /{sub.billing_cycle || 'monthly'}</span>
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="text-xs font-medium text-[#474941]">
                          {failureReason}
                        </p>
                        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-[#A0A097]">
                          Retries: {sub.retry_count || 0}/3
                        </p>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={cn(
                          'font-mono text-xs font-semibold',
                          riskScore < 40 ? 'text-[#638522]' : riskScore < 70 ? 'text-[#9B761F]' : 'text-[#9A625B]'
                        )}>
                          {riskScore}<span className="font-normal text-[#B1B0A6]">/100</span>
                        </span>
                      </td>
                      <td className="px-3 py-3.5 font-mono text-[11px] text-[#55574E]">
                        {sub.next_retry_at ? formatDate(sub.next_retry_at) : 'Automated scheduled'}
                      </td>
                      <td className="px-5 py-3.5 text-right md:px-6">
                        <button
                          className="text-[#AEAFA6] transition-colors group-hover:text-[#536E25]"
                          aria-label="Inspect customer"
                        >
                          <ArrowUpRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 md:px-6 border-t border-[#EBE8DF]">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#999A90]">
            Showing {filteredAndSortedSubs.length} of {total} records
          </span>
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1 text-[#68665D] hover:text-[#2B2D27] disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[#55574E]">Page {page} of {totalPages || 1}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-1 text-[#68665D] hover:text-[#2B2D27] disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Slide-Over Customer 360° Drawer */}
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

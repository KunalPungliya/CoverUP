'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Subscription, Customer } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          status: statusFilter,
          page: page.toString(),
          limit: '20',
        });
        const res = await fetch(`/api/subscriptions?${params}`);
        const json = await res.json();
        if (json.success) {
          setSubscriptions(json.data.subscriptions);
          setTotal(json.data.total);
          setTotalPages(json.data.totalPages);
        }
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [statusFilter, page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subscriptions</h1>
          <p className="text-slate-500 mt-1">{total} total subscriptions</p>
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
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Customer</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Plan</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Cycle</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Payment</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/customers/${sub.customer_id}`} className="block group">
                          <p className="font-medium text-blue-600 group-hover:text-blue-800 transition-colors">{sub.customers?.name}</p>
                          <p className="text-xs text-gray-500">{sub.customers?.email}</p>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{sub.plan_name}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatCurrency(sub.amount)}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{sub.billing_cycle}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={STATUS_VARIANTS[sub.status] || 'default'}>{sub.status.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {sub.payment_method?.type === 'card'
                          ? `${sub.payment_method.brand || 'Card'} •••• ${sub.payment_method.last4}`
                          : sub.payment_method?.upi_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{formatDate(sub.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {/* Pagination */}
        {totalPages > 1 && (
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

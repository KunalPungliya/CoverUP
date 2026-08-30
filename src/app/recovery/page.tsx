'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RecoveryBatch } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Play, Eye } from 'lucide-react';

export default function RecoveryPage() {
  const [batches, setBatches] = useState<RecoveryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const [message, setMessage] = useState('');

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/batches');
      const json = await res.json();
      if (json.success) setBatches(json.data);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBatches(); }, []);

  const handleRecover = async () => {
    setRecovering(true);
    setMessage('');
    try {
      const res = await fetch('/api/recover', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        const s = json.data.summary;
        setMessage(
          `✅ Batch complete: ${s.recovered} recovered (${formatCurrency(s.amountRecovered)}) out of ${s.totalProcessed} processed`
        );
        fetchBatches();
      } else {
        setMessage(`❌ ${json.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setRecovering(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recovery Batches</h1>
          <p className="text-gray-500 mt-1">Run and review AI recovery batches</p>
        </div>
        <Button variant="success" onClick={handleRecover} loading={recovering}>
          <Play className="h-4 w-4" />
          Run Recovery Batch
        </Button>
      </div>

      {message && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm">{message}</div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : batches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No recovery batches yet. Click &quot;Run Recovery Batch&quot; to start.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <Card key={batch.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Batch</p>
                      <p className="font-mono text-sm font-medium">{batch.id.slice(0, 8)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Started</p>
                      <p className="text-sm">{formatDate(batch.started_at)}</p>
                    </div>
                    <Badge variant={batch.status === 'completed' ? 'success' : 'warning'}>
                      {batch.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">At Risk</p>
                      <p className="text-lg font-bold text-amber-600">{batch.total_at_risk}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Recovered</p>
                      <p className="text-lg font-bold text-emerald-600">{batch.total_recovered}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-lg font-bold text-emerald-600">
                        {formatCurrency(batch.total_amount_recovered)}
                      </p>
                    </div>
                    <Link href={`/recovery/${batch.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

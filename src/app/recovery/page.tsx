'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RecoveryBatch } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Play, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { RecoveryModal } from '@/components/recovery-modal';

export default function RecoveryPage() {
  const [batches, setBatches] = useState<RecoveryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalResult, setModalResult] = useState<any>(null);

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

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleRecover = async () => {
    setShowModal(true);
    setRecovering(true);
    setMessage('');
    try {
      const res = await fetch('/api/recover', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setModalResult(json.data);
        const s = json.data.summary;
        setMessage(
          `✓ Batch complete: ${s.recovered} recovered (${formatCurrency(s.amountRecovered)}) out of ${s.totalProcessed} processed`
        );
        fetchBatches();
      } else {
        setMessage(`✕ ${json.error}`);
        setShowModal(false);
      }
    } catch (error) {
      setMessage(`✕ Error: ${error}`);
      setShowModal(false);
    } finally {
      setRecovering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Recovery Batches</h1>
          <p className="text-xs text-slate-500 mt-0.5">Historical autonomous recovery runs and audit trail</p>
        </div>
        <Button variant="default" onClick={handleRecover} loading={recovering} className="gap-2">
          <Play className="h-4 w-4 fill-current" />
          Run New Recovery Batch
        </Button>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium ${
            message.includes('✓')
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-sm text-slate-500 mb-4">No recovery batches run yet.</p>
            <Button variant="default" onClick={handleRecover} loading={recovering} className="gap-2">
              <Play className="h-4 w-4 fill-current" /> Run Your First Batch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <Card key={batch.id} className="hover:border-slate-300 transition-all">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium uppercase">Batch ID</p>
                      <p className="font-mono text-xs font-bold text-slate-900">{batch.id.slice(0, 8)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium uppercase">Timestamp</p>
                      <p className="text-xs text-slate-700 font-medium">{formatDate(batch.started_at)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-medium uppercase">Status</p>
                      <Badge variant={batch.status === 'completed' ? 'success' : 'warning'} className="text-[10px] mt-0.5">
                        {batch.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] text-slate-400 font-medium uppercase">At-Risk Count</p>
                      <p className="text-xs font-semibold text-slate-700">{batch.total_at_risk} accounts</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-400 font-medium uppercase">Recovered</p>
                      <p className="text-xs font-bold text-emerald-700">
                        {batch.total_recovered} <span className="text-slate-400 font-normal">({formatCurrency(batch.total_amount_recovered)})</span>
                      </p>
                    </div>
                    <Link href={`/recovery/${batch.id}`}>
                      <Button variant="outline" size="sm" className="gap-1 text-xs">
                        Details <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recovery Modal */}
      <RecoveryModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setModalResult(null);
        }}
        isProcessing={recovering}
        result={modalResult}
      />
    </div>
  );
}


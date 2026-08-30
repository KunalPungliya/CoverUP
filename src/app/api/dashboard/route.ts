import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DashboardMetrics } from '@/lib/types';

export async function GET() {
  try {
    // Get subscription counts by status
    const { data: allSubs } = await supabase
      .from('subscriptions')
      .select('id, status, amount');

    const subs = allSubs || [];
    const totalSubscriptions = subs.length;
    const activeSubscriptions = subs.filter(s => s.status === 'active').length;
    const atRiskSubscriptions = subs.filter(s => ['past_due', 'failed'].includes(s.status)).length;
    const recoveredSubscriptions = subs.filter(s => s.status === 'recovered').length;
    const unresolvedSubscriptions = subs.filter(s => s.status === 'unrecoverable').length;

    const totalAmountAtRisk = subs
      .filter(s => ['past_due', 'failed'].includes(s.status))
      .reduce((sum, s) => sum + s.amount, 0);
    const totalAmountRecovered = subs
      .filter(s => s.status === 'recovered')
      .reduce((sum, s) => sum + s.amount, 0);

    const recoveryRate = (atRiskSubscriptions + recoveredSubscriptions + unresolvedSubscriptions) > 0
      ? recoveredSubscriptions / (atRiskSubscriptions + recoveredSubscriptions + unresolvedSubscriptions)
      : 0;

    // Get recent batches
    const { data: recentBatches } = await supabase
      .from('recovery_batches')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    // Get recovery by failure reason
    const { data: failedAttempts } = await supabase
      .from('payment_attempts')
      .select('subscription_id, failure_reason')
      .eq('status', 'failed')
      .not('failure_reason', 'is', null);

    const reasonMap = new Map<string, { recovered: number; failed: number; total: number }>();
    if (failedAttempts) {
      for (const attempt of failedAttempts) {
        const reason = attempt.failure_reason || 'unknown';
        if (!reasonMap.has(reason)) {
          reasonMap.set(reason, { recovered: 0, failed: 0, total: 0 });
        }
        const entry = reasonMap.get(reason)!;
        entry.total++;
      }
    }

    // Check which subscriptions were recovered
    const recoveredSubIds = new Set(subs.filter(s => s.status === 'recovered').map(s => s.id));
    const unresolvedSubIds = new Set(subs.filter(s => ['failed', 'unrecoverable'].includes(s.status)).map(s => s.id));

    if (failedAttempts) {
      for (const attempt of failedAttempts) {
        const reason = attempt.failure_reason || 'unknown';
        const entry = reasonMap.get(reason);
        if (entry) {
          if (recoveredSubIds.has(attempt.subscription_id)) {
            entry.recovered++;
          } else if (unresolvedSubIds.has(attempt.subscription_id)) {
            entry.failed++;
          }
        }
      }
    }

    const recoveryByReason = Array.from(reasonMap.entries()).map(([reason, data]) => ({
      reason: reason.replace(/_/g, ' '),
      ...data,
    }));

    // Get action distribution
    const { data: actions } = await supabase
      .from('recovery_actions')
      .select('action_type');

    const actionMap = new Map<string, number>();
    if (actions) {
      for (const action of actions) {
        actionMap.set(action.action_type, (actionMap.get(action.action_type) || 0) + 1);
      }
    }

    const actionDistribution = Array.from(actionMap.entries()).map(([action, count]) => ({
      action: action.replace(/_/g, ' '),
      count,
    }));

    const metrics: DashboardMetrics = {
      totalSubscriptions,
      activeSubscriptions,
      atRiskSubscriptions,
      recoveredSubscriptions,
      unresolvedSubscriptions,
      totalAmountAtRisk,
      totalAmountRecovered,
      recoveryRate,
      totalBatches: recentBatches?.length || 0,
      recentBatches: recentBatches || [],
      recoveryByReason,
      actionDistribution,
    };

    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

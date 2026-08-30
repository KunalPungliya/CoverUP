import { supabase } from '../supabase';
import { AtRiskSubscription, PaymentAttempt, RecoveryAction, Subscription, Customer } from '../types';

export async function detectAtRiskSubscriptions(): Promise<AtRiskSubscription[]> {
  // Fetch subscriptions with failed/past_due status, joined with customer
  const { data: subscriptions, error: subError } = await supabase
    .from('subscriptions')
    .select('*, customers(*)')
    .in('status', ['past_due', 'failed'])
    .order('updated_at', { ascending: false });

  if (subError) throw new Error(`Detection failed: ${subError.message}`);
  if (!subscriptions || subscriptions.length === 0) return [];

  const atRiskList: AtRiskSubscription[] = [];

  for (const sub of subscriptions) {
    // Get failed payment attempts for this subscription
    const { data: attempts, error: attError } = await supabase
      .from('payment_attempts')
      .select('*')
      .eq('subscription_id', sub.id)
      .eq('status', 'failed')
      .order('attempted_at', { ascending: false });

    if (attError || !attempts || attempts.length === 0) continue;

    const latestAttempt = attempts[0] as PaymentAttempt;
    const failureCount = attempts.length;

    // Calculate days since first failure
    const oldestFailure = attempts[attempts.length - 1] as PaymentAttempt;
    const daysSinceFailure = Math.floor(
      (Date.now() - new Date(oldestFailure.attempted_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get previous recovery actions
    const { data: actions } = await supabase
      .from('recovery_actions')
      .select('*')
      .eq('subscription_id', sub.id)
      .order('created_at', { ascending: false });

    // Calculate risk score: higher = more urgent
    // Factors: amount (normalized), days overdue, failure count, failure severity
    const amountFactor = Math.min(sub.amount / 100000, 10); // normalize to 0-10
    const daysFactor = Math.min(daysSinceFailure / 5, 5); // 0-5
    const failureFactor = Math.min(failureCount, 5); // 0-5
    const severityMap: Record<string, number> = {
      fraud_suspected: 8,
      account_closed: 7,
      card_expired: 5,
      authentication_required: 4,
      bank_declined: 3,
      insufficient_funds: 2,
      network_error: 1,
    };
    const severityFactor = severityMap[latestAttempt.failure_reason || ''] || 2;

    const riskScore = amountFactor + daysFactor + failureFactor + severityFactor;

    atRiskList.push({
      subscription: sub as Subscription & { customers: Customer },
      latestAttempt,
      failureCount,
      daysSinceFailure,
      riskScore,
      previousActions: (actions || []) as RecoveryAction[],
    });
  }

  // Sort by risk score (highest first)
  atRiskList.sort((a, b) => b.riskScore - a.riskScore);

  return atRiskList;
}

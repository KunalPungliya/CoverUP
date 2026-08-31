import { supabase } from '../supabase';
import { AtRiskSubscription, PaymentAttempt, RecoveryAction, Subscription, Customer } from '../types';

export async function detectAtRiskSubscriptions(batchLimit = 25): Promise<AtRiskSubscription[]> {
  // Fetch subscriptions with failed/past_due status, joined with customer
  const { data: subscriptions, error: subError } = await supabase
    .from('subscriptions')
    .select('*, customers(*)')
    .in('status', ['past_due', 'failed'])
    .order('updated_at', { ascending: false })
    .limit(batchLimit);

  if (subError) throw new Error(`Detection failed: ${subError.message}`);
  if (!subscriptions || subscriptions.length === 0) return [];

  const subIds = subscriptions.map((s) => s.id);

  // Batch query 1: Fetch all failed payment attempts for all these subscriptions in a SINGLE query
  const { data: allAttempts, error: attError } = await supabase
    .from('payment_attempts')
    .select('*')
    .in('subscription_id', subIds)
    .eq('status', 'failed')
    .order('attempted_at', { ascending: false });

  if (attError) console.warn('Payment attempts batch fetch error:', attError);

  // Batch query 2: Fetch all previous recovery actions in a SINGLE query
  const { data: allActions, error: actError } = await supabase
    .from('recovery_actions')
    .select('*')
    .in('subscription_id', subIds)
    .order('created_at', { ascending: false });

  if (actError) console.warn('Recovery actions batch fetch error:', actError);

  // Group attempts by subscription_id in memory
  const attemptsBySub = new Map<string, PaymentAttempt[]>();
  (allAttempts || []).forEach((att) => {
    const list = attemptsBySub.get(att.subscription_id) || [];
    list.push(att as PaymentAttempt);
    attemptsBySub.set(att.subscription_id, list);
  });

  // Group actions by subscription_id in memory
  const actionsBySub = new Map<string, RecoveryAction[]>();
  (allActions || []).forEach((act) => {
    const list = actionsBySub.get(act.subscription_id) || [];
    list.push(act as RecoveryAction);
    actionsBySub.set(act.subscription_id, list);
  });

  const atRiskList: AtRiskSubscription[] = [];

  for (const sub of subscriptions) {
    const attempts = attemptsBySub.get(sub.id) || [];
    if (attempts.length === 0) continue;

    const latestAttempt = attempts[0];
    const failureCount = attempts.length;

    // Calculate days since first failure
    const oldestFailure = attempts[attempts.length - 1];
    const daysSinceFailure = Math.max(
      0,
      Math.floor((Date.now() - new Date(oldestFailure.attempted_at).getTime()) / (1000 * 60 * 60 * 24))
    );

    const actions = actionsBySub.get(sub.id) || [];

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
      previousActions: actions,
    });
  }

  // Sort by risk score (highest first)
  atRiskList.sort((a, b) => b.riskScore - a.riskScore);

  return atRiskList;
}

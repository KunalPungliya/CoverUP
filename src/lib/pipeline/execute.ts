import { supabase } from '../supabase';
import { DecisionResult } from './decide';
import { RECOVERY_PROBABILITIES, NUDGE_RESPONSE_RATES, STOPPING_RULES, MESSAGE_TEMPLATES } from '../constants';
import { ActionOutcome, AiDecision } from '../types';

export interface ExecutionResult {
  subscriptionId: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  amount: number;
  failureReason: string;
  actionType: string;
  outcome: ActionOutcome;
  amountRecovered: number;
  aiReasoning: string;
  aiConfidence: number;
  skipped: boolean;
  skipReason?: string;
}

export async function executeRecoveryActions(
  decisions: DecisionResult[],
  batchId: string | null
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];
  const actionsToInsert: any[] = [];
  const successfulSubIds: string[] = [];
  const unrecoverableSubIds: string[] = [];
  const successfulPaymentAttempts: any[] = [];

  for (const decision of decisions) {
    const { subscription: atRisk, decision: aiDecision, skipped, skipReason } = decision;
    const sub = atRisk.subscription;

    if (skipped) {
      actionsToInsert.push({
        subscription_id: sub.id,
        batch_id: batchId,
        action_type: aiDecision.action,
        action_detail: { skip_reason: skipReason, cooldown: true },
        ai_reasoning: aiDecision.reasoning,
        ai_confidence: aiDecision.confidence,
        outcome: 'skipped',
        amount_recovered: 0,
        retry_count: atRisk.previousActions.filter((a) => a.action_type === 'retry_payment').length,
      });

      results.push({
        subscriptionId: sub.id,
        customerName: sub.customers?.name || 'Unknown Customer',
        customerEmail: sub.customers?.email || 'Unknown Email',
        planName: sub.plan_name,
        amount: sub.amount,
        failureReason: atRisk.latestAttempt.failure_reason || 'unknown',
        actionType: aiDecision.action,
        outcome: 'skipped',
        amountRecovered: 0,
        aiReasoning: aiDecision.reasoning,
        aiConfidence: aiDecision.confidence,
        skipped: true,
        skipReason,
      });
      continue;
    }

    // Check if AI suggested retry but max retries exceeded — override to escalate
    const retryCount = atRisk.previousActions.filter((a) => a.action_type === 'retry_payment').length;
    let finalAction = aiDecision.action;
    let finalReasoning = aiDecision.reasoning;

    if (finalAction === 'retry_payment' && retryCount >= STOPPING_RULES.MAX_RETRY_COUNT) {
      finalAction = 'escalate';
      finalReasoning = `AI suggested retry, but max retry count (${STOPPING_RULES.MAX_RETRY_COUNT}) exceeded. Escalating instead. Original: ${aiDecision.reasoning}`;
    }

    // Simulate the action
    const { outcome, amountRecovered } = simulateAction(
      finalAction,
      atRisk.latestAttempt.failure_reason || 'unknown',
      sub.amount
    );

    // Build action detail
    const actionDetail = buildActionDetail(finalAction, aiDecision, sub);

    actionsToInsert.push({
      subscription_id: sub.id,
      batch_id: batchId,
      action_type: finalAction,
      action_detail: actionDetail,
      ai_reasoning: finalReasoning,
      ai_confidence: aiDecision.confidence,
      outcome,
      amount_recovered: amountRecovered,
      retry_count: retryCount + (finalAction === 'retry_payment' ? 1 : 0),
    });

    if (outcome === 'success') {
      successfulSubIds.push(sub.id);
      successfulPaymentAttempts.push({
        subscription_id: sub.id,
        amount: sub.amount,
        status: 'success',
        failure_reason: null,
        failure_description: null,
        gateway_response: {
          transaction_id: `txn_rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          status: 'captured',
          recovery_batch: batchId,
        },
        attempted_at: new Date().toISOString(),
      });
    } else if (finalAction === 'mark_unrecoverable') {
      unrecoverableSubIds.push(sub.id);
    }

    results.push({
      subscriptionId: sub.id,
      customerName: sub.customers?.name || 'Unknown Customer',
      customerEmail: sub.customers?.email || 'Unknown Email',
      planName: sub.plan_name,
      amount: sub.amount,
      failureReason: atRisk.latestAttempt.failure_reason || 'unknown',
      actionType: finalAction,
      outcome,
      amountRecovered,
      aiReasoning: finalReasoning,
      aiConfidence: aiDecision.confidence,
      skipped: false,
    });
  }

  // High-performance batch writes to Supabase
  // 1. Bulk insert all recovery actions in ONE query
  if (actionsToInsert.length > 0) {
    const { error: actError } = await supabase.from('recovery_actions').insert(actionsToInsert);
    if (actError) console.error('Failed to bulk insert recovery actions:', actError);
  }

  // 2. Bulk update recovered subscriptions in ONE query
  if (successfulSubIds.length > 0) {
    const { error: subUpError } = await supabase
      .from('subscriptions')
      .update({ status: 'recovered' })
      .in('id', successfulSubIds);
    if (subUpError) console.error('Failed to bulk update recovered subs:', subUpError);
  }

  // 3. Bulk insert successful payment attempts in ONE query
  if (successfulPaymentAttempts.length > 0) {
    const { error: payError } = await supabase.from('payment_attempts').insert(successfulPaymentAttempts);
    if (payError) console.error('Failed to bulk insert payment attempts:', payError);
  }

  // 4. Bulk update unrecoverable subscriptions in ONE query
  if (unrecoverableSubIds.length > 0) {
    const { error: unrecError } = await supabase
      .from('subscriptions')
      .update({ status: 'unrecoverable' })
      .in('id', unrecoverableSubIds);
    if (unrecError) console.error('Failed to bulk update unrecoverable subs:', unrecError);
  }

  return results;
}

function simulateAction(
  action: string,
  failureReason: string,
  amount: number
): { outcome: ActionOutcome; amountRecovered: number } {
  switch (action) {
    case 'retry_payment': {
      const successRate = RECOVERY_PROBABILITIES[failureReason] ?? 0.2;
      const success = Math.random() < successRate;
      return {
        outcome: success ? 'success' : 'failed',
        amountRecovered: success ? amount : 0,
      };
    }
    case 'send_email_reminder': {
      const success = Math.random() < NUDGE_RESPONSE_RATES.email_reminder;
      return {
        outcome: success ? 'success' : 'pending',
        amountRecovered: success ? amount : 0,
      };
    }
    case 'send_sms_nudge': {
      const success = Math.random() < NUDGE_RESPONSE_RATES.sms_nudge;
      return {
        outcome: success ? 'success' : 'pending',
        amountRecovered: success ? amount : 0,
      };
    }
    case 'request_payment_update': {
      const success = Math.random() < NUDGE_RESPONSE_RATES.payment_update_request;
      return {
        outcome: success ? 'success' : 'pending',
        amountRecovered: success ? amount : 0,
      };
    }
    case 'escalate':
      return { outcome: 'pending', amountRecovered: 0 };
    case 'mark_unrecoverable':
      return { outcome: 'failed', amountRecovered: 0 };
    default:
      return { outcome: 'pending', amountRecovered: 0 };
  }
}

function buildActionDetail(action: string, aiDecision: AiDecision, subscription: any): Record<string, any> {
  const customerName = subscription.customers?.name || 'Customer';
  const planName = subscription.plan_name;
  const amountFormatted = `₹${(subscription.amount / 100).toLocaleString('en-IN')}`;

  switch (action) {
    case 'retry_payment':
      return {
        method: subscription.payment_method?.type || 'card',
        scheduled_delay_hours: aiDecision.retry_delay_hours || 24,
        next_retry_at: new Date(Date.now() + (aiDecision.retry_delay_hours || 24) * 3600 * 1000).toISOString(),
      };
    case 'send_email_reminder': {
      const templateKey = aiDecision.message_template || 'gentle_reminder';
      const template = (MESSAGE_TEMPLATES as any)[templateKey] || MESSAGE_TEMPLATES.gentle_reminder;
      return {
        channel: 'email',
        template: templateKey,
        recipient: subscription.customers?.email || 'customer@example.com',
        subject: template.subject.replace('{{plan_name}}', planName),
        body: template.body
          .replace('{{customer_name}}', customerName)
          .replace('{{plan_name}}', planName)
          .replace('{{amount}}', amountFormatted),
      };
    }
    case 'send_sms_nudge': {
      const template = MESSAGE_TEMPLATES.sms_nudge;
      return {
        channel: 'sms',
        recipient: subscription.customers?.phone || '+919876543210',
        body: template.body
          .replace('{{customer_name}}', customerName)
          .replace('{{plan_name}}', planName)
          .replace('{{amount}}', amountFormatted),
      };
    }
    case 'request_payment_update': {
      const template = MESSAGE_TEMPLATES.payment_update;
      return {
        channel: 'email',
        template: 'payment_update',
        update_url: `https://coverup.app/pay/update/${subscription.id}`,
        recipient: subscription.customers?.email || 'customer@example.com',
        subject: template.subject.replace('{{plan_name}}', planName),
        body: template.body
          .replace('{{customer_name}}', customerName)
          .replace('{{plan_name}}', planName)
          .replace('{{amount}}', amountFormatted),
      };
    }
    case 'escalate':
      return {
        assigned_to: 'Support Lead',
        priority: 'high',
        note: aiDecision.escalation_note || 'AI flagged for manual review',
      };
    case 'mark_unrecoverable':
      return {
        reason: 'Maximum retries or non-recoverable failure reason',
        subscription_status: 'unrecoverable',
      };
    default:
      return {};
  }
}

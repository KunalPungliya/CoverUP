import { supabase } from '../supabase';
import { DecisionResult } from './decide';
import { RECOVERY_PROBABILITIES, NUDGE_RESPONSE_RATES, STOPPING_RULES, MESSAGE_TEMPLATES } from '../constants';
import { ActionOutcome, RecoveryAction, AiDecision } from '../types';

export interface ExecutionResult {
  subscriptionId: string;
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
  batchId: string
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];

  for (const decision of decisions) {
    const { subscription: atRisk, decision: aiDecision, skipped, skipReason } = decision;
    const sub = atRisk.subscription;

    if (skipped) {
      // Log the skipped action
      await supabase.from('recovery_actions').insert({
        subscription_id: sub.id,
        batch_id: batchId,
        action_type: aiDecision.action,
        action_detail: { skip_reason: skipReason, cooldown: true },
        ai_reasoning: aiDecision.reasoning,
        ai_confidence: aiDecision.confidence,
        outcome: 'skipped',
        amount_recovered: 0,
        retry_count: atRisk.previousActions.filter(a => a.action_type === 'retry_payment').length,
      });

      results.push({
        subscriptionId: sub.id,
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
    const retryCount = atRisk.previousActions.filter(a => a.action_type === 'retry_payment').length;
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

    // Insert recovery action (audit trail)
    await supabase.from('recovery_actions').insert({
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

    // Update subscription status based on outcome
    if (outcome === 'success') {
      await supabase
        .from('subscriptions')
        .update({ status: 'recovered' })
        .eq('id', sub.id);

      // Insert successful payment attempt
      await supabase.from('payment_attempts').insert({
        subscription_id: sub.id,
        amount: sub.amount,
        status: 'success',
        failure_reason: null,
        failure_description: null,
        gateway_response: { transaction_id: `txn_recovered_${Date.now()}`, status: 'captured', recovery_batch: batchId },
        attempted_at: new Date().toISOString(),
      });
    } else if (finalAction === 'mark_unrecoverable') {
      await supabase
        .from('subscriptions')
        .update({ status: 'unrecoverable' })
        .eq('id', sub.id);
    }

    results.push({
      subscriptionId: sub.id,
      actionType: finalAction,
      outcome,
      amountRecovered,
      aiReasoning: finalReasoning,
      aiConfidence: aiDecision.confidence,
      skipped: false,
    });
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
      // Simulate customer responding to email and updating payment
      const responded = Math.random() < NUDGE_RESPONSE_RATES.email_reminder;
      if (responded) {
        // Customer updated payment method, simulate retry
        const retrySuccess = Math.random() < 0.75; // higher success after customer action
        return {
          outcome: retrySuccess ? 'success' : 'pending',
          amountRecovered: retrySuccess ? amount : 0,
        };
      }
      return { outcome: 'pending', amountRecovered: 0 };
    }

    case 'send_sms_nudge': {
      const responded = Math.random() < NUDGE_RESPONSE_RATES.sms_nudge;
      if (responded) {
        const retrySuccess = Math.random() < 0.70;
        return {
          outcome: retrySuccess ? 'success' : 'pending',
          amountRecovered: retrySuccess ? amount : 0,
        };
      }
      return { outcome: 'pending', amountRecovered: 0 };
    }

    case 'request_payment_update': {
      const updated = Math.random() < NUDGE_RESPONSE_RATES.payment_update_request;
      if (updated) {
        const retrySuccess = Math.random() < 0.80;
        return {
          outcome: retrySuccess ? 'success' : 'pending',
          amountRecovered: retrySuccess ? amount : 0,
        };
      }
      return { outcome: 'pending', amountRecovered: 0 };
    }

    case 'escalate':
      return { outcome: 'pending', amountRecovered: 0 };

    case 'mark_unrecoverable':
      return { outcome: 'failed', amountRecovered: 0 };

    default:
      return { outcome: 'pending', amountRecovered: 0 };
  }
}

function buildActionDetail(
  action: string,
  aiDecision: AiDecision,
  sub: { plan_name: string; amount: number; customers?: { name: string; email: string } | null }
): Record<string, unknown> {
  const customerName = sub.customers?.name || 'Customer';
  const amount = `₹${(sub.amount / 100).toLocaleString('en-IN')}`;

  switch (action) {
    case 'retry_payment':
      return {
        type: 'automatic_retry',
        retry_delay_hours: aiDecision.retry_delay_hours,
        gateway: 'razorpay',
      };

    case 'send_email_reminder':
    case 'send_sms_nudge': {
      const templateKey = aiDecision.message_template || 'gentle_reminder';
      const template = MESSAGE_TEMPLATES[templateKey as keyof typeof MESSAGE_TEMPLATES];
      if (template) {
        const body = ('body' in template ? template.body : '')
          .replace(/{{customer_name}}/g, customerName)
          .replace(/{{amount}}/g, amount)
          .replace(/{{plan_name}}/g, sub.plan_name);
        return {
          channel: action === 'send_email_reminder' ? 'email' : 'sms',
          template: templateKey,
          to: sub.customers?.email || 'unknown',
          subject: 'subject' in template
            ? template.subject.replace(/{{plan_name}}/g, sub.plan_name)
            : undefined,
          body,
          simulated: true,
        };
      }
      return { channel: action === 'send_email_reminder' ? 'email' : 'sms', simulated: true };
    }

    case 'request_payment_update':
      return {
        channel: 'email',
        template: 'payment_update',
        to: sub.customers?.email || 'unknown',
        update_link: `https://coverup.app/update-payment/${sub.customers?.name || 'user'}`,
        simulated: true,
      };

    case 'escalate':
      return {
        escalation_note: aiDecision.escalation_note,
        assigned_to: 'recovery_team',
        priority: 'high',
      };

    case 'mark_unrecoverable':
      return {
        reason: aiDecision.reasoning,
        final_status: 'closed',
      };

    default:
      return {};
  }
}

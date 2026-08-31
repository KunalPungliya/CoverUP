import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { FailureReason, AtRiskSubscription, PaymentAttempt, RecoveryAction, Subscription, Customer } from '@/lib/types';
import { decideRecoveryActions } from '@/lib/pipeline/decide';
import { executeRecoveryActions } from '@/lib/pipeline/execute';

export const maxDuration = 60;

// Map Razorpay error reasons/codes to CoverUP FailureReason
function mapRazorpayFailureReason(errorReason?: string, errorCode?: string, description?: string): FailureReason {
  const text = `${errorReason || ''} ${errorCode || ''} ${description || ''}`.toLowerCase();

  if (text.includes('fraud') || text.includes('risk') || text.includes('suspect')) {
    return 'fraud_suspected';
  }
  if (text.includes('closed') || text.includes('invalid_account') || text.includes('account_blocked')) {
    return 'account_closed';
  }
  if (text.includes('expired') || text.includes('card_expired')) {
    return 'card_expired';
  }
  if (text.includes('insufficient') || text.includes('nsf') || text.includes('low_balance')) {
    return 'insufficient_funds';
  }
  if (text.includes('auth') || text.includes('3ds') || text.includes('otp') || text.includes('sca')) {
    return 'authentication_required';
  }
  if (text.includes('bank') || text.includes('issuer') || text.includes('policy')) {
    return 'bank_declined';
  }
  return 'network_error';
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const event = body.event || 'payment.failed';
    const paymentEntity = body.payload?.payment?.entity || body.payment || {};
    const subscriptionIdFromPayload = body.subscription_id || paymentEntity.subscription_id || paymentEntity.notes?.subscription_id;

    // Only process payment failures or explicit simulation requests
    if (event !== 'payment.failed' && !event.includes('fail')) {
      return NextResponse.json({
        success: true,
        message: `Event '${event}' acknowledged, no recovery action required.`,
        event,
      });
    }

    const razorpayPaymentId = paymentEntity.id || `pay_sim_${Date.now()}`;
    const amount = paymentEntity.amount || 149900;
    const rawReason = paymentEntity.error_reason || paymentEntity.error_code || 'insufficient_funds';
    const errorDescription = paymentEntity.error_description || 'Payment authorization failed';
    const failureReason = mapRazorpayFailureReason(rawReason, paymentEntity.error_code, errorDescription);

    let targetSubscription: (Subscription & { customers: Customer }) | null = null;

    // 1. If explicit subscription_id passed, fetch it
    if (subscriptionIdFromPayload) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*, customers(*)')
        .eq('id', subscriptionIdFromPayload)
        .single();
      if (sub) {
        targetSubscription = sub as Subscription & { customers: Customer };
      }
    }

    // 2. Otherwise pick an existing active or past_due subscription to apply webhook to
    if (!targetSubscription) {
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('*, customers(*)')
        .in('status', ['past_due', 'failed', 'active'])
        .order('updated_at', { ascending: false })
        .limit(1);

      if (subs && subs.length > 0) {
        targetSubscription = subs[0] as Subscription & { customers: Customer };
      }
    }

    if (!targetSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'No target subscription found in database. Seed data first via Dashboard.',
        },
        { status: 404 }
      );
    }

    // 3. Mark subscription as past_due / failed
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('id', targetSubscription.id);

    // 4. Log the failed payment attempt from Razorpay
    const newAttempt = {
      subscription_id: targetSubscription.id,
      amount: amount,
      status: 'failed' as const,
      failure_reason: failureReason,
      failure_description: errorDescription,
      gateway_response: {
        event,
        razorpay_payment_id: razorpayPaymentId,
        error_code: paymentEntity.error_code || 'BAD_REQUEST_ERROR',
        error_reason: rawReason,
        error_source: paymentEntity.error_source || 'bank',
        error_step: paymentEntity.error_step || 'payment_authorization',
        method: paymentEntity.method || 'card',
        card: paymentEntity.card || { last4: '4312', network: 'Visa' },
        simulated_webhook: true,
        received_at: new Date().toISOString(),
      },
      attempted_at: new Date().toISOString(),
    };

    const { data: insertedAttempt, error: attemptError } = await supabase
      .from('payment_attempts')
      .insert(newAttempt)
      .select()
      .single();

    if (attemptError || !insertedAttempt) {
      throw new Error(`Failed to log payment attempt: ${attemptError?.message}`);
    }

    // 5. Gather history for AI decision
    const { data: allAttempts } = await supabase
      .from('payment_attempts')
      .select('*')
      .eq('subscription_id', targetSubscription.id)
      .eq('status', 'failed')
      .order('attempted_at', { ascending: false });

    const { data: prevActions } = await supabase
      .from('recovery_actions')
      .select('*')
      .eq('subscription_id', targetSubscription.id)
      .order('created_at', { ascending: false });

    const failureCount = allAttempts ? allAttempts.length : 1;
    const oldestAttempt = allAttempts && allAttempts.length > 0 ? allAttempts[allAttempts.length - 1] : insertedAttempt;
    const daysSinceFailure = Math.max(
      0,
      Math.floor((Date.now() - new Date(oldestAttempt.attempted_at).getTime()) / (1000 * 60 * 60 * 24))
    );

    // Risk score calculation
    const amountFactor = Math.min(targetSubscription.amount / 100000, 10);
    const daysFactor = Math.min(daysSinceFailure / 5, 5);
    const failureFactor = Math.min(failureCount, 5);
    const severityMap: Record<string, number> = {
      fraud_suspected: 8,
      account_closed: 7,
      card_expired: 5,
      authentication_required: 4,
      bank_declined: 3,
      insufficient_funds: 2,
      network_error: 1,
    };
    const severityFactor = severityMap[failureReason] || 2;
    const riskScore = amountFactor + daysFactor + failureFactor + severityFactor;

    const atRiskItem: AtRiskSubscription = {
      subscription: targetSubscription,
      latestAttempt: insertedAttempt as PaymentAttempt,
      failureCount,
      daysSinceFailure,
      riskScore,
      previousActions: (prevActions || []) as RecoveryAction[],
    };

    // 6. Autonomous AI Agent Intervention
    const decideStart = Date.now();
    const decisions = await decideRecoveryActions([atRiskItem]);
    const decideDuration = Date.now() - decideStart;

    // Create a mini batch for the webhook event
    const { data: batch } = await supabase
      .from('recovery_batches')
      .insert({
        total_at_risk: 1,
        total_amount_at_risk: targetSubscription.amount,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    const batchId = batch?.id || null;
    const executeStart = Date.now();
    const execResults = await executeRecoveryActions(decisions, batchId);
    const executeDuration = Date.now() - executeStart;

    const decisionResult = decisions[0];
    const execResult = execResults[0];

    // Update batch stats if batch was created
    if (batch?.id) {
      await supabase
        .from('recovery_batches')
        .update({
          total_recovered: execResult.outcome === 'success' ? 1 : 0,
          total_unresolved: execResult.outcome !== 'success' ? 1 : 0,
          total_amount_recovered: execResult.amountRecovered,
        })
        .eq('id', batch.id);
    }

    const totalDuration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      event,
      razorpay_payment_id: razorpayPaymentId,
      subscription: {
        id: targetSubscription.id,
        plan_name: targetSubscription.plan_name,
        amount: targetSubscription.amount,
        customer_name: targetSubscription.customers.name,
        customer_email: targetSubscription.customers.email,
      },
      failure_reason: failureReason,
      error_description: errorDescription,
      ai_intervention: {
        action: decisionResult.decision.action,
        reasoning: decisionResult.decision.reasoning,
        confidence: decisionResult.decision.confidence,
        outcome: execResult.outcome,
        amount_recovered: execResult.amountRecovered,
        skipped: decisionResult.skipped,
        skip_reason: decisionResult.skipReason,
      },
      performance: {
        decide_ms: decideDuration,
        execute_ms: executeDuration,
        total_ms: totalDuration,
      },
      batch_id: batchId,
    });
  } catch (error) {
    console.error('Razorpay webhook processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown webhook error',
      },
      { status: 500 }
    );
  }
}

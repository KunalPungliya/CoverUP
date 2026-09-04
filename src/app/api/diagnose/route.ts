import { NextRequest, NextResponse } from 'next/server';
import { getAiDecision, getFallbackDecision } from '@/lib/gemini';
import { AtRiskSubscription } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer_name = 'Acme Technologies',
      customer_email = 'billing@acme.inc',
      plan_name = 'Enterprise Scale (Annual)',
      amount = 495000,
      currency = 'INR',
      billing_cycle = 'monthly',
      payment_method_type = 'card',
      failure_reason = 'insufficient_funds',
      failure_description = 'Transaction declined: Insufficient balance in account',
      failure_count = 1,
      days_since_failure = 2,
      tenure_days = 180,
      previous_actions = [],
    } = body;

    const atRisk: AtRiskSubscription = {
      subscription: {
        id: `sub_sim_${Date.now()}`,
        customer_id: 'cust_sim_01',
        plan_name,
        amount: Number(amount),
        currency,
        billing_cycle: billing_cycle as any,
        status: 'past_due',
        current_period_start: new Date(Date.now() - 30 * 86400000).toISOString(),
        current_period_end: new Date().toISOString(),
        payment_method: {
          type: payment_method_type as any,
          brand: payment_method_type === 'card' ? 'Visa' : undefined,
          upi_id: payment_method_type === 'upi' ? 'acme@okhdfcbank' : undefined,
        },
        created_at: new Date(Date.now() - tenure_days * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        customers: {
          id: 'cust_sim_01',
          name: customer_name,
          email: customer_email,
          phone: '+91 98765 43210',
          created_at: new Date(Date.now() - tenure_days * 86400000).toISOString(),
        },
      },
      latestAttempt: {
        id: `pay_sim_${Date.now()}`,
        subscription_id: `sub_sim_${Date.now()}`,
        amount: Number(amount),
        status: 'failed',
        failure_reason: failure_reason as any,
        failure_description,
        gateway_response: { code: failure_reason, source: 'simulator' },
        attempted_at: new Date().toISOString(),
      },
      failureCount: Number(failure_count),
      daysSinceFailure: Number(days_since_failure),
      riskScore: Math.min(99, Math.max(15, failure_count * 25 + (amount > 300000 ? 15 : 0))),
      previousActions: previous_actions,
    };

    const startTime = Date.now();
    const decision = await getAiDecision(atRisk);
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        decision,
        input: atRisk,
        telemetry: {
          latencyMs,
          engine: process.env.GEMINI_API_KEY ? 'Google Gemini 2.0 Flash' : 'Calibrated Rule Engine',
          evaluated_at: new Date().toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error('Diagnosis API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Diagnosis failed' },
      { status: 500 }
    );
  }
}

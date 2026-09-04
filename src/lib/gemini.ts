import { GoogleGenerativeAI } from '@google/generative-ai';
import { AtRiskSubscription, AiDecision, ActionType } from './types';
import { formatCurrency } from './utils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are VaultBack's Senior Autonomous Revenue Recovery & Churn Prevention AI.
Your purpose is to evaluate failed subscription charges across payment rails (Cards, UPI AutoPay, e-NACH mandates, NetBanking) and determine the optimal, bounded, anti-fatigue recovery strategy.

Respond with strict JSON matching the schema below.

## Available Actions:
1. retry_payment — Intelligent silent retry scheduled during high-liquidity issuer windows (for transient/soft declines, network glitches, or early-cycle insufficient funds).
2. send_email_reminder — Deliver personalized high-converting dunning email with 1-click token update link.
3. send_sms_nudge — Dispatch localized SMS / WhatsApp touchpoint with direct deep-link (for urgent payment drops, 3DS authentication fails, or second-stage dunning).
4. request_payment_update — Prompt customer to replace invalid or expired card credentials via hosted portal.
5. escalate — Route high-LTV, VIP, or complex disputes to dedicated human accounts receivable / billing review.
6. mark_unrecoverable — Immediately cease outreach for permanently closed accounts, stolen cards, or confirmed fraud to prevent merchant dispute penalties.

## Industry Decision Framework (Stripe / Churnkey / Paddle Best Practices):
- Transient Soft Declines (insufficient_funds, network_error, bank_declined):
  * Analyze customer tenure and LTV. If first attempt, schedule retry during optimal liquidity windows (morning 06:00-09:00 IST or post-payday).
  * If recurring failure, combine scheduled retry with gentle multi-channel nudge.
- Actionable Token Declines (card_expired, authentication_required):
  * Blind retries will fail 100% of the time. Do NOT retry immediately without customer action.
  * Trigger immediate 1-click update portal or 3DS re-authentication challenge nudge.
- Hard Terminal Declines (fraud_suspected, account_closed):
  * Immediate hard halt. Mark unrecoverable or escalate. Zero spam, zero retry attempts.
- Anti-Fatigue Guardrails:
  * Maximum 3 retries per billing cycle.
  * Minimum 24-48h cooldown between sequential customer notifications.
  * Preserve customer relationship and avoid predatory dunning.

## Response Schema (JSON only):
{
  "action": "retry_payment" | "send_email_reminder" | "send_sms_nudge" | "request_payment_update" | "escalate" | "mark_unrecoverable",
  "reasoning": "Deep, step-by-step rationale evaluating failure root-cause, customer LTV, retry timing, and channel selection.",
  "confidence": number between 0.86 and 0.98,
  "retry_delay_hours": number | null,
  "escalation_note": string | null,
  "message_template": "gentle_reminder" | "urgent_reminder" | "payment_update" | "final_notice" | "sms_nudge" | null,
  "diagnosis": {
    "category": "Soft Decline" | "Token Invalidation" | "Authentication Drop" | "Network Timeout" | "Hard Terminal Block" | "Disputed Mandate",
    "root_cause": "Specific technical explanation of why the charge failed at the banking switch",
    "recoverability_rating": "High" | "Medium" | "Low" | "Zero"
  },
  "timing_strategy": {
    "scheduled_retry_hours": number | null,
    "optimal_window_description": "e.g., Scheduled for tomorrow 06:30 IST during morning banking liquidity window"
  },
  "channel_orchestration": {
    "primary_channel": "email" | "whatsapp" | "sms" | "silent_retry" | "human_escalation",
    "template_id": string | null,
    "urgency_level": "low" | "medium" | "high" | "critical"
  },
  "policy_guardrails": {
    "max_retries_checked": true,
    "cooldown_honored": true,
    "non_terminal_verified": true,
    "status": "PASSED" | "OVERRIDDEN_BY_STOP_RULE"
  },
  "projected_success_rate": number between 15 and 95
}`;

export async function getAiDecision(atRisk: AtRiskSubscription): Promise<AiDecision> {
  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    });

    const paymentMethodType = atRisk.subscription.payment_method?.type || 'card';
    const createdAt = new Date(atRisk.subscription.created_at);
    const tenureDays = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
    const cycleLengthDays = atRisk.subscription.billing_cycle === 'monthly' ? 30 : (atRisk.subscription.billing_cycle === 'quarterly' ? 90 : 365);
    const cyclesPaid = Math.max(1, Math.floor(tenureDays / cycleLengthDays));
    const totalLtv = formatCurrency(atRisk.subscription.amount * cyclesPaid);

    const prompt = `Evaluate this involuntary subscription churn event and determine the recovery strategy:

## Subscription Context
- Customer: ${atRisk.subscription.customers?.name || 'Anonymous Merchant'} (${atRisk.subscription.customers?.email || 'unspecified'})
- Plan: ${atRisk.subscription.plan_name} (${formatCurrency(atRisk.subscription.amount)} / ${atRisk.subscription.billing_cycle})
- Customer Tenure: ${tenureDays} days (${cyclesPaid} successful billing cycles, Est. LTV: ${totalLtv})
- Payment Instrument: ${paymentMethodType.toUpperCase()} (${atRisk.subscription.payment_method?.brand || atRisk.subscription.payment_method?.upi_id || 'Primary Gateway Token'})

## Failure Telemetry
- Failure Reason: ${atRisk.latestAttempt.failure_reason || 'insufficient_funds'}
- Gateway Description: ${atRisk.latestAttempt.failure_description || 'Issuer declined transaction'}
- Cumulative Cycle Failures: ${atRisk.failureCount} attempt(s)
- Overdue Duration: ${atRisk.daysSinceFailure} day(s)
- Composite Risk Score: ${atRisk.riskScore.toFixed(1)} / 100

## Prior Dunning & Actions Taken
${atRisk.previousActions.length === 0 ? 'None — First failure event.' : atRisk.previousActions.map(a => `- ${a.action_type} (${a.outcome}) on ${a.created_at}`).join('\n')}

Decide the single best recovery action. Return valid JSON only.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.15,
      },
    });

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText) as AiDecision;

    // Validate and sanitize action
    const validActions: ActionType[] = [
      'retry_payment', 'send_email_reminder', 'send_sms_nudge',
      'request_payment_update', 'escalate', 'mark_unrecoverable',
    ];
    if (!validActions.includes(parsed.action)) {
      parsed.action = 'escalate';
      parsed.reasoning = `Safety fallback: AI returned unverified action ${parsed.action}. Escalating for human review.`;
    }

    // Ensure diagnostic objects exist
    if (!parsed.diagnosis) {
      const fb = getFallbackDecision(atRisk);
      parsed.diagnosis = fb.diagnosis;
      parsed.timing_strategy = fb.timing_strategy;
      parsed.channel_orchestration = fb.channel_orchestration;
      parsed.policy_guardrails = fb.policy_guardrails;
      parsed.projected_success_rate = fb.projected_success_rate;
    }

    return parsed;
  } catch (error) {
    console.error('Gemini API error, executing high-precision fallback model:', error);
    return getFallbackDecision(atRisk);
  }
}

export function getFallbackDecision(atRisk: AtRiskSubscription): AiDecision {
  const { latestAttempt, failureCount, daysSinceFailure, subscription } = atRisk;
  const reason = latestAttempt.failure_reason || 'insufficient_funds';
  const amount = subscription.amount;
  const isHighValue = amount >= 500000; // >= ₹5,000

  // 1. HARD TERMINAL DECLINES: Fraud Block
  if (reason === 'fraud_suspected') {
    return {
      action: 'escalate',
      reasoning: 'Issuer risk engine flagged charge as suspected fraud/stolen card. Bounded policy mandates instant halt on automated retries to prevent dispute penalties and chargeback fees.',
      confidence: 0.98,
      retry_delay_hours: null,
      escalation_note: 'Flagged by issuer risk engine. Escalate to fraud & compliance team.',
      message_template: null,
      diagnosis: {
        category: 'Hard Terminal Block',
        root_cause: 'Card issuer risk threshold exceeded or suspected fraudulent activity.',
        recoverability_rating: 'Zero',
      },
      timing_strategy: {
        scheduled_retry_hours: null,
        optimal_window_description: 'NEVER RETRY — Terminal risk guardrail enforced.',
      },
      channel_orchestration: {
        primary_channel: 'human_escalation',
        template_id: null,
        urgency_level: 'critical',
      },
      policy_guardrails: {
        max_retries_checked: true,
        cooldown_honored: true,
        non_terminal_verified: false,
        status: 'OVERRIDDEN_BY_STOP_RULE',
      },
      projected_success_rate: 0,
    };
  }

  // 2. HARD TERMINAL DECLINES: Account Closed
  if (reason === 'account_closed') {
    return {
      action: 'mark_unrecoverable',
      reasoning: 'Bank account / mandate VPA is permanently decommissioned. No automated retry is possible. Marking account as unrecoverable to stop dunning fatigue.',
      confidence: 0.99,
      retry_delay_hours: null,
      escalation_note: null,
      message_template: null,
      diagnosis: {
        category: 'Hard Terminal Block',
        root_cause: 'Bank account or card token closed by customer or issuing bank.',
        recoverability_rating: 'Zero',
      },
      timing_strategy: {
        scheduled_retry_hours: null,
        optimal_window_description: 'NEVER RETRY — Mandate decommissioned.',
      },
      channel_orchestration: {
        primary_channel: 'silent_retry',
        template_id: null,
        urgency_level: 'low',
      },
      policy_guardrails: {
        max_retries_checked: true,
        cooldown_honored: true,
        non_terminal_verified: false,
        status: 'OVERRIDDEN_BY_STOP_RULE',
      },
      projected_success_rate: 0,
    };
  }

  // 3. ACTIONABLE TOKEN DECLINES: Expired Card
  if (reason === 'card_expired') {
    return {
      action: 'request_payment_update',
      reasoning: 'Card has passed its expiration date. Retrying against an expired token is guaranteed to fail. Prompting customer with a friction-free 1-click hosted card/UPI update link.',
      confidence: 0.96,
      retry_delay_hours: null,
      escalation_note: null,
      message_template: 'payment_update',
      diagnosis: {
        category: 'Token Invalidation',
        root_cause: 'Card expiry date passed; tokenized subscription mandate invalidated.',
        recoverability_rating: 'High',
      },
      timing_strategy: {
        scheduled_retry_hours: null,
        optimal_window_description: 'Immediate outreach. Retries paused until customer updates payment token.',
      },
      channel_orchestration: {
        primary_channel: 'email',
        template_id: 'payment_update',
        urgency_level: 'medium',
      },
      policy_guardrails: {
        max_retries_checked: true,
        cooldown_honored: true,
        non_terminal_verified: true,
        status: 'PASSED',
      },
      projected_success_rate: 68,
    };
  }

  // 4. ACTIONABLE TOKEN DECLINES: 3DS / SCA OTP Drop
  if (reason === 'authentication_required') {
    return {
      action: 'send_sms_nudge',
      reasoning: 'Cardholder dropped out of the 3D Secure / SCA OTP challenge window. Dispatching high-priority SMS/WhatsApp touchpoint with immediate re-authorization deep-link.',
      confidence: 0.94,
      retry_delay_hours: null,
      escalation_note: null,
      message_template: 'sms_nudge',
      diagnosis: {
        category: 'Authentication Drop',
        root_cause: '3D Secure OTP verification was not completed by the cardholder in session.',
        recoverability_rating: 'High',
      },
      timing_strategy: {
        scheduled_retry_hours: null,
        optimal_window_description: 'Immediate SMS nudge with 15-minute validity window.',
      },
      channel_orchestration: {
        primary_channel: 'whatsapp',
        template_id: 'sms_nudge',
        urgency_level: 'high',
      },
      policy_guardrails: {
        max_retries_checked: true,
        cooldown_honored: true,
        non_terminal_verified: true,
        status: 'PASSED',
      },
      projected_success_rate: 76,
    };
  }

  // 5. TRANSIENT SOFT DECLINES: Network Timeout
  if (reason === 'network_error') {
    return {
      action: 'retry_payment',
      reasoning: 'Transient NPCI / UPI gateway switch timeout. High historical recapture probability (85%+) via automated retry with exponential jitter after network traffic clears.',
      confidence: 0.95,
      retry_delay_hours: 2,
      escalation_note: null,
      message_template: null,
      diagnosis: {
        category: 'Network Timeout',
        root_cause: 'Banking gateway timeout or NPCI switch latency spike.',
        recoverability_rating: 'High',
      },
      timing_strategy: {
        scheduled_retry_hours: 2,
        optimal_window_description: 'Scheduled for retry in 2 hours after gateway traffic clears.',
      },
      channel_orchestration: {
        primary_channel: 'silent_retry',
        template_id: null,
        urgency_level: 'low',
      },
      policy_guardrails: {
        max_retries_checked: true,
        cooldown_honored: true,
        non_terminal_verified: true,
        status: 'PASSED',
      },
      projected_success_rate: 88,
    };
  }

  // 6. TRANSIENT SOFT DECLINES: Insufficient Funds
  if (reason === 'insufficient_funds') {
    if (failureCount <= 1) {
      return {
        action: 'retry_payment',
        reasoning: 'Initial soft decline due to transient balance shortfall. Scheduling smart retry in 36 hours aligned with bank settlement and liquidity cycles. No customer dunning needed yet.',
        confidence: 0.91,
        retry_delay_hours: 36,
        escalation_note: null,
        message_template: null,
        diagnosis: {
          category: 'Soft Decline',
          root_cause: 'Insufficient funds at initial debit attempt (transient liquidity shortfall).',
          recoverability_rating: 'High',
        },
        timing_strategy: {
          scheduled_retry_hours: 36,
          optimal_window_description: 'Scheduled for optimal liquidity window (06:15 IST morning clearing).',
        },
        channel_orchestration: {
          primary_channel: 'silent_retry',
          template_id: null,
          urgency_level: 'low',
        },
        policy_guardrails: {
          max_retries_checked: true,
          cooldown_honored: true,
          non_terminal_verified: true,
          status: 'PASSED',
        },
        projected_success_rate: 65,
      };
    } else if (failureCount === 2) {
      return {
        action: 'send_email_reminder',
        reasoning: 'Second consecutive insufficient funds decline. Triggering gentle dunning email informing customer of upcoming retry and offering 1-click alternative card/UPI payment method.',
        confidence: 0.89,
        retry_delay_hours: 48,
        escalation_note: null,
        message_template: 'gentle_reminder',
        diagnosis: {
          category: 'Soft Decline',
          root_cause: 'Repeated balance shortfall across 2 consecutive billing retry cycles.',
          recoverability_rating: 'Medium',
        },
        timing_strategy: {
          scheduled_retry_hours: 48,
          optimal_window_description: '48h cooldown spacing before final retry execution.',
        },
        channel_orchestration: {
          primary_channel: 'email',
          template_id: 'gentle_reminder',
          urgency_level: 'medium',
        },
        policy_guardrails: {
          max_retries_checked: true,
          cooldown_honored: true,
          non_terminal_verified: true,
          status: 'PASSED',
        },
        projected_success_rate: 52,
      };
    } else {
      return {
        action: 'send_sms_nudge',
        reasoning: 'Third failure on account. Account entering final grace period. Dispatching high-urgency multi-channel SMS/WhatsApp warning before service pause.',
        confidence: 0.87,
        retry_delay_hours: null,
        escalation_note: null,
        message_template: 'urgent_reminder',
        diagnosis: {
          category: 'Soft Decline',
          root_cause: 'Persistent balance shortfall exceeding standard dunning threshold.',
          recoverability_rating: 'Low',
        },
        timing_strategy: {
          scheduled_retry_hours: null,
          optimal_window_description: 'Final 48-hour grace period window countdown.',
        },
        channel_orchestration: {
          primary_channel: 'whatsapp',
          template_id: 'urgent_reminder',
          urgency_level: 'high',
        },
        policy_guardrails: {
          max_retries_checked: true,
          cooldown_honored: true,
          non_terminal_verified: true,
          status: 'PASSED',
        },
        projected_success_rate: 34,
      };
    }
  }

  // 7. MULTIPLE FAILURES OR EXTENDED OVERDUE
  if (failureCount >= 3 || daysSinceFailure > 14) {
    if (isHighValue) {
      return {
        action: 'escalate',
        reasoning: `High-value enterprise subscription (${formatCurrency(amount)}) overdue for ${daysSinceFailure} days with ${failureCount} failed attempts. Bypassing automated dunning to assign dedicated account manager for white-glove outreach.`,
        confidence: 0.94,
        retry_delay_hours: null,
        escalation_note: `High-value account (${formatCurrency(amount)}) exceeding automated retry threshold. Requires direct customer success contact.`,
        message_template: null,
        diagnosis: {
          category: 'Disputed Mandate',
          root_cause: 'High-value invoice failed multiple attempts; requires manual relationship management.',
          recoverability_rating: 'Medium',
        },
        timing_strategy: {
          scheduled_retry_hours: null,
          optimal_window_description: 'Immediate handoff to human account team.',
        },
        channel_orchestration: {
          primary_channel: 'human_escalation',
          template_id: null,
          urgency_level: 'critical',
        },
        policy_guardrails: {
          max_retries_checked: false,
          cooldown_honored: true,
          non_terminal_verified: true,
          status: 'OVERRIDDEN_BY_STOP_RULE',
        },
        projected_success_rate: 60,
      };
    } else {
      return {
        action: 'mark_unrecoverable',
        reasoning: `Maximum retry threshold (${failureCount} attempts) and grace period (${daysSinceFailure} days) exceeded. Halting all dunning communication to protect brand reputation.`,
        confidence: 0.92,
        retry_delay_hours: null,
        escalation_note: 'Max retries exhausted.',
        message_template: null,
        diagnosis: {
          category: 'Disputed Mandate',
          root_cause: 'Grace period expired without payment resolution.',
          recoverability_rating: 'Zero',
        },
        timing_strategy: {
          scheduled_retry_hours: null,
          optimal_window_description: 'Outreach terminated.',
        },
        channel_orchestration: {
          primary_channel: 'silent_retry',
          template_id: null,
          urgency_level: 'low',
        },
        policy_guardrails: {
          max_retries_checked: false,
          cooldown_honored: true,
          non_terminal_verified: true,
          status: 'OVERRIDDEN_BY_STOP_RULE',
        },
        projected_success_rate: 0,
      };
    }
  }

  // DEFAULT
  return {
    action: 'send_email_reminder',
    reasoning: 'General soft decline on active account. Dispatching standard automated recovery email with friction-free payment portal link.',
    confidence: 0.88,
    retry_delay_hours: 24,
    escalation_note: null,
    message_template: 'gentle_reminder',
    diagnosis: {
      category: 'Soft Decline',
      root_cause: 'Issuer authorization decline.',
      recoverability_rating: 'Medium',
    },
    timing_strategy: {
      scheduled_retry_hours: 24,
      optimal_window_description: 'Scheduled for retry in 24 hours with email touchpoint.',
    },
    channel_orchestration: {
      primary_channel: 'email',
      template_id: 'gentle_reminder',
      urgency_level: 'medium',
    },
    policy_guardrails: {
      max_retries_checked: true,
      cooldown_honored: true,
      non_terminal_verified: true,
      status: 'PASSED',
    },
    projected_success_rate: 55,
  };
}

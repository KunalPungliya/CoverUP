import { GoogleGenerativeAI } from '@google/generative-ai';
import { AtRiskSubscription, AiDecision, ActionType } from './types';
import { formatCurrency } from './utils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are a payment recovery specialist AI for CoverUP, an AI-powered revenue recovery platform. Your job is to analyze failed subscription payments and decide the best recovery action.

You must respond with valid JSON only, no markdown or explanation outside the JSON.

Available actions:
1. retry_payment — Retry the payment (good for transient errors like network issues or temporary insufficient funds)
2. send_email_reminder — Send a gentle email reminder to the customer
3. send_sms_nudge — Send a short SMS nudge (more urgent than email)
4. request_payment_update — Ask customer to update their payment method (good for expired cards)
5. escalate — Flag for human review (suspicious cases)
6. mark_unrecoverable — Stop all recovery attempts (closed accounts, confirmed fraud)

Consider these factors:
- failure_reason: Why the payment failed
- failure_count: How many times it has failed
- days_since_failure: How long ago it first failed
- amount: Higher amounts deserve more recovery effort
- customer_history: Tenure and past payment reliability

## Few-Shot Examples

Example 1 - Network error, first failure:
\`\`\`json
{
  "action": "retry_payment",
  "reasoning": "This is a transient network error on the first attempt. Gateway timeout errors typically resolve on retry. The customer has been active for 6 months with no prior payment issues, suggesting a healthy account. Immediate retry with a 1-hour delay is the optimal approach.",
  "confidence": 0.88,
  "retry_delay_hours": 1,
  "escalation_note": null,
  "message_template": null
}
\`\`\`

Example 2 - Card expired, 2 failures:
\`\`\`json
{
  "action": "request_payment_update",
  "reasoning": "The card on file has expired. Retrying will not succeed — the customer must update their payment method. Sending a payment update request with a direct link is the most effective approach. The ₹1,499 Pro Monthly plan is a mid-tier subscription worth recovering.",
  "confidence": 0.92,
  "retry_delay_hours": null,
  "escalation_note": null,
  "message_template": "payment_update"
}
\`\`\`

Example 3 - Insufficient funds, 3 failures, 12 days:
\`\`\`json
{
  "action": "send_sms_nudge",
  "reasoning": "Three consecutive failures due to insufficient funds over 12 days suggests the customer may not be aware of the issue. Email reminders have already been sent. An SMS nudge is more immediate and has a 30% response rate. If this doesn't work, the next step would be escalation.",
  "confidence": 0.65,
  "retry_delay_hours": null,
  "escalation_note": null,
  "message_template": "sms_nudge"
}
\`\`\`

Respond ONLY with this JSON structure:
{
  "action": "one_of_the_6_actions_above",
  "reasoning": "Clear explanation of why this action was chosen",
  "confidence": 0.0_to_1.0,
  "retry_delay_hours": null_or_number,
  "escalation_note": null_or_string,
  "message_template": null_or_one_of["gentle_reminder","urgent_reminder","payment_update","final_notice","sms_nudge"]
}`;

export async function getAiDecision(atRisk: AtRiskSubscription): Promise<AiDecision> {
  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    });

    const paymentMethodType = atRisk.subscription.payment_method?.type || 'unknown';
    const createdAt = new Date(atRisk.subscription.created_at);
    const tenureDays = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Estimate billing cycles paid so far (very rough approximation based on tenure)
    const cycleLengthDays = atRisk.subscription.billing_cycle === 'monthly' ? 30 : (atRisk.subscription.billing_cycle === 'quarterly' ? 90 : 365);
    const cyclesPaid = Math.max(0, Math.floor(tenureDays / cycleLengthDays));
    const totalValue = formatCurrency(atRisk.subscription.amount * cyclesPaid);

    const prompt = `Analyze this failed subscription and decide the best recovery action:

## Subscription Details
- Plan: ${atRisk.subscription.plan_name}
- Amount: ${formatCurrency(atRisk.subscription.amount)}
- Billing Cycle: ${atRisk.subscription.billing_cycle}
- Status: ${atRisk.subscription.status}
- Payment Method Type: ${paymentMethodType}

## Failure Details
- Failure Reason: ${atRisk.latestAttempt.failure_reason}
- Failure Description: ${atRisk.latestAttempt.failure_description}
- Total Failed Attempts: ${atRisk.failureCount}
- Days Since First Failure: ${atRisk.daysSinceFailure}

## Customer Info
- Name: ${atRisk.subscription.customers?.name || 'Unknown'}
- Email: ${atRisk.subscription.customers?.email || 'Unknown'}
- Customer Since: ${atRisk.subscription.created_at}
- Tenure: ${tenureDays} days
- Estimated Lifetime Value: ${totalValue}

## Previous Recovery Actions
${atRisk.previousActions.length === 0 ? 'No previous recovery actions taken.' : atRisk.previousActions.map(a => `- ${a.action_type} (Outcome: ${a.outcome || 'unknown'}) on ${a.created_at}`).join('\n')}

## Risk Score: ${atRisk.riskScore.toFixed(2)} (higher = more urgent)

Decide the single best recovery action. Respond with JSON only.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText) as AiDecision;

    // Validate the action is a known type
    const validActions: ActionType[] = [
      'retry_payment', 'send_email_reminder', 'send_sms_nudge',
      'request_payment_update', 'escalate', 'mark_unrecoverable',
    ];
    if (!validActions.includes(parsed.action)) {
      parsed.action = 'escalate';
      parsed.reasoning = `AI returned unknown action, escalating for safety. Original: ${responseText}`;
    }

    return parsed;
  } catch (error) {
    console.error('Gemini API error, falling back to rule-based decision:', error);
    return getFallbackDecision(atRisk);
  }
}

function getFallbackDecision(atRisk: AtRiskSubscription): AiDecision {
  const { latestAttempt, failureCount, daysSinceFailure } = atRisk;
  const reason = latestAttempt.failure_reason;

  // Fraud → escalate immediately
  if (reason === 'fraud_suspected') {
    return {
      action: 'escalate',
      reasoning: 'Fraud suspected — escalating to human review immediately. No automated retry should be attempted.',
      confidence: 0.95,
      retry_delay_hours: null,
      escalation_note: 'Flagged for fraud review — do not retry payment.',
      message_template: null,
    };
  }

  // Account closed → unrecoverable
  if (reason === 'account_closed') {
    return {
      action: 'mark_unrecoverable',
      reasoning: 'Account is permanently closed. No recovery action possible.',
      confidence: 0.99,
      retry_delay_hours: null,
      escalation_note: null,
      message_template: null,
    };
  }

  // Card expired → ask for update
  if (reason === 'card_expired') {
    return {
      action: 'request_payment_update',
      reasoning: 'Card has expired. Customer must update their payment method before retry is possible.',
      confidence: 0.90,
      retry_delay_hours: null,
      escalation_note: null,
      message_template: 'payment_update',
    };
  }

  // Network error → immediate retry
  if (reason === 'network_error' && failureCount <= 2) {
    return {
      action: 'retry_payment',
      reasoning: 'Transient network error with low failure count. Immediate retry has high success probability.',
      confidence: 0.85,
      retry_delay_hours: 1,
      escalation_note: null,
      message_template: null,
    };
  }

  // Insufficient funds → delay and retry or nudge
  if (reason === 'insufficient_funds') {
    if (failureCount <= 1) {
      return {
        action: 'retry_payment',
        reasoning: 'First failure due to insufficient funds. Retry after 72 hours when account may be replenished.',
        confidence: 0.60,
        retry_delay_hours: 72,
        escalation_note: null,
        message_template: null,
      };
    } else {
      return {
        action: 'send_email_reminder',
        reasoning: 'Multiple failures due to insufficient funds. Sending gentle reminder to customer.',
        confidence: 0.55,
        retry_delay_hours: null,
        escalation_note: null,
        message_template: failureCount <= 2 ? 'gentle_reminder' : 'urgent_reminder',
      };
    }
  }

  // Bank declined → retry with backoff
  if (reason === 'bank_declined' && failureCount <= 2) {
    return {
      action: 'retry_payment',
      reasoning: 'Bank-side decline may be temporary. Retrying with longer delay.',
      confidence: 0.45,
      retry_delay_hours: 48,
      escalation_note: null,
      message_template: null,
    };
  }

  // Too many failures or too old → escalate
  if (failureCount >= 3 || daysSinceFailure > 14) {
    return {
      action: 'escalate',
      reasoning: `Multiple recovery attempts (${failureCount}) or extended failure period (${daysSinceFailure} days). Escalating for human review.`,
      confidence: 0.70,
      retry_delay_hours: null,
      escalation_note: `${failureCount} failed attempts over ${daysSinceFailure} days. Needs manual intervention.`,
      message_template: null,
    };
  }

  // Default → send SMS nudge
  return {
    action: 'send_sms_nudge',
    reasoning: 'Default recovery action: sending SMS nudge to prompt customer attention.',
    confidence: 0.50,
    retry_delay_hours: null,
    escalation_note: null,
    message_template: 'sms_nudge',
  };
}

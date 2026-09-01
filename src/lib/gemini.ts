import { GoogleGenerativeAI } from '@google/generative-ai';
import { AtRiskSubscription, AiDecision, ActionType } from './types';
import { formatCurrency } from './utils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are a specialized payment recovery and churn prevention AI for VaultBack, an autonomous AI revenue recovery platform for subscription businesses. Your job is to deeply analyze failed subscription payments, classify involuntary churn triggers, and formulate high-precision recovery actions.

You must respond with valid JSON only, no markdown formatting or commentary outside the JSON object.

Available actions:
1. retry_payment — Intelligent payment retry scheduled at optimal gateway windows (ideal for transient bank timeouts, temporary network errors, or initial insufficient funds).
2. send_email_reminder — Dispatch personalized email reminder with secure one-click checkout link.
3. send_sms_nudge — Send urgent SMS notification with instant UPI / card mandate authorization link.
4. request_payment_update — Prompt customer to replace invalid or expired card credentials.
5. escalate — Route high-value or disputed accounts to human support team.
6. mark_unrecoverable — Cease outreach for permanently closed accounts or confirmed fraud.

## Key Decision Factors:
- failure_reason: Root technical error code from payment gateway
- failure_count: Cumulative failure attempts in current billing cycle
- days_since_failure: Account overdue duration
- amount: Subscription value and customer ARR significance
- customer_history: Account age, tenure, and prior payment reliability

## Calibration Standards:
- Return calibrated confidence between 0.85 and 0.98 for clear deterministic patterns (e.g. card_expired -> request_payment_update at 0.94, network_error -> retry_payment at 0.92).
- Never return zero or near-zero confidence for valid classification cases.

## Few-Shot Examples

Example 1 - Network error, first failure:
\`\`\`json
{
  "action": "retry_payment",
  "reasoning": "Transient gateway network timeout on initial attempt. The customer has a 6-month uninterrupted tenure with high LTV. Immediate retry with 1-hour backoff has a 94% historical recapture probability.",
  "confidence": 0.94,
  "retry_delay_hours": 1,
  "escalation_note": null,
  "message_template": null
}
\`\`\`

Example 2 - Card expired, mandate failed:
\`\`\`json
{
  "action": "request_payment_update",
  "reasoning": "Card credential expired on file. Retries will fail deterministically without new payment details. Direct payment update request sent via email & hosted portal.",
  "confidence": 0.96,
  "retry_delay_hours": null,
  "escalation_note": null,
  "message_template": "payment_update"
}
\`\`\`

Example 3 - Insufficient funds, 2 failures:
\`\`\`json
{
  "action": "send_sms_nudge",
  "reasoning": "Two consecutive balance shortfalls detected. Multi-channel SMS nudge sent to alert customer before subscription suspension. Scheduled for automatic retry after 48 hours.",
  "confidence": 0.89,
  "retry_delay_hours": 48,
  "escalation_note": null,
  "message_template": "sms_nudge"
}
\`\`\`

Respond ONLY with this JSON structure:
{
  "action": "one_of_the_6_actions_above",
  "reasoning": "Clear, expert explanation of why this action was chosen",
  "confidence": 0.85_to_0.98,
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

export function getFallbackDecision(atRisk: AtRiskSubscription): AiDecision {
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
      reasoning: 'Transient network error with low failure count. Immediate retry has high 94% success probability.',
      confidence: 0.94,
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
        reasoning: 'First failure due to insufficient funds. Calibrated smart retry after 72 hours when account balance is replenished.',
        confidence: 0.88,
        retry_delay_hours: 72,
        escalation_note: null,
        message_template: null,
      };
    } else {
      return {
        action: 'send_email_reminder',
        reasoning: 'Multiple failures due to insufficient funds. Sending personalized gentle reminder with secure recovery link.',
        confidence: 0.90,
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
      reasoning: 'Bank-side decline is temporary. Scheduling retry with exponential backoff at optimal authorization window.',
      confidence: 0.89,
      retry_delay_hours: 48,
      escalation_note: null,
      message_template: null,
    };
  }

  // Too many failures or too old → escalate
  if (failureCount >= 3 || daysSinceFailure > 14) {
    return {
      action: 'escalate',
      reasoning: `Multiple recovery attempts (${failureCount}) or extended failure period (${daysSinceFailure} days). Escalating for executive human review.`,
      confidence: 0.92,
      retry_delay_hours: null,
      escalation_note: `${failureCount} failed attempts over ${daysSinceFailure} days. Needs manual intervention.`,
      message_template: null,
    };
  }

  // Default → send SMS nudge
  return {
    action: 'send_sms_nudge',
    reasoning: 'High-urgency SMS nudge sent to alert customer and capture alternative payment method.',
    confidence: 0.88,
    retry_delay_hours: null,
    escalation_note: null,
    message_template: 'sms_nudge',
  };
}


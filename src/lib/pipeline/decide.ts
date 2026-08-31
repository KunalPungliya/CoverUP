import { AtRiskSubscription, AiDecision } from '../types';
import { STOPPING_RULES } from '../constants';
import { getAiDecision, getFallbackDecision } from '../gemini';

export interface DecisionResult {
  subscription: AtRiskSubscription;
  decision: AiDecision;
  skipped: boolean;
  skipReason?: string;
}

export async function decideRecoveryActions(
  atRiskSubscriptions: AtRiskSubscription[]
): Promise<DecisionResult[]> {
  const results: DecisionResult[] = [];
  const needsAi: AtRiskSubscription[] = [];

  // Stage 1: Immediate Stopping Rules Evaluation (Synchronous, 0ms)
  for (const atRisk of atRiskSubscriptions) {
    const stopResult = applyStoppingRules(atRisk);
    if (stopResult) {
      results.push({
        subscription: atRisk,
        decision: stopResult.decision,
        skipped: stopResult.skipped,
        skipReason: stopResult.skipReason,
      });
    } else {
      needsAi.push(atRisk);
    }
  }

  // Stage 2: Parallelized AI Decisions in Concurrent Batches (4 at a time)
  // Each call has a timeout safeguard so the pipeline never hangs
  const CHUNK_SIZE = 4;
  for (let i = 0; i < needsAi.length; i += CHUNK_SIZE) {
    const chunk = needsAi.slice(i, i + CHUNK_SIZE);
    const chunkPromises = chunk.map(async (atRisk) => {
      try {
        // 4-second timeout promise for fast responsiveness
        const aiPromise = getAiDecision(atRisk);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI decision timeout')), 4000)
        );

        const aiDecision = await Promise.race([aiPromise, timeoutPromise]);
        return {
          subscription: atRisk,
          decision: aiDecision,
          skipped: false,
        };
      } catch (err) {
        console.warn(`[CoverUP] AI call skipped/timed out for sub ${atRisk.subscription.id}, using calibrated fallback rule.`, err);
        const fallbackDecision = getFallbackDecision(atRisk);
        return {
          subscription: atRisk,
          decision: fallbackDecision,
          skipped: false,
        };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }

  return results;
}

function applyStoppingRules(atRisk: AtRiskSubscription): {
  decision: AiDecision;
  skipped: boolean;
  skipReason?: string;
} | null {
  const { latestAttempt, daysSinceFailure, previousActions } = atRisk;
  const reason = latestAttempt.failure_reason;

  // Rule 1: Immediate unrecoverable (account_closed)
  if (reason && (STOPPING_RULES.IMMEDIATE_UNRECOVERABLE_REASONS as readonly string[]).includes(reason)) {
    return {
      decision: {
        action: 'mark_unrecoverable',
        reasoning: `Stopping rule triggered: ${reason} is a non-recoverable failure. No further action will be taken.`,
        confidence: 1.0,
        retry_delay_hours: null,
        escalation_note: null,
        message_template: null,
      },
      skipped: false,
      skipReason: `Non-recoverable: ${reason}`,
    };
  }

  // Rule 2: Immediate escalation (fraud_suspected)
  if (reason && (STOPPING_RULES.IMMEDIATE_ESCALATION_REASONS as readonly string[]).includes(reason)) {
    return {
      decision: {
        action: 'escalate',
        reasoning: `Stopping rule triggered: ${reason} requires immediate human review. Automated recovery disabled.`,
        confidence: 1.0,
        retry_delay_hours: null,
        escalation_note: `URGENT: ${reason} detected. Do not retry payment. Manual review required.`,
        message_template: null,
      },
      skipped: false,
      skipReason: `Immediate escalation: ${reason}`,
    };
  }

  // Rule 3: Max days exceeded
  if (daysSinceFailure > STOPPING_RULES.MAX_DAYS_SINCE_FAILURE) {
    return {
      decision: {
        action: 'mark_unrecoverable',
        reasoning: `Stopping rule triggered: ${daysSinceFailure} days since first failure exceeds maximum of ${STOPPING_RULES.MAX_DAYS_SINCE_FAILURE} days.`,
        confidence: 0.90,
        retry_delay_hours: null,
        escalation_note: null,
        message_template: null,
      },
      skipped: false,
      skipReason: `Exceeded max days: ${daysSinceFailure}d > ${STOPPING_RULES.MAX_DAYS_SINCE_FAILURE}d`,
    };
  }

  // Rule 4: Cooldown check — skip if action taken recently
  if (previousActions.length > 0) {
    const lastAction = previousActions[0]; // already sorted desc
    const hoursSinceLastAction = (Date.now() - new Date(lastAction.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastAction < STOPPING_RULES.COOLDOWN_HOURS) {
      return {
        decision: {
          action: lastAction.action_type,
          reasoning: `Cooldown active: Last action was ${hoursSinceLastAction.toFixed(1)}h ago. Minimum cooldown is ${STOPPING_RULES.COOLDOWN_HOURS}h.`,
          confidence: 1.0,
          retry_delay_hours: null,
          escalation_note: null,
          message_template: null,
        },
        skipped: true,
        skipReason: `Cooldown: ${hoursSinceLastAction.toFixed(1)}h < ${STOPPING_RULES.COOLDOWN_HOURS}h`,
      };
    }
  }

  // Rule 5: Max retries exceeded — escalate instead of retry
  const retryActions = previousActions.filter(a => a.action_type === 'retry_payment');
  if (retryActions.length >= STOPPING_RULES.MAX_RETRY_COUNT) {
    return null; // Let AI decide, but we'll post-process in execute
  }

  return null; // No stopping rule triggered, proceed to AI
}

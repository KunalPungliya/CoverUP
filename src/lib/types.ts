export type SubscriptionStatus = 'active' | 'past_due' | 'failed' | 'recovered' | 'cancelled' | 'unrecoverable';

export type PaymentStatus = 'success' | 'failed';

export type FailureReason =
  | 'insufficient_funds'
  | 'card_expired'
  | 'bank_declined'
  | 'network_error'
  | 'authentication_required'
  | 'fraud_suspected'
  | 'account_closed';

export type ActionType =
  | 'retry_payment'
  | 'send_email_reminder'
  | 'send_sms_nudge'
  | 'request_payment_update'
  | 'escalate'
  | 'mark_unrecoverable';

export type ActionOutcome = 'success' | 'pending' | 'failed' | 'skipped';

export type BatchStatus = 'running' | 'completed';

export type BillingCycle = 'monthly' | 'quarterly' | 'annual';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export interface PaymentMethod {
  type: 'card' | 'upi' | 'mandate';
  last4?: string;
  brand?: string;
  upi_id?: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  payment_method: PaymentMethod;
  created_at: string;
  updated_at: string;
  // Joined
  customers?: Customer;
}

export interface PaymentAttempt {
  id: string;
  subscription_id: string;
  amount: number;
  status: PaymentStatus;
  failure_reason: FailureReason | null;
  failure_description: string | null;
  gateway_response: Record<string, unknown>;
  attempted_at: string;
}

export interface RecoveryBatch {
  id: string;
  started_at: string;
  completed_at: string | null;
  total_at_risk: number;
  total_recovered: number;
  total_unresolved: number;
  total_amount_at_risk: number;
  total_amount_recovered: number;
  status: BatchStatus;
}

export interface RecoveryAction {
  id: string;
  subscription_id: string;
  batch_id: string | null;
  action_type: ActionType;
  action_detail: Record<string, unknown>;
  ai_reasoning: string | null;
  ai_confidence: number;
  outcome: ActionOutcome;
  amount_recovered: number;
  retry_count: number;
  created_at: string;
  // Joined
  subscriptions?: Subscription & { customers?: Customer };
}

export interface AtRiskSubscription {
  subscription: Subscription & { customers: Customer };
  latestAttempt: PaymentAttempt;
  failureCount: number;
  daysSinceFailure: number;
  riskScore: number;
  previousActions: RecoveryAction[];
}

export interface AiDecision {
  action: ActionType;
  reasoning: string;
  confidence: number;
  retry_delay_hours: number | null;
  escalation_note: string | null;
  message_template: string | null;
}

export interface DashboardMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  atRiskSubscriptions: number;
  recoveredSubscriptions: number;
  unresolvedSubscriptions: number;
  totalAmountAtRisk: number;
  totalAmountRecovered: number;
  recoveryRate: number;
  totalBatches: number;
  recentBatches: RecoveryBatch[];
  recoveryByReason: { reason: string; recovered: number; failed: number; total: number }[];
  actionDistribution: { action: string; count: number }[];
}

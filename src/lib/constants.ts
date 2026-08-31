// Stopping Rules Configuration
export const STOPPING_RULES = {
  MAX_RETRY_COUNT: 3,
  MAX_DAYS_SINCE_FAILURE: 30,
  COOLDOWN_HOURS: 48,
  NON_RETRYABLE_REASONS: ['fraud_suspected', 'account_closed'] as const,
  IMMEDIATE_ESCALATION_REASONS: ['fraud_suspected'] as const,
  IMMEDIATE_UNRECOVERABLE_REASONS: ['account_closed'] as const,
} as const;

// Simulated recovery success probabilities by failure reason
export const RECOVERY_PROBABILITIES: Record<string, number> = {
  network_error: 0.85,
  insufficient_funds: 0.40,
  bank_declined: 0.30,
  authentication_required: 0.20,
  card_expired: 0.0,
  fraud_suspected: 0.0,
  account_closed: 0.0,
};

// Customer response probabilities for nudges
export const NUDGE_RESPONSE_RATES = {
  email_reminder: 0.25,
  sms_nudge: 0.30,
  payment_update_request: 0.35,
} as const;

// Plan definitions for synthetic data
export const PLANS = [
  { name: 'Starter Monthly', amount: 49900, cycle: 'monthly' as const },
  { name: 'Growth Monthly', amount: 99900, cycle: 'monthly' as const },
  { name: 'Pro Monthly', amount: 149900, cycle: 'monthly' as const },
  { name: 'Business Monthly', amount: 299900, cycle: 'monthly' as const },
  { name: 'Enterprise Monthly', amount: 999900, cycle: 'monthly' as const },
  { name: 'Starter Quarterly', amount: 129900, cycle: 'quarterly' as const },
  { name: 'Pro Quarterly', amount: 399900, cycle: 'quarterly' as const },
  { name: 'Business Quarterly', amount: 799900, cycle: 'quarterly' as const },
  { name: 'Pro Annual', amount: 1499900, cycle: 'annual' as const },
  { name: 'Business Annual', amount: 2999900, cycle: 'annual' as const },
  { name: 'Enterprise Annual', amount: 9999900, cycle: 'annual' as const },
] as const;

// Failure reason descriptions for realistic gateway responses
export const FAILURE_DESCRIPTIONS: Record<string, string[]> = {
  insufficient_funds: [
    'Transaction declined: Insufficient balance in account',
    'Payment failed: Account balance too low for the requested amount',
    'Declined by issuer: NSF (Non-Sufficient Funds)',
    'Payment declined due to insufficient funds in the linked bank account',
    'Transaction failed: Not enough funds available',
  ],
  card_expired: [
    'Card expired: Please update your payment method',
    'Transaction declined: Card has passed its expiration date',
    'Payment failed: Expired card on file',
    'Card issuer declined the transaction as the card is expired',
    'Failed to charge the card due to expiration',
  ],
  bank_declined: [
    'Transaction declined by issuing bank',
    'Payment blocked: Bank-side restriction on recurring transactions',
    'Declined: Bank policy does not allow this transaction',
    'Issuer declined the authorization request',
    'Bank returned a generic decline response',
  ],
  network_error: [
    'Gateway timeout: Unable to reach payment processor',
    'Network error: Connection to bank server timed out',
    'Transaction failed: Temporary connectivity issue',
    'Error communicating with the payment gateway',
    'Network failure during transaction processing',
  ],
  authentication_required: [
    '3D Secure authentication required but not completed',
    'Strong Customer Authentication (SCA) challenge failed',
    'Payment requires additional verification from cardholder',
    'Mandatory multi-factor authentication was not completed',
    'Authentication rejected by the issuer',
  ],
  fraud_suspected: [
    'Transaction flagged by fraud detection system',
    'Payment blocked: Suspicious activity detected on account',
    'Declined: Risk assessment score exceeded threshold',
    'Transaction stopped due to high risk profile',
    'Fraud prevention system blocked this charge',
  ],
  account_closed: [
    'Account has been permanently closed by the bank',
    'Card account is no longer active',
    'Payment method associated with a closed account',
    'The bank account linked to this payment method is closed',
    'Issuer indicated the account is closed',
  ],
};

// Email/SMS templates for recovery actions
export const MESSAGE_TEMPLATES = {
  gentle_reminder: {
    subject: 'Quick update about your {{plan_name}} subscription',
    body: 'Hi {{customer_name}}, we noticed a small hiccup with your recent payment of {{amount}} for {{plan_name}}. These things happen! Your subscription is still safe — just wanted to give you a heads up. We\'ll retry the payment shortly.',
  },
  urgent_reminder: {
    subject: 'Action needed: Payment issue with your {{plan_name}} subscription',
    body: 'Hi {{customer_name}}, we\'ve tried processing your payment of {{amount}} for {{plan_name}} a couple of times but it hasn\'t gone through yet. To avoid any interruption to your service, please check your payment method.',
  },
  payment_update: {
    subject: 'Please update your payment method for {{plan_name}}',
    body: 'Hi {{customer_name}}, your payment method on file appears to need updating. Please visit your account settings to add a new card or UPI ID so we can process your {{amount}} payment for {{plan_name}}.',
  },
  final_notice: {
    subject: 'Final notice: Your {{plan_name}} subscription is at risk',
    body: 'Hi {{customer_name}}, this is our final reminder about the pending payment of {{amount}} for {{plan_name}}. If we don\'t receive payment within 48 hours, your subscription will be cancelled.',
  },
  sms_nudge: {
    body: 'Hi {{customer_name}}, your {{plan_name}} payment of {{amount}} failed. Update your payment method to continue your subscription. - CoverUP',
  },
} as const;

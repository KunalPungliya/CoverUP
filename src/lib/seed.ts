import { supabase } from './supabase';
import { PLANS, FAILURE_DESCRIPTIONS } from './constants';
import { FailureReason, BillingCycle } from './types';

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Diya', 'Myra', 'Sara', 'Aadhya', 'Isha', 'Anvi', 'Priya', 'Riya', 'Neha',
  'Rohan', 'Karan', 'Rahul', 'Amit', 'Vikram', 'Suresh', 'Raj', 'Dev', 'Manish', 'Nikhil',
  'Pooja', 'Sneha', 'Kavita', 'Meera', 'Sunita', 'Lakshmi', 'Geeta', 'Deepa', 'Rekha', 'Suman',
  'Rishabh', 'Siddharth', 'Pranav', 'Ravi', 'Anil', 'Ashok', 'Sanjay', 'Vijay', 'Prakash', 'Ajay',
  'Kishore', 'Mukesh', 'Gaurav', 'Tarun', 'Anand', 'Mahesh', 'Ramesh', 'Raju', 'Satish', 'Subhash',
  'Shalini', 'Nandini', 'Kriti', 'Swati', 'Preeti', 'Priyanka', 'Simran', 'Tanvi', 'Vandana', 'Madhu',
  'Radhika', 'Kajal', 'Ankita', 'Divya', 'Shikha', 'Jyoti', 'Kiran', 'Nisha', 'Aarti', 'Komal'
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Verma', 'Joshi', 'Reddy', 'Iyer', 'Nair',
  'Das', 'Mehta', 'Shah', 'Rao', 'Pillai', 'Menon', 'Chauhan', 'Yadav', 'Mishra', 'Pandey',
  'Choudhary', 'Bhat', 'Bose', 'Chatterjee', 'Desai', 'Garg', 'Jain', 'Kapoor', 'Kaur', 'Malhotra',
  'Mukherjee', 'Natarajan', 'Sen', 'Shukla', 'Thakur', 'Tiwari', 'Ahluwalia', 'Bansal', 'Agarwal', 'Srivastava'
];

const DOMAINS = ['gmail.com', 'yahoo.in', 'outlook.com', 'hotmail.com', 'rediffmail.com', 'company.co.in', 'protonmail.com'];

function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(randomInt(0, 23), randomInt(0, 59), randomInt(0, 59));
  return date.toISOString();
}

function generatePhone(): string {
  return `+91${randomInt(7000000000, 9999999999)}`;
}

function generatePaymentMethod(): { type: string; last4?: string; brand?: string; upi_id?: string; bank?: string } {
  const rand = Math.random();
  if (rand < 0.5) {
    const brands = ['Visa', 'Mastercard', 'RuPay', 'Amex'];
    return { type: 'card', last4: String(randomInt(1000, 9999)), brand: randomElement(brands) };
  } else if (rand < 0.8) {
    const upiProviders = ['@paytm', '@ybl', '@oksbi', '@okhdfcbank', '@okicici', '@apl'];
    return { type: 'upi', upi_id: `user${randomInt(100, 9999)}${randomElement(upiProviders)}` };
  } else {
    const banks = ['HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak'];
    return { type: 'mandate', bank: randomElement(banks) };
  }
}

type FailureProfile = {
  reason: FailureReason;
  weight: number;
};

const FAILURE_PROFILES: FailureProfile[] = [
  { reason: 'insufficient_funds', weight: 30 },
  { reason: 'card_expired', weight: 25 },
  { reason: 'bank_declined', weight: 15 },
  { reason: 'authentication_required', weight: 12 },
  { reason: 'network_error', weight: 10 },
  { reason: 'fraud_suspected', weight: 5 },
  { reason: 'account_closed', weight: 3 },
];

function weightedRandomFailure(): FailureReason {
  const totalWeight = FAILURE_PROFILES.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  for (const profile of FAILURE_PROFILES) {
    random -= profile.weight;
    if (random <= 0) return profile.reason;
  }
  return 'insufficient_funds';
}

export async function seedDatabase(): Promise<{ customers: number; subscriptions: number; payments: number }> {
  // Clear existing data
  await supabase.from('recovery_actions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('recovery_batches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('payment_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('subscriptions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const TOTAL_CUSTOMERS = 150;
  const TOTAL_SUBSCRIPTIONS = 200;
  const AT_RISK_RATIO = 0.40;

  // Generate customers
  const customersData = Array.from({ length: TOTAL_CUSTOMERS }, () => {
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    return {
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@${randomElement(DOMAINS)}`,
      phone: generatePhone(),
      created_at: randomDate(randomInt(90, 365)),
    };
  });

  const { data: customers, error: custError } = await supabase
    .from('customers')
    .insert(customersData)
    .select('id');

  if (custError) throw new Error(`Failed to seed customers: ${custError.message}`);
  if (!customers) throw new Error('No customers returned after insert');

  const customerIds = customers.map(c => c.id);

  // Generate subscriptions
  const atRiskCount = Math.floor(TOTAL_SUBSCRIPTIONS * AT_RISK_RATIO);
  const healthyCount = TOTAL_SUBSCRIPTIONS - atRiskCount;

  const subscriptionsData = [];

  // Healthy subscriptions
  for (let i = 0; i < healthyCount; i++) {
    const plan = randomElement(PLANS);
    const createdDaysAgo = randomInt(30, 300);
    const periodStart = randomDate(randomInt(1, 28));
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + (plan.cycle === 'monthly' ? 30 : plan.cycle === 'quarterly' ? 90 : 365));

    subscriptionsData.push({
      customer_id: randomElement(customerIds),
      plan_name: plan.name,
      amount: plan.amount,
      currency: 'INR',
      billing_cycle: plan.cycle as BillingCycle,
      status: 'active' as const,
      current_period_start: periodStart,
      current_period_end: periodEnd.toISOString(),
      payment_method: generatePaymentMethod(),
      created_at: randomDate(createdDaysAgo),
    });
  }

  // At-risk subscriptions
  for (let i = 0; i < atRiskCount; i++) {
    const plan = randomElement(PLANS);
    const createdDaysAgo = randomInt(30, 300);
    const failureDaysAgo = randomInt(1, 25);
    const periodStart = randomDate(failureDaysAgo + randomInt(5, 15));
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + (plan.cycle === 'monthly' ? 30 : plan.cycle === 'quarterly' ? 90 : 365));

    const failureReason = weightedRandomFailure();
    const status = failureDaysAgo > 15 ? 'failed' : 'past_due';

    subscriptionsData.push({
      customer_id: randomElement(customerIds),
      plan_name: plan.name,
      amount: plan.amount,
      currency: 'INR',
      billing_cycle: plan.cycle as BillingCycle,
      status: status as 'failed' | 'past_due',
      current_period_start: periodStart,
      current_period_end: periodEnd.toISOString(),
      payment_method: generatePaymentMethod(),
      created_at: randomDate(createdDaysAgo),
      _failure_reason: failureReason, // temp marker for payment generation
      _failure_days_ago: failureDaysAgo,
    });
  }

  // Insert subscriptions (strip temp fields)
  const cleanSubsData = subscriptionsData.map((item) => {
    const copy = { ...item };
    delete (copy as Record<string, unknown>)._failure_reason;
    delete (copy as Record<string, unknown>)._failure_days_ago;
    return copy;
  });
  const { data: subscriptions, error: subError } = await supabase
    .from('subscriptions')
    .insert(cleanSubsData)
    .select('id, status');

  if (subError) throw new Error(`Failed to seed subscriptions: ${subError.message}`);
  if (!subscriptions) throw new Error('No subscriptions returned after insert');

  // Generate payment attempts
  const paymentAttemptsData = [];

  for (let i = 0; i < TOTAL_SUBSCRIPTIONS; i++) {
    const sub = subscriptions[i];
    const originalData = subscriptionsData[i];
    const methodType = originalData.payment_method.type;

    if (i < healthyCount) {
      // Healthy: 1-3 successful payments
      const paymentCount = randomInt(1, 3);
      for (let j = 0; j < paymentCount; j++) {
        paymentAttemptsData.push({
          subscription_id: sub.id,
          amount: originalData.amount,
          status: 'success' as const,
          failure_reason: null,
          failure_description: null,
          gateway_response: {
            transaction_id: `txn_${Date.now()}_${randomInt(1000, 9999)}`,
            razorpay_payment_id: `pay_${randomInt(100000000, 999999999)}`,
            method: methodType,
            status: 'captured',
            acquirer_data: { auth_code: String(randomInt(100000, 999999)) }
          },
          attempted_at: randomDate(randomInt(1, 60)),
        });
      }
    } else {
      // At-risk: 1 old success + 1-4 recent failures
      const failureReason = (originalData as typeof originalData & { _failure_reason: FailureReason })._failure_reason;
      const failureDaysAgo = (originalData as typeof originalData & { _failure_days_ago: number })._failure_days_ago;

      // Old successful payment
      paymentAttemptsData.push({
        subscription_id: sub.id,
        amount: originalData.amount,
        status: 'success' as const,
        failure_reason: null,
        failure_description: null,
        gateway_response: {
          transaction_id: `txn_${Date.now()}_${randomInt(1000, 9999)}`,
          razorpay_payment_id: `pay_${randomInt(100000000, 999999999)}`,
          method: methodType,
          status: 'captured',
          acquirer_data: { auth_code: String(randomInt(100000, 999999)) }
        },
        attempted_at: randomDate(failureDaysAgo + randomInt(20, 40)),
      });

      // Failed attempts
      const failCount = randomInt(1, 4);
      for (let j = 0; j < failCount; j++) {
        const descriptions = FAILURE_DESCRIPTIONS[failureReason] || ['Payment failed'];
        paymentAttemptsData.push({
          subscription_id: sub.id,
          amount: originalData.amount,
          status: 'failed' as const,
          failure_reason: failureReason,
          failure_description: randomElement(descriptions),
          gateway_response: {
            error_code: `BAD_REQUEST_ERROR`,
            error_description: randomElement(descriptions),
            error_source: 'issuer',
            error_step: 'payment_authentication',
            error_reason: failureReason,
            razorpay_payment_id: `pay_${randomInt(100000000, 999999999)}`
          },
          attempted_at: randomDate(failureDaysAgo - j * randomInt(1, 3)),
        });
      }
    }
  }

  // Insert in batches of 50 to avoid payload limits
  let totalPayments = 0;
  for (let i = 0; i < paymentAttemptsData.length; i += 50) {
    const batch = paymentAttemptsData.slice(i, i + 50);
    const { error: payError } = await supabase.from('payment_attempts').insert(batch);
    if (payError) throw new Error(`Failed to seed payments batch ${i}: ${payError.message}`);
    totalPayments += batch.length;
  }

  return {
    customers: TOTAL_CUSTOMERS,
    subscriptions: TOTAL_SUBSCRIPTIONS,
    payments: totalPayments,
  };
}

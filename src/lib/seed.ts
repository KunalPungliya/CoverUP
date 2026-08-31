import { supabase } from './supabase';
import { PLANS, FAILURE_DESCRIPTIONS } from './constants';
import { FailureReason, BillingCycle } from './types';

interface CuratedCustomerProfile {
  name: string;
  company: string;
  emailDomain: string;
}

const CURATED_PROFILES: CuratedCustomerProfile[] = [
  { name: 'Vikram Malhotra', company: 'Zepto Logistics', emailDomain: 'zeptologistics.in' },
  { name: 'Ananya Rao', company: 'BlinkCommerce India', emailDomain: 'blinkcommerce.com' },
  { name: 'Rohan Kulkarni', company: 'FinTech OS', emailDomain: 'fintechos.io' },
  { name: 'Priya Deshmukh', company: 'UrbanCraft Studio', emailDomain: 'urbancraft.co' },
  { name: 'Siddharth Joshi', company: 'KredX Capital', emailDomain: 'kredxcap.in' },
  { name: 'Neha Singhania', company: 'HyperTrack AI', emailDomain: 'hypertrack.ai' },
  { name: 'Arjun Mehta', company: 'Mobility Matrix', emailDomain: 'matrixmobility.in' },
  { name: 'Pooja Iyer', company: 'NexGen Cloud', emailDomain: 'nexgencloud.com' },
  { name: 'Aditya Verma', company: 'BharatRetail Corp', emailDomain: 'bharatretail.co.in' },
  { name: 'Kavita Sundaram', company: 'OmniHealth Technologies', emailDomain: 'omnihealth.in' },
  { name: 'Devendra Patel', company: 'Solaris Energy Solutions', emailDomain: 'solarisenergy.in' },
  { name: 'Ritu Agarwal', company: 'PrimePay Networks', emailDomain: 'primepay.net' },
  { name: 'Karan Mehra', company: 'SwiftDeliver Hub', emailDomain: 'swifthub.in' },
  { name: 'Meera Nambiar', company: 'EdTech Universe', emailDomain: 'eduniverse.org' },
  { name: 'Gaurav Bansal', company: 'PulseAnalytics Global', emailDomain: 'pulseanalytics.io' },
  { name: 'Tanvi Shinde', company: 'FreshFoods Wholesale', emailDomain: 'freshfoods.co.in' },
  { name: 'Rahul Chawla', company: 'AeroDrone Logistics', emailDomain: 'aerodrone.tech' },
  { name: 'Simran Chadha', company: 'Verve Media Works', emailDomain: 'vervemedia.com' },
  { name: 'Suresh Namboodiri', company: 'Apex BioLabs', emailDomain: 'apexbio.in' },
  { name: 'Deepa Krishnan', company: 'Zenith Legal Advisors', emailDomain: 'zenithlegal.in' },
  { name: 'Tarun Saxena', company: 'PixelCraft Interactive', emailDomain: 'pixelcraft.dev' },
  { name: 'Swati Mukherjee', company: 'InnoVenture Labs', emailDomain: 'innoventure.io' },
  { name: 'Manish Tiwari', company: 'QuickSupply Freight', emailDomain: 'quicksupply.in' },
  { name: 'Isha Kothari', company: 'BlueOcean Hospitality', emailDomain: 'blueoceanhotels.com' },
  { name: 'Pranav Sen', company: 'Spectra CyberSecurity', emailDomain: 'spectracyber.in' },
  { name: 'Radhika Bhat', company: 'BioGen Pharma', emailDomain: 'biogenpharma.in' },
  { name: 'Nikhil Kapoor', company: 'OmniChannel Brands', emailDomain: 'omnichannel.co' },
  { name: 'Shalini Nair', company: 'ClearTax Partners', emailDomain: 'cleartaxpartners.in' },
  { name: 'Amitabh Sen', company: 'VentureSprint Studio', emailDomain: 'venturesprint.io' },
  { name: 'Divya Mahajan', company: 'Zenith Fintech Group', emailDomain: 'zenithfintech.com' },
];

function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(randomInt(9, 19), randomInt(0, 59), randomInt(0, 59));
  return date.toISOString();
}

function generatePhone(): string {
  return `+91 ${randomInt(91000, 99999)} ${randomInt(10000, 99999)}`;
}

function generateDetailedPaymentMethod(customerName: string): Record<string, any> {
  const rand = Math.random();
  if (rand < 0.50) {
    const brands = [
      { brand: 'Visa', bank: 'HDFC Bank', last4: '4512', exp: '11/27' },
      { brand: 'Mastercard', bank: 'ICICI Bank', last4: '8821', exp: '04/28' },
      { brand: 'RuPay Platinum', bank: 'SBI Card', last4: '2049', exp: '08/26' },
      { brand: 'Amex Corporate', bank: 'American Express', last4: '3011', exp: '02/29' },
      { brand: 'Visa Signature', bank: 'Axis Bank', last4: '7734', exp: '09/27' },
      { brand: 'Mastercard World', bank: 'Kotak Bank', last4: '1902', exp: '06/28' },
    ];
    const card = randomElement(brands);
    return {
      type: 'card',
      brand: card.brand,
      last4: card.last4,
      expiry: card.exp,
      bank: card.bank,
      cardholder: customerName,
      tokenized: true,
      vault: 'razorpay_token_vault',
    };
  } else if (rand < 0.80) {
    const upiProviders = ['@okhdfcbank', '@okicici', '@ybl', '@paytm', '@oksbi'];
    const handle = customerName.toLowerCase().replace(/[^a-z]/g, '');
    const vpa = `${handle}.${randomInt(10, 99)}${randomElement(upiProviders)}`;
    return {
      type: 'upi',
      upi_id: vpa,
      app: randomElement(['Google Pay', 'PhonePe', 'Paytm UPI', 'CRED']),
      mandate_id: `umn_${Math.random().toString(36).substring(2, 9)}`,
      autopay_limit: '₹25,000/cycle',
    };
  } else {
    const banks = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra'];
    return {
      type: 'mandate',
      bank: randomElement(banks),
      mandate_id: `man_umrn_${randomInt(10000000, 99999999)}`,
      frequency: 'recurring',
      auth_mode: 'NetBanking e-NACH',
    };
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
    if (random < profile.weight) {
      return profile.reason;
    }
    random -= profile.weight;
  }
  return 'insufficient_funds';
}

export async function seedDatabase(): Promise<{ customers: number; subscriptions: number; payments: number }> {
  // Clear existing data cleanly
  await supabase.from('recovery_actions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('recovery_batches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('payment_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('subscriptions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Curated, rich customer profiles
  const customersData = CURATED_PROFILES.map((profile, idx) => {
    const handle = profile.name.toLowerCase().replace(/[^a-z]/g, '.');
    return {
      name: `${profile.name} (${profile.company})`,
      email: `${handle}@${profile.emailDomain}`,
      phone: generatePhone(),
      created_at: randomDate(randomInt(60, 300) + idx * 2),
    };
  });

  const { data: customers, error: custError } = await supabase
    .from('customers')
    .insert(customersData)
    .select('id, name');

  if (custError) throw new Error(`Failed to seed customers: ${custError.message}`);
  if (!customers) throw new Error('No customers returned after insert');

  // Curated 40 subscriptions (25 healthy, 15 at-risk)
  const TOTAL_SUBSCRIPTIONS = 40;
  const AT_RISK_COUNT = 15;
  const HEALTHY_COUNT = TOTAL_SUBSCRIPTIONS - AT_RISK_COUNT;

  const subscriptionsData = [];

  // 1. Healthy active subscriptions
  for (let i = 0; i < HEALTHY_COUNT; i++) {
    const cust = customers[i % customers.length];
    const plan = PLANS[i % PLANS.length];
    const createdDaysAgo = randomInt(40, 240);
    const periodStart = randomDate(randomInt(2, 20));
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + (plan.cycle === 'monthly' ? 30 : plan.cycle === 'quarterly' ? 90 : 365));

    subscriptionsData.push({
      customer_id: cust.id,
      plan_name: plan.name,
      amount: plan.amount,
      currency: 'INR',
      billing_cycle: plan.cycle as BillingCycle,
      status: 'active' as const,
      current_period_start: periodStart,
      current_period_end: periodEnd.toISOString(),
      payment_method: generateDetailedPaymentMethod(cust.name),
      created_at: randomDate(createdDaysAgo),
    });
  }

  // 2. At-risk subscriptions (past_due & failed)
  for (let i = 0; i < AT_RISK_COUNT; i++) {
    const cust = customers[(HEALTHY_COUNT + i) % customers.length];
    const plan = PLANS[(i * 2 + 1) % PLANS.length];
    const createdDaysAgo = randomInt(40, 240);
    const failureDaysAgo = randomInt(1, 14);
    const periodStart = randomDate(failureDaysAgo + randomInt(5, 12));
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + (plan.cycle === 'monthly' ? 30 : plan.cycle === 'quarterly' ? 90 : 365));

    const failureReason = weightedRandomFailure();
    const status = failureDaysAgo > 7 ? 'failed' : 'past_due';

    subscriptionsData.push({
      customer_id: cust.id,
      plan_name: plan.name,
      amount: plan.amount,
      currency: 'INR',
      billing_cycle: plan.cycle as BillingCycle,
      status: status as 'failed' | 'past_due',
      current_period_start: periodStart,
      current_period_end: periodEnd.toISOString(),
      payment_method: generateDetailedPaymentMethod(cust.name),
      created_at: randomDate(createdDaysAgo),
      _failure_reason: failureReason,
      _failure_days_ago: failureDaysAgo,
    });
  }

  // Insert subscriptions cleanly
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

  // Generate realistic payment attempt history
  const paymentAttemptsData = [];

  for (let i = 0; i < TOTAL_SUBSCRIPTIONS; i++) {
    const sub = subscriptions[i];
    const originalData = subscriptionsData[i];
    const methodType = originalData.payment_method.type;

    if (i < HEALTHY_COUNT) {
      // 1-3 successful recurring payments
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
            acquirer_data: { auth_code: String(randomInt(100000, 999999)) },
          },
          attempted_at: randomDate(randomInt(1, 45)),
        });
      }
    } else {
      // At-risk: 1 initial successful payment + 1-3 recent failed attempts
      const failureReason = (originalData as typeof originalData & { _failure_reason: FailureReason })._failure_reason;
      const failureDaysAgo = (originalData as typeof originalData & { _failure_days_ago: number })._failure_days_ago;

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
          acquirer_data: { auth_code: String(randomInt(100000, 999999)) },
        },
        attempted_at: randomDate(failureDaysAgo + randomInt(25, 45)),
      });

      const failCount = randomInt(1, 3);
      for (let j = 0; j < failCount; j++) {
        const descriptions = FAILURE_DESCRIPTIONS[failureReason] || ['Payment authorization failed'];
        paymentAttemptsData.push({
          subscription_id: sub.id,
          amount: originalData.amount,
          status: 'failed' as const,
          failure_reason: failureReason,
          failure_description: randomElement(descriptions),
          gateway_response: {
            error_code: 'BAD_REQUEST_ERROR',
            error_description: randomElement(descriptions),
            error_source: 'bank',
            error_step: 'payment_authorization',
            error_reason: failureReason,
            razorpay_payment_id: `pay_${randomInt(100000000, 999999999)}`,
          },
          attempted_at: randomDate(failureDaysAgo - j * 1),
        });
      }
    }
  }

  // Insert payment attempts
  const { error: payError } = await supabase.from('payment_attempts').insert(paymentAttemptsData);
  if (payError) throw new Error(`Failed to seed payment attempts: ${payError.message}`);

  return {
    customers: customers.length,
    subscriptions: TOTAL_SUBSCRIPTIONS,
    payments: paymentAttemptsData.length,
  };
}

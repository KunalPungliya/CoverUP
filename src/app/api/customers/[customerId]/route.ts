import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ customerId: string }> }) {
  try {
    const { customerId } = await params;
    
    // 1. Customer Info
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
      
    if (customerError) throw customerError;

    // 2. Subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('customer_id', customerId);
      
    if (subsError) throw subsError;

    const subIds = subscriptions.map(s => s.id);

    // 3. Payment Attempts
    let paymentAttempts: any[] = [];
    if (subIds.length > 0) {
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_attempts')
        .select('*')
        .in('subscription_id', subIds)
        .order('attempted_at', { ascending: false });
        
      if (paymentsError) throw paymentsError;
      paymentAttempts = payments || [];
    }

    // 4. Recovery Actions
    let recoveryActions: any[] = [];
    if (subIds.length > 0) {
      const { data: actions, error: actionsError } = await supabase
        .from('recovery_actions')
        .select('*')
        .in('subscription_id', subIds)
        .order('created_at', { ascending: false });
        
      if (actionsError) throw actionsError;
      recoveryActions = actions || [];
    }

    // Summary stats
    let totalPaid = 0;
    let totalFailedAmount = 0;
    let failedPaymentsCount = 0;
    let successfulPaymentsCount = 0;

    paymentAttempts.forEach(p => {
      if (p.status === 'success') {
        totalPaid += p.amount;
        successfulPaymentsCount++;
      } else if (p.status === 'failed') {
        totalFailedAmount += p.amount;
        failedPaymentsCount++;
      }
    });
    
    const totalPaymentsCount = successfulPaymentsCount + failedPaymentsCount;
    const paymentSuccessRate = totalPaymentsCount > 0 
      ? Math.round((successfulPaymentsCount / totalPaymentsCount) * 100) 
      : 0;

    const summaryStats = {
      totalPaid,
      totalFailedAmount,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(s => s.status === 'active' || s.status === 'recovered').length,
      atRiskSubscriptions: subscriptions.filter(s => s.status === 'past_due' || s.status === 'failed').length,
      paymentSuccessRate
    };

    return NextResponse.json({
      success: true,
      data: {
        customer,
        subscriptions,
        paymentAttempts,
        recoveryActions,
        summaryStats
      }
    });

  } catch (error) {
    console.error('Customer detail error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

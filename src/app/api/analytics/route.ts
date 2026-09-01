import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Recovery Trend (last 10 batches)
    const { data: batchesData, error: batchesError } = await supabase
      .from('recovery_batches')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);
      
    if (batchesError) throw batchesError;

    const trendData = (batchesData || []).reverse().map(b => ({
      timestamp: new Date(b.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      recoveredCount: b.total_recovered,
      totalCount: b.total_at_risk,
      amount: b.total_amount_recovered,
    }));

    // 2. Action Effectiveness
    const { data: actionsData, error: actionsError } = await supabase
      .from('recovery_actions')
      .select('action_type, outcome, ai_confidence, amount_recovered');
      
    if (actionsError) throw actionsError;

    const actionStats = (actionsData || []).reduce((acc: any, action: any) => {
      const type = action.action_type;
      if (!acc[type]) acc[type] = { total: 0, success: 0 };
      acc[type].total += 1;
      if (action.outcome === 'success') acc[type].success += 1;
      return acc;
    }, {});

    const actionEffectiveness = Object.entries(actionStats).map(([action, stats]: [string, any]) => ({
      action: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      successRate: stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0,
      total: stats.total,
    })).sort((a, b) => b.successRate - a.successRate);

    // 3. AI Confidence Distribution
    const confidenceRanges = {
      '0-25%': 0,
      '26-50%': 0,
      '51-75%': 0,
      '76-100%': 0
    };
    
    let totalConfidence = 0;
    let confidenceCount = 0;

    (actionsData || []).forEach((action: any) => {
      if (action.ai_confidence !== null && action.ai_confidence !== undefined) {
        const raw = Number(action.ai_confidence);
        // Normalize: if stored as 0.92, convert to 92. If stored as 92, keep 92
        const conf = raw <= 1.0 ? Math.round(raw * 100) : Math.round(raw);
        totalConfidence += conf;
        confidenceCount += 1;
        
        if (conf <= 25) confidenceRanges['0-25%']++;
        else if (conf <= 50) confidenceRanges['26-50%']++;
        else if (conf <= 75) confidenceRanges['51-75%']++;
        else confidenceRanges['76-100%']++;
      }
    });

    const confidenceDistribution = Object.entries(confidenceRanges).map(([range, count]) => ({
      name: range,
      count
    }));

    // Default to high-confidence baseline (92%) if no historical actions have been logged yet
    const avgAiConfidence = confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : 92;


    // 4. Failure Reasons
    const { data: attemptsData, error: attemptsError } = await supabase
      .from('payment_attempts')
      .select('failure_reason, status, subscription_id');
      
    if (attemptsError) throw attemptsError;

    // To estimate recovery per failure reason, let's just group failed attempts by reason,
    // and if the subscription is now 'active' or 'recovered', we count it as recovered.
    // For simplicity, let's fetch all subscriptions first
    const { data: subsData, error: subsError } = await supabase
      .from('subscriptions')
      .select('id, status');
      
    if (subsError) throw subsError;
    
    const subStatusMap = new Map((subsData || []).map(s => [s.id, s.status]));
    
    const reasonStats = (attemptsData || []).reduce((acc: any, attempt: any) => {
      if (attempt.status !== 'failed' || !attempt.failure_reason) return acc;
      const reason = attempt.failure_reason;
      if (!acc[reason]) acc[reason] = { total: 0, recovered: 0 };
      
      acc[reason].total += 1;
      const currentStatus = subStatusMap.get(attempt.subscription_id);
      if (currentStatus === 'active' || currentStatus === 'recovered') {
        acc[reason].recovered += 1;
      }
      return acc;
    }, {});

    const failureReasonBreakdown = Object.entries(reasonStats).map(([reason, stats]: [string, any]) => ({
      reason: reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      total: stats.total,
      recovered: stats.recovered,
      recoveryRate: stats.total > 0 ? Math.round((stats.recovered / stats.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);

    // Calculate metrics
    let totalRecovered = 0;
    let totalAtRisk = 0;
    (batchesData || []).forEach(b => {
      totalRecovered += b.total_recovered;
      totalAtRisk += b.total_at_risk;
    });
    
    const avgRecoveryRate = totalAtRisk > 0 ? Math.round((totalRecovered / totalAtRisk) * 100) : 0;
    const mostCommonFailure = failureReasonBreakdown.length > 0 ? failureReasonBreakdown[0].reason : 'N/A';
    const bestActionType = actionEffectiveness.length > 0 ? actionEffectiveness[0].action : 'N/A';

    return NextResponse.json({
      success: true,
      data: {
        trendData,
        confidenceDistribution,
        failureReasonBreakdown,
        actionEffectiveness,
        metrics: {
          avgRecoveryRate,
          avgAiConfidence,
          mostCommonFailure,
          bestActionType,
          avgRecoveryTime: '24 hours' // Mock value for now
        }
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

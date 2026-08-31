import { supabase } from '../supabase';
import { detectAtRiskSubscriptions } from './detect';
import { decideRecoveryActions } from './decide';
import { executeRecoveryActions, ExecutionResult } from './execute';
import { RecoveryBatch } from '../types';

export interface RecoveryPipelineResult {
  batch: RecoveryBatch;
  results: ExecutionResult[];
  summary: {
    totalProcessed: number;
    recovered: number;
    pending: number;
    failed: number;
    skipped: number;
    amountRecovered: number;
    amountAtRisk: number;
    recoveryRate: number;
  };
  timings: {
    detect: number;
    decide: number;
    execute: number;
    total: number;
  };
}

export async function runRecoveryPipeline(): Promise<RecoveryPipelineResult> {
  const pipelineStart = Date.now();
  console.log('[CoverUP] Starting recovery pipeline...');

  // Step 1: DETECT
  console.log('[CoverUP] Stage 1: Detecting at-risk subscriptions...');
  const detectStart = Date.now();
  const atRiskSubscriptions = await detectAtRiskSubscriptions();
  const detectDuration = Date.now() - detectStart;
  console.log(`[CoverUP] Found ${atRiskSubscriptions.length} at-risk subscriptions`);

  if (atRiskSubscriptions.length === 0) {
    // Create empty batch
    const { data: batch } = await supabase
      .from('recovery_batches')
      .insert({
        total_at_risk: 0,
        total_recovered: 0,
        total_unresolved: 0,
        total_amount_at_risk: 0,
        total_amount_recovered: 0,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    return {
      batch: batch as RecoveryBatch,
      results: [],
      summary: {
        totalProcessed: 0,
        recovered: 0,
        pending: 0,
        failed: 0,
        skipped: 0,
        amountRecovered: 0,
        amountAtRisk: 0,
        recoveryRate: 0,
      },
      timings: {
        detect: detectDuration,
        decide: 0,
        execute: 0,
        total: Date.now() - pipelineStart,
      }
    };
  }

  // Create batch record
  const totalAmountAtRisk = atRiskSubscriptions.reduce((sum, s) => sum + s.subscription.amount, 0);
  const { data: batch, error: batchError } = await supabase
    .from('recovery_batches')
    .insert({
      total_at_risk: atRiskSubscriptions.length,
      total_amount_at_risk: totalAmountAtRisk,
      status: 'running',
    })
    .select()
    .single();

  if (batchError || !batch) throw new Error(`Failed to create batch: ${batchError?.message}`);

  // Step 2: DECIDE
  console.log('[CoverUP] Stage 2: AI deciding recovery actions...');
  const decideStart = Date.now();
  const decisions = await decideRecoveryActions(atRiskSubscriptions);
  const decideDuration = Date.now() - decideStart;
  console.log(`[CoverUP] Decisions made for ${decisions.length} subscriptions`);

  // Step 3: EXECUTE
  console.log('[CoverUP] Stage 3: Executing recovery actions...');
  const executeStart = Date.now();
  const results = await executeRecoveryActions(decisions, batch.id);
  const executeDuration = Date.now() - executeStart;
  console.log(`[CoverUP] Execution complete for ${results.length} subscriptions`);

  // Calculate summary
  const recovered = results.filter(r => r.outcome === 'success').length;
  const pending = results.filter(r => r.outcome === 'pending').length;
  const failed = results.filter(r => r.outcome === 'failed').length;
  const skipped = results.filter(r => r.skipped).length;
  const amountRecovered = results.reduce((sum, r) => sum + r.amountRecovered, 0);

  // Update batch record
  await supabase
    .from('recovery_batches')
    .update({
      total_recovered: recovered,
      total_unresolved: pending + failed,
      total_amount_recovered: amountRecovered,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', batch.id);

  // Refresh batch data
  const { data: updatedBatch } = await supabase
    .from('recovery_batches')
    .select()
    .eq('id', batch.id)
    .single();

  const summary = {
    totalProcessed: results.length,
    recovered,
    pending,
    failed,
    skipped,
    amountRecovered,
    amountAtRisk: totalAmountAtRisk,
    recoveryRate: atRiskSubscriptions.length > 0 ? recovered / atRiskSubscriptions.length : 0,
  };

  console.log(`[CoverUP] Pipeline complete!`);
  console.log(`[CoverUP] Results: ${recovered} recovered, ${pending} pending, ${failed} failed, ${skipped} skipped`);
  console.log(`[CoverUP] Amount recovered: ₹${(amountRecovered / 100).toLocaleString('en-IN')} / ₹${(totalAmountAtRisk / 100).toLocaleString('en-IN')}`);

  return {
    batch: (updatedBatch || batch) as RecoveryBatch,
    results,
    summary,
    timings: {
      detect: detectDuration,
      decide: decideDuration,
      execute: executeDuration,
      total: Date.now() - pipelineStart,
    }
  };
}

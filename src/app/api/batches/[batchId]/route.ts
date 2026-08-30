import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;

    // Get batch info
    const { data: batch, error: batchError } = await supabase
      .from('recovery_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchError || !batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Get actions for this batch
    const { data: actions, error: actionsError } = await supabase
      .from('recovery_actions')
      .select('*, subscriptions(*, customers(*))')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });

    if (actionsError) throw actionsError;

    return NextResponse.json({
      success: true,
      data: {
        batch,
        actions: actions || [],
      },
    });
  } catch (error) {
    console.error('Batch detail error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

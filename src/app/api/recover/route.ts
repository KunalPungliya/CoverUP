import { NextResponse } from 'next/server';
import { runRecoveryPipeline } from '@/lib/pipeline/recover';

export const maxDuration = 60; // Allow up to 60 seconds for AI processing

export async function POST() {
  try {
    const result = await runRecoveryPipeline();
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Recovery pipeline error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

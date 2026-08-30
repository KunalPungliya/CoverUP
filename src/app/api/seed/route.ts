import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({
      success: true,
      data: result,
      message: `Seeded ${result.customers} customers, ${result.subscriptions} subscriptions, ${result.payments} payment attempts`,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { recalculateAllScores } from '@/lib/algorithm';

/**
 * Serverless / Vercel Cron handler to periodically refresh JanBindu priority scores
 * with recency decay and dynamic interaction adjustments.
 */
export async function GET(req: NextRequest) {
  try {
    const updatedCount = await recalculateAllScores();
    return NextResponse.json({
      success: true,
      message: `Successfully recalculated scores for ${updatedCount} active issues`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron Recalculate Error:', error);
    return NextResponse.json({ error: 'Failed to recalculate scores' }, { status: 500 });
  }
}

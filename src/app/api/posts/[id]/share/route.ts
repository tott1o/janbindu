import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { recalculatePostScore } from '@/lib/algorithm';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getUserFromRequest(req);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const { id: postId } = params;

    await prisma.post.update({
      where: { id: postId },
      data: { shareCount: { increment: 1 } },
    });

    const newScore = await recalculatePostScore(postId);

    return NextResponse.json({ success: true, newScore });
  } catch (error) {
    console.error('Share Error:', error);
    return NextResponse.json({ error: 'Failed to share' }, { status: 500 });
  }
}

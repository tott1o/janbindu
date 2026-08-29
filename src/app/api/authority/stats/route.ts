import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import { ESCALATION_THRESHOLD } from '@/lib/algorithm';

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return unauthorizedResponse();
  }

  if (user.role !== 'authority' && user.role !== 'admin') {
    return forbiddenResponse('Authority or Admin access required');
  }

  try {
    const [totalPosts, reported, underReview, inProgress, resolved, escalatedCount] =
      await Promise.all([
        prisma.post.count(),
        prisma.post.count({ where: { status: 'reported' } }),
        prisma.post.count({ where: { status: 'under_review' } }),
        prisma.post.count({ where: { status: 'in_progress' } }),
        prisma.post.count({ where: { status: 'resolved' } }),
        prisma.post.count({ where: { janbinduScore: { gte: ESCALATION_THRESHOLD } } }),
      ]);

    const categories = await prisma.post.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    const categoryCounts: Record<string, number> = {};
    categories.forEach((c) => {
      categoryCounts[c.category] = c._count.id;
    });

    return NextResponse.json({
      totalPosts,
      statusCounts: {
        reported,
        under_review: underReview,
        in_progress: inProgress,
        resolved,
      },
      categoryCounts,
      escalatedCount,
      escalationThreshold: ESCALATION_THRESHOLD,
    });
  } catch (error) {
    console.error('Authority Stats Error:', error);
    return NextResponse.json({ error: 'Failed to fetch authority stats' }, { status: 500 });
  }
}

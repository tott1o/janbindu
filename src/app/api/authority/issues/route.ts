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
    return forbiddenResponse();
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {
      OR: [
        { janbinduScore: { gte: ESCALATION_THRESHOLD } },
        { status: { not: 'reported' } },
      ],
    };

    if (status) where.status = status;
    if (category) where.category = category;

    const issues = await prisma.post.findMany({
      where,
      orderBy: { janbinduScore: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, username: true, fullName: true, email: true },
        },
        images: {
          select: { id: true, imageUrl: true },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      issues: issues.map((issue) => ({
        ...issue,
        firstImage: issue.images[0]?.imageUrl || null,
      })),
    });
  } catch (error) {
    console.error('Authority Issues Error:', error);
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}

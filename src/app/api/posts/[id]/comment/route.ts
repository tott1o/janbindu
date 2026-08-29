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
    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        userId: user.id,
        postId,
        content: content.trim(),
      },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, avatar: true },
        },
      },
    });

    await prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    await recalculatePostScore(postId);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Comment Error:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}

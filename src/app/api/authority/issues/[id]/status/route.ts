import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getUserFromRequest(req);
  if (!user) {
    return unauthorizedResponse();
  }

  if (user.role !== 'authority' && user.role !== 'admin') {
    return forbiddenResponse();
  }

  try {
    const { id: postId } = params;
    const body = await req.json();
    const { status, note } = body;

    const validStatuses = ['reported', 'under_review', 'in_progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const currentPost = await prisma.post.findUnique({ where: { id: postId } });
    if (!currentPost) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    const [updatedPost] = await prisma.$transaction([
      prisma.post.update({
        where: { id: postId },
        data: { status },
      }),
      prisma.statusUpdate.create({
        data: {
          postId,
          authorityId: user.id,
          oldStatus: currentPost.status,
          newStatus: status,
          note: note || `Status changed to ${status.replace('_', ' ')}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      post: updatedPost,
    });
  } catch (error) {
    console.error('Status Update Error:', error);
    return NextResponse.json({ error: 'Failed to update issue status' }, { status: 500 });
  }
}

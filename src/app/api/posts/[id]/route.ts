import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const currentUser = getUserFromRequest(req);

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, avatar: true },
        },
        images: true,
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, username: true, fullName: true, avatar: true },
            },
          },
        },
        statusUpdates: {
          orderBy: { createdAt: 'desc' },
          include: {
            authority: {
              select: { id: true, username: true, fullName: true },
            },
          },
        },
        ...(currentUser
          ? {
              votes: {
                where: { userId: currentUser.id },
                select: { voteType: true },
              },
            }
          : {}),
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const userVote = post.votes && post.votes.length > 0 ? post.votes[0].voteType : null;
    const { votes: _, ...rest } = post as any;

    return NextResponse.json({
      ...rest,
      userVote,
    });
  } catch (error) {
    console.error('Fetch post detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const currentUser = getUserFromRequest(req);
  if (!currentUser) {
    return unauthorizedResponse();
  }

  try {
    const { id } = params;
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.userId !== currentUser.id && currentUser.role !== 'admin') {
      return forbiddenResponse('Only the creator or an admin can delete this post');
    }

    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}

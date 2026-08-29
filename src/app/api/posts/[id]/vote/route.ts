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
    const { voteType } = body;

    if (!['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    });

    let newVoteType: string | null = voteType;

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Toggle remove vote
        await prisma.vote.delete({ where: { id: existingVote.id } });
        await prisma.post.update({
          where: { id: postId },
          data: {
            upvoteCount: voteType === 'upvote' ? { decrement: 1 } : undefined,
            downvoteCount: voteType === 'downvote' ? { decrement: 1 } : undefined,
          },
        });
        newVoteType = null;
      } else {
        // Switch vote type
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { voteType },
        });
        await prisma.post.update({
          where: { id: postId },
          data: {
            upvoteCount: voteType === 'upvote' ? { increment: 1 } : { decrement: 1 },
            downvoteCount: voteType === 'downvote' ? { increment: 1 } : { decrement: 1 },
          },
        });
      }
    } else {
      // Create new vote
      await prisma.vote.create({
        data: {
          userId: user.id,
          postId,
          voteType,
        },
      });
      await prisma.post.update({
        where: { id: postId },
        data: {
          upvoteCount: voteType === 'upvote' ? { increment: 1 } : undefined,
          downvoteCount: voteType === 'downvote' ? { increment: 1 } : undefined,
        },
      });
    }

    // Automatically recalculate JanBindu score
    const updatedScore = await recalculatePostScore(postId);

    const updatedPost = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        janbinduScore: true,
        upvoteCount: true,
        downvoteCount: true,
      },
    });

    return NextResponse.json({
      success: true,
      userVote: newVoteType,
      post: updatedPost,
      score: updatedScore,
    });
  } catch (error) {
    console.error('Vote Error:', error);
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }
}

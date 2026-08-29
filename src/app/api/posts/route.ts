import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { recalculatePostScore } from '@/lib/algorithm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort') || 'trending';
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const city = searchParams.get('city');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;

    const currentUser = getUserFromRequest(req);

    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (city) where.city = { contains: city };

    let orderBy: any = { janbinduScore: 'desc' };
    if (sort === 'recent') {
      orderBy = { createdAt: 'desc' };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, fullName: true, avatar: true },
          },
          images: {
            select: { id: true, imageUrl: true },
            take: 1,
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
      }),
      prisma.post.count({ where }),
    ]);

    const formattedPosts = posts.map((post: any) => {
      const userVote = post.votes && post.votes.length > 0 ? post.votes[0].voteType : null;
      const { votes: _, ...rest } = post;
      return {
        ...rest,
        firstImage: post.images[0]?.imageUrl || null,
        userVote,
      };
    });

    return NextResponse.json({
      posts: formattedPosts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Fetch Posts Error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      criticality = 'medium',
      locationLat,
      locationLng,
      address,
      city,
      state,
      images = [],
    } = body;

    if (!title || !description || !category) {
      return NextResponse.json({ error: 'Title, description, and category are required' }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        title,
        description,
        category,
        criticality,
        locationLat: locationLat ? parseFloat(locationLat) : null,
        locationLng: locationLng ? parseFloat(locationLng) : null,
        address,
        city,
        state,
        images: {
          create: images.map((url: string) => ({
            imageUrl: url,
          })),
        },
      },
      include: {
        images: true,
      },
    });

    // Calculate initial JanBindu priority score
    const initialScore = await recalculatePostScore(post.id);

    return NextResponse.json({ ...post, janbinduScore: initialScore }, { status: 201 });
  } catch (error) {
    console.error('Create Post Error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

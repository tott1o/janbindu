import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { recalculatePostScore } from '@/lib/algorithm';
import { calculateDistanceKm } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort') || 'trending';
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const criticality = searchParams.get('criticality');
    const search = searchParams.get('search') || searchParams.get('city') || '';
    const userLat = searchParams.get('userLat') ? parseFloat(searchParams.get('userLat')!) : null;
    const userLng = searchParams.get('userLng') ? parseFloat(searchParams.get('userLng')!) : null;
    const maxDistanceKm = searchParams.get('maxDistance') ? parseFloat(searchParams.get('maxDistance')!) : null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;

    const currentUser = getUserFromRequest(req);

    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (criticality) where.criticality = criticality;

    if (search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { city: { contains: search.trim(), mode: 'insensitive' } },
        { address: { contains: search.trim(), mode: 'insensitive' } },
        { state: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { janbinduScore: 'desc' };
    if (sort === 'recent') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'critical') {
      orderBy = [{ criticality: 'desc' }, { janbinduScore: 'desc' }];
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip: sort === 'nearby' ? 0 : skip, // For nearby sort, we rank in memory if coordinates provided
        take: sort === 'nearby' ? 100 : limit,
        include: {
          user: {
            select: { id: true, username: true, fullName: true, avatar: true },
          },
          images: {
            select: { id: true, imageUrl: true },
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

    let formattedPosts = posts.map((post: any) => {
      const userVote = post.votes && post.votes.length > 0 ? post.votes[0].voteType : null;
      const { votes: _, ...rest } = post;
      const distance = calculateDistanceKm(userLat, userLng, post.locationLat, post.locationLng);

      return {
        ...rest,
        firstImage: post.images[0]?.imageUrl || null,
        imageCount: post.images?.length || 0,
        imagesList: post.images?.map((i: any) => i.imageUrl) || [],
        userVote,
        distanceKm: distance,
        isNearby: distance != null ? distance <= 10.0 : false,
      };
    });

    // Handle nearby sorting or filtering
    if (sort === 'nearby' && userLat != null && userLng != null) {
      formattedPosts = formattedPosts.sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });

      if (maxDistanceKm != null) {
        formattedPosts = formattedPosts.filter((p) => p.distanceKm != null && p.distanceKm <= maxDistanceKm);
      }

      // Paginate sorted result
      formattedPosts = formattedPosts.slice(skip, skip + limit);
    }

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

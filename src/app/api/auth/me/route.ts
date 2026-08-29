import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, unauthorizedResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const tokenUser = getUserFromRequest(req);
  if (!tokenUser) {
    return unauthorizedResponse();
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenUser.id },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      role: true,
      city: true,
      state: true,
      locationLat: true,
      locationLng: true,
      avatar: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const tokenUser = getUserFromRequest(req);
  if (!tokenUser) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();
    const { fullName, city, state, locationLat, locationLng } = body;

    const updatedUser = await prisma.user.update({
      where: { id: tokenUser.id },
      data: {
        ...(fullName && { fullName }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(locationLat !== undefined && { locationLat: locationLat ? parseFloat(locationLat) : null }),
        ...(locationLng !== undefined && { locationLng: locationLng ? parseFloat(locationLng) : null }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        city: true,
        state: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

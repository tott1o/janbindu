const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial JanBindu data...');

  const citizenPassword = await bcrypt.hash('citizen123', 10);
  const authorityPassword = await bcrypt.hash('authority123', 10);

  // 1. Create Users
  const user1 = await prisma.user.upsert({
    where: { email: 'citizen@janbindu.in' },
    update: {},
    create: {
      username: 'rahul_sharma',
      email: 'citizen@janbindu.in',
      passwordHash: citizenPassword,
      fullName: 'Rahul Sharma',
      role: 'citizen',
      city: 'Mumbai',
      state: 'Maharashtra',
      locationLat: 19.076,
      locationLng: 72.8777,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'priya@janbindu.in' },
    update: {},
    create: {
      username: 'priya_patel',
      email: 'priya@janbindu.in',
      passwordHash: citizenPassword,
      fullName: 'Priya Patel',
      role: 'citizen',
      city: 'Mumbai',
      state: 'Maharashtra',
      locationLat: 19.082,
      locationLng: 72.881,
    },
  });

  const authorityUser = await prisma.user.upsert({
    where: { email: 'authority@janbindu.in' },
    update: {},
    create: {
      username: 'mcgm_officer',
      email: 'authority@janbindu.in',
      passwordHash: authorityPassword,
      fullName: 'MCGM Ward Commissioner',
      role: 'authority',
      city: 'Mumbai',
      state: 'Maharashtra',
      locationLat: 19.076,
      locationLng: 72.8777,
    },
  });

  // 2. Create Sample Civic Issues
  const post1 = await prisma.post.create({
    data: {
      userId: user1.id,
      title: 'Uncovered Deep Drain Near Andheri Metro Station',
      description:
        'A hazardous open trench/drain with missing concrete slab right outside the station exit. Poses extreme threat to commuters and school children during peak rush hours.',
      category: 'safety',
      criticality: 'critical',
      locationLat: 19.1197,
      locationLng: 72.8464,
      address: 'SV Road, near Andheri West Metro Gate 2',
      city: 'Mumbai',
      state: 'Maharashtra',
      status: 'under_review',
      janbinduScore: 78.5,
      upvoteCount: 24,
      downvoteCount: 0,
      commentCount: 8,
      shareCount: 12,
      images: {
        create: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?q=80&w=800&auto=format&fit=crop',
          },
        ],
      },
      comments: {
        create: [
          {
            userId: user2.id,
            content: 'I almost fell into this yesterday evening! Urgently needs barricading.',
          },
        ],
      },
      statusUpdates: {
        create: [
          {
            authorityId: authorityUser.id,
            oldStatus: 'reported',
            newStatus: 'under_review',
            note: 'Inspection crew dispatched from K-West Ward office.',
          },
        ],
      },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      userId: user2.id,
      title: 'Major Mainline Water Pipe Burst with Massive Wastage',
      description:
        'Drinking water pipe burst since 6 AM flooding the street and causing acute shortage to adjacent residential complexes.',
      category: 'water',
      criticality: 'high',
      locationLat: 19.0728,
      locationLng: 72.8826,
      address: 'Near Kurla Signal, LBS Marg',
      city: 'Mumbai',
      state: 'Maharashtra',
      status: 'in_progress',
      janbinduScore: 62.0,
      upvoteCount: 18,
      downvoteCount: 1,
      commentCount: 5,
      shareCount: 6,
      images: {
        create: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1584467735815-f778f274e296?q=80&w=800&auto=format&fit=crop',
          },
        ],
      },
    },
  });

  const post3 = await prisma.post.create({
    data: {
      userId: user1.id,
      title: 'Defective Streetlights on Jogeshwari Link Road',
      description:
        'Over 8 consecutive poles dark for the past two weeks, creating blind spots and safety concerns for women commuters.',
      category: 'electricity',
      criticality: 'medium',
      locationLat: 19.1351,
      locationLng: 72.8697,
      address: 'JVLR Connector flyover base',
      city: 'Mumbai',
      state: 'Maharashtra',
      status: 'reported',
      janbinduScore: 38.0,
      upvoteCount: 9,
      downvoteCount: 0,
      commentCount: 2,
      shareCount: 1,
      images: {
        create: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800&auto=format&fit=crop',
          },
        ],
      },
    },
  });

  console.log('Seed data inserted successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

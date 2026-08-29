import { prisma } from './prisma';

export const ESCALATION_THRESHOLD = 50.0;

export interface ScorePostInput {
  id: string;
  criticality: string;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: Date;
  locationLat?: number | null;
  locationLng?: number | null;
}

/**
 * Calculates JanBindu Score for an issue based on:
 * 1. Community Interactions (Upvotes, Comments, Shares vs Downvotes)
 * 2. Criticality Level (Low: 1x, Medium: 2x, High: 4x, Critical: 8x)
 * 3. Location Density Bonus (Count of nearby issues within ~5km)
 * 4. Recency Decay (Gradual decay over 30 days, minimum 30% retention)
 */
export function calculateBaseScore(post: ScorePostInput): number {
  const interactionScore =
    post.upvoteCount * 2.0 +
    post.commentCount * 1.5 +
    post.shareCount * 3.0 -
    post.downvoteCount * 1.0;

  let criticalityWeight = 1;
  switch (post.criticality) {
    case 'low':
      criticalityWeight = 1;
      break;
    case 'medium':
      criticalityWeight = 2;
      break;
    case 'high':
      criticalityWeight = 4;
      break;
    case 'critical':
      criticalityWeight = 8;
      break;
    default:
      criticalityWeight = 1;
  }

  const criticalityScore = criticalityWeight * 10.0;

  const hoursSinceCreation = Math.max(
    0,
    (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60)
  );

  const decay = Math.max(0, 1 - hoursSinceCreation / (24 * 30));
  const recencyMultiplier = 0.3 + 0.7 * decay;

  return Math.max(0, (interactionScore + criticalityScore) * recencyMultiplier);
}

export async function calculateLocationDensity(
  postId: string,
  lat?: number | null,
  lng?: number | null
): Promise<number> {
  if (lat == null || lng == null) return 0;

  const degDist = 0.045; // Approx ~5km

  const nearbyCount = await prisma.post.count({
    where: {
      id: { not: postId },
      locationLat: { gte: lat - degDist, lte: lat + degDist },
      locationLng: { gte: lng - degDist, lte: lng + degDist },
    },
  });

  if (nearbyCount > 5) {
    return Math.log2(nearbyCount) * 5.0;
  }
  return 0;
}

export async function recalculatePostScore(postId: string): Promise<number | null> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) return null;

  const baseScore = calculateBaseScore(post);
  const densityBonus = await calculateLocationDensity(
    post.id,
    post.locationLat,
    post.locationLng
  );

  const totalScore = parseFloat((baseScore + densityBonus).toFixed(2));

  await prisma.post.update({
    where: { id: postId },
    data: { janbinduScore: totalScore },
  });

  return totalScore;
}

export async function recalculateAllScores(): Promise<number> {
  const activePosts = await prisma.post.findMany({
    where: { status: { not: 'resolved' } },
  });

  let count = 0;
  for (const post of activePosts) {
    await recalculatePostScore(post.id);
    count++;
  }
  return count;
}

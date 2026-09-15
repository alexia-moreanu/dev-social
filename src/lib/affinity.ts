import { prisma } from "@/lib/prisma";

// Builds a tag-weight vector per user from their authored posts, upvotes,
// and comments — a lightweight signal for "what does this person care about."
// Weighted: authoring > upvoting > commenting, so posting in a space you
// actually work in outweighs a single curious click.
const WEIGHTS = { author: 3, vote: 2, comment: 1 };

export type AffinityVector = Map<string, number>;

async function allPostTagsByPost() {
  const rows = await prisma.postTag.findMany({ select: { postId: true, tagId: true } });
  const map = new Map<string, string[]>();
  for (const r of rows) {
    if (!map.has(r.postId)) map.set(r.postId, []);
    map.get(r.postId)!.push(r.tagId);
  }
  return map;
}

export async function buildAllAffinityVectors(): Promise<Map<string, AffinityVector>> {
  const [posts, votes, comments, postTags] = await Promise.all([
    prisma.post.findMany({ select: { id: true, authorId: true } }),
    prisma.vote.findMany({ select: { userId: true, postId: true } }),
    prisma.comment.findMany({ select: { authorId: true, postId: true } }),
    allPostTagsByPost(),
  ]);

  const vectors = new Map<string, AffinityVector>();

  function bump(userId: string, postId: string, weight: number) {
    const tags = postTags.get(postId);
    if (!tags) return;
    if (!vectors.has(userId)) vectors.set(userId, new Map());
    const v = vectors.get(userId)!;
    for (const t of tags) v.set(t, (v.get(t) ?? 0) + weight);
  }

  for (const p of posts) bump(p.authorId, p.id, WEIGHTS.author);
  for (const v of votes) bump(v.userId, v.postId, WEIGHTS.vote);
  for (const c of comments) bump(c.authorId, c.postId, WEIGHTS.comment);

  return vectors;
}

export async function getUserAffinity(userId: string): Promise<AffinityVector> {
  const vectors = await buildAllAffinityVectors();
  return vectors.get(userId) ?? new Map();
}

export function cosineSimilarity(a: AffinityVector, b: AffinityVector): number {
  if (a.size === 0 || b.size === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const val of a.values()) magA += val * val;
  for (const val of b.values()) magB += val * val;
  for (const [tag, val] of a) {
    const other = b.get(tag);
    if (other) dot += val * other;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function scoreTagOverlap(vector: AffinityVector, tagIds: string[]): number {
  if (tagIds.length === 0) return 0;
  let score = 0;
  for (const t of tagIds) score += vector.get(t) ?? 0;
  return score / tagIds.length;
}

export async function getSimilarUsers(userId: string, limit = 5) {
  const vectors = await buildAllAffinityVectors();
  const mine = vectors.get(userId) ?? new Map();
  if (mine.size === 0) return [];

  const [users, existingFollows] = await Promise.all([
    prisma.user.findMany({ where: { id: { not: userId } } }),
    prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
  ]);
  const followingSet = new Set(existingFollows.map((f) => f.followingId));

  const scored = users
    .filter((u) => !followingSet.has(u.id))
    .map((u) => ({ user: u, similarity: cosineSimilarity(mine, vectors.get(u.id) ?? new Map()) }))
    .filter((s) => s.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return scored;
}

export async function getRecommendedProjects(userId: string, limit = 4) {
  const vectors = await buildAllAffinityVectors();
  const mine = vectors.get(userId) ?? new Map();

  const [projects, postTags] = await Promise.all([
    prisma.post.findMany({
      where: { type: "PROJECT", authorId: { not: userId } },
      include: { author: true, _count: { select: { votes: true } } },
    }),
    allPostTagsByPost(),
  ]);

  const scored = projects
    .map((p) => ({
      post: p,
      score: scoreTagOverlap(mine, postTags.get(p.id) ?? []) + p._count.votes * 0.05,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

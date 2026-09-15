import { prisma } from "@/lib/prisma";
import { hotScore } from "@/lib/ranking";
import { getUserAffinity, scoreTagOverlap } from "@/lib/affinity";
import type { PostType } from "@prisma/client";

export type SortMode = "hot" | "new" | "top" | "for-you";

export async function getFeedPosts(opts: {
  sort: SortMode;
  type?: PostType;
  types?: PostType[];
  tag?: string;
  authorId?: string;
  followingOf?: string;
  currentUserId?: string;
}) {
  const { sort, type, types, tag, authorId, followingOf, currentUserId } = opts;

  let followingIds: string[] | undefined;
  if (followingOf) {
    const follows = await prisma.follow.findMany({
      where: { followerId: followingOf },
      select: { followingId: true },
    });
    followingIds = follows.map((f) => f.followingId);
    if (followingIds.length === 0) followingIds = ["__none__"];
  }

  const posts = await prisma.post.findMany({
    where: {
      type: types ? { in: types } : type,
      authorId: authorId ?? (followingIds ? { in: followingIds } : undefined),
      tags: tag ? { some: { tag: { name: tag } } } : undefined,
    },
    include: {
      author: true,
      tags: { include: { tag: true } },
      _count: { select: { votes: true, comments: true } },
      votes: { where: { userId: currentUserId ?? "__none__" } },
    },
    orderBy: { createdAt: "desc" },
  });

  let affinity: Map<string, number> | null = null;
  if (sort === "for-you" && currentUserId) {
    affinity = await getUserAffinity(currentUserId);
  }

  const withScore = posts.map((p) => {
    const votes = p._count.votes;
    const tagIds = p.tags.map((t) => t.tagId);
    let score: number;
    if (sort === "new") score = p.createdAt.getTime();
    else if (sort === "top") score = votes;
    else if (sort === "for-you" && affinity) {
      score = scoreTagOverlap(affinity, tagIds) * 2 + hotScore(votes, p.createdAt);
    } else score = hotScore(votes, p.createdAt);

    return {
      ...p,
      voteCount: votes,
      commentCount: p._count.comments,
      hasVoted: currentUserId ? p.votes.length > 0 : false,
      _sortScore: score,
    };
  });

  withScore.sort((a, b) => b._sortScore - a._sortScore);
  return withScore;
}

export type FeedPost = Awaited<ReturnType<typeof getFeedPosts>>[number];

import { prisma } from "@/lib/prisma";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function knocksReceivedToday(toId: string) {
  return prisma.knock.count({ where: { toId, createdAt: { gte: startOfToday() } } });
}

// Ties are follows (either direction) plus vouches (either direction).
async function tiesTouching(ids: string[]) {
  const [follows, vouches] = await Promise.all([
    prisma.follow.findMany({
      where: { OR: [{ followerId: { in: ids } }, { followingId: { in: ids } }] },
      select: { followerId: true, followingId: true },
    }),
    prisma.vouch.findMany({
      where: { OR: [{ fromId: { in: ids } }, { toId: { in: ids } }] },
      select: { fromId: true, toId: true },
    }),
  ]);
  const edges: [string, string][] = [
    ...follows.map((f): [string, string] => [f.followerId, f.followingId]),
    ...vouches.map((v): [string, string] => [v.fromId, v.toId]),
  ];
  const neighbors = (id: string) =>
    new Set(edges.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : [])));
  return { edges, vouches, neighbors };
}

// A warm path is a shared connection to both the knocker and the maintainer.
// Prefer someone who has vouched for the knocker, then whoever has the most ties.
export async function getWarmPath(fromId: string, toId: string) {
  const { edges, vouches, neighbors } = await tiesTouching([fromId, toId]);

  const mine = neighbors(fromId);
  const theirs = neighbors(toId);
  if (mine.has(toId)) return { direct: true, via: null, viaVouched: false };

  const shared = [...mine].filter((id) => theirs.has(id) && id !== fromId && id !== toId);
  if (shared.length === 0) return { direct: false, via: null, viaVouched: false };

  const vouchedForKnocker = new Set(vouches.filter((v) => v.toId === fromId).map((v) => v.fromId));
  const score = (id: string) =>
    (vouchedForKnocker.has(id) ? 1000 : 0) + edges.filter(([a, b]) => a === id || b === id).length;
  shared.sort((a, b) => score(b) - score(a));

  const via = await prisma.user.findUnique({
    where: { id: shared[0] },
    select: { id: true, name: true, username: true, avatar: true },
  });
  return { direct: false, via, viaVouched: vouchedForKnocker.has(shared[0]) };
}

export async function getKnockContext(projectId: string, userId: string) {
  const project = await prisma.post.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      lookingFor: true,
      author: { select: { id: true, name: true, username: true, knockCap: true } },
    },
  });
  if (!project) return null;

  const [usedToday, path, existing] = await Promise.all([
    knocksReceivedToday(project.author.id),
    getWarmPath(userId, project.author.id),
    prisma.knock.findFirst({
      where: { fromId: userId, projectId },
      orderBy: { createdAt: "desc" },
      select: { status: true },
    }),
  ]);

  return {
    project,
    usedToday,
    cap: project.author.knockCap,
    path,
    existingStatus: existing?.status ?? null,
  };
}

const knockInclude = {
  project: { select: { id: true, title: true, repoUrl: true } },
  from: { select: { id: true, name: true, username: true, avatar: true, bio: true } },
  to: { select: { id: true, name: true, username: true, avatar: true } },
  via: { select: { id: true, name: true, username: true } },
} as const;

// Pending knocks are ranked by trust: vouches from people the maintainer is
// already tied to count most, other vouches count a little, then recency.
export async function getIncomingKnocks(userId: string) {
  const knocks = await prisma.knock.findMany({
    where: { toId: userId },
    include: knockInclude,
    orderBy: { createdAt: "desc" },
  });

  const fromIds = [...new Set(knocks.map((k) => k.fromId))];
  const [vouches, { neighbors }] = await Promise.all([
    prisma.vouch.findMany({
      where: { toId: { in: fromIds } },
      select: { toId: true, from: { select: { id: true, name: true } } },
    }),
    tiesTouching([userId]),
  ]);
  const known = neighbors(userId);

  const withTrust = knocks.map((k) => {
    const received = vouches.filter((v) => v.toId === k.fromId && v.from.id !== userId);
    const knownVouchers = received.filter((v) => known.has(v.from.id)).map((v) => v.from.name);
    return {
      ...k,
      vouchCount: received.length,
      knownVouchers,
      trustScore: knownVouchers.length * 3 + received.length,
    };
  });

  const pending = withTrust
    .filter((k) => k.status === "PENDING")
    .sort((a, b) => b.trustScore - a.trustScore || b.createdAt.getTime() - a.createdAt.getTime());
  const answered = withTrust.filter((k) => k.status !== "PENDING");
  return [...pending, ...answered];
}

export async function getSentKnocks(userId: string) {
  return prisma.knock.findMany({
    where: { fromId: userId },
    include: knockInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingKnockCount(userId: string) {
  return prisma.knock.count({ where: { toId: userId, status: "PENDING" } });
}

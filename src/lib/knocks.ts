import { prisma } from "@/lib/prisma";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function knocksReceivedToday(toId: string) {
  return prisma.knock.count({ where: { toId, createdAt: { gte: startOfToday() } } });
}

// A warm path is a shared connection: someone linked (by a follow in either
// direction) to both the knocker and the maintainer. Prefer the person with
// the most ties to either side, since they're the likeliest to vouch.
export async function getWarmPath(fromId: string, toId: string) {
  const follows = await prisma.follow.findMany({
    where: {
      OR: [
        { followerId: { in: [fromId, toId] } },
        { followingId: { in: [fromId, toId] } },
      ],
    },
    select: { followerId: true, followingId: true },
  });

  const neighbors = (id: string) =>
    new Set(
      follows.flatMap((f) =>
        f.followerId === id ? [f.followingId] : f.followingId === id ? [f.followerId] : []
      )
    );

  const mine = neighbors(fromId);
  const theirs = neighbors(toId);
  if (mine.has(toId)) return { direct: true, via: null };

  const shared = [...mine].filter((id) => theirs.has(id) && id !== fromId && id !== toId);
  if (shared.length === 0) return { direct: false, via: null };

  const tieCount = (id: string) =>
    follows.filter((f) => f.followerId === id || f.followingId === id).length;
  shared.sort((a, b) => tieCount(b) - tieCount(a));

  const via = await prisma.user.findUnique({
    where: { id: shared[0] },
    select: { id: true, name: true, username: true, avatar: true },
  });
  return { direct: false, via };
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

export async function getIncomingKnocks(userId: string) {
  return prisma.knock.findMany({
    where: { toId: userId },
    include: knockInclude,
    orderBy: { createdAt: "desc" },
  });
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

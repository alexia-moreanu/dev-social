import { prisma } from "@/lib/prisma";

// You can only vouch for someone you've actually built with: a knock between
// the two of you was let in, in either direction. That keeps vouches tied to
// real collaboration rather than becoming LinkedIn-style endorsements.
export async function findCollaboration(userA: string, userB: string) {
  if (userA === userB) return null;
  return prisma.knock.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { fromId: userA, toId: userB },
        { fromId: userB, toId: userA },
      ],
    },
    orderBy: { respondedAt: "desc" },
    select: { projectId: true, project: { select: { title: true } } },
  });
}

export async function getVouchState(viewerId: string, targetId: string) {
  const [collab, existing] = await Promise.all([
    findCollaboration(viewerId, targetId),
    prisma.vouch.findUnique({ where: { fromId_toId: { fromId: viewerId, toId: targetId } }, select: { id: true } }),
  ]);
  return { canVouch: !!collab && !existing, hasVouched: !!existing, project: collab?.project.title ?? null };
}

export async function getVouchesFor(userId: string) {
  return prisma.vouch.findMany({
    where: { toId: userId },
    include: {
      from: { select: { id: true, name: true, username: true, avatar: true } },
      project: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getVouchedIds(viewerId: string, targetIds: string[]) {
  const rows = await prisma.vouch.findMany({
    where: { fromId: viewerId, toId: { in: targetIds } },
    select: { toId: true },
  });
  return new Set(rows.map((r) => r.toId));
}

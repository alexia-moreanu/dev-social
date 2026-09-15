import { prisma } from "@/lib/prisma";
import { buildAllAffinityVectors, cosineSimilarity } from "@/lib/affinity";

export type GraphNode = {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  ring: 0 | 1 | 2;
};

export type GraphEdge = {
  source: string;
  target: string;
  kind: "follow" | "similar";
};

export async function buildNetworkGraph(centerUserId: string, maxNodes = 26) {
  const [allUsers, allFollows, vectors] = await Promise.all([
    prisma.user.findMany({ select: { id: true, username: true, name: true, avatar: true } }),
    prisma.follow.findMany({ select: { followerId: true, followingId: true } }),
    buildAllAffinityVectors(),
  ]);

  const userById = new Map(allUsers.map((u) => [u.id, u]));
  const followSet = new Set(allFollows.map((f) => `${f.followerId}->${f.followingId}`));
  const isFollowing = (a: string, b: string) => followSet.has(`${a}->${b}`);

  const followingOfCenter = new Set(allFollows.filter((f) => f.followerId === centerUserId).map((f) => f.followingId));
  const followersOfCenter = new Set(allFollows.filter((f) => f.followingId === centerUserId).map((f) => f.followerId));

  const centerVec = vectors.get(centerUserId) ?? new Map();
  const similarities = allUsers
    .filter((u) => u.id !== centerUserId)
    .map((u) => ({ id: u.id, sim: cosineSimilarity(centerVec, vectors.get(u.id) ?? new Map()) }))
    .sort((a, b) => b.sim - a.sim);

  const ring1Ids = new Set<string>([...followingOfCenter, ...followersOfCenter]);
  for (const s of similarities) {
    if (ring1Ids.size >= 9) break;
    if (s.sim > 0) ring1Ids.add(s.id);
  }
  ring1Ids.delete(centerUserId);

  const ring2Ids = new Set<string>();
  for (const id of ring1Ids) {
    const theirFollows = allFollows.filter((f) => f.followerId === id).map((f) => f.followingId);
    for (const t of theirFollows) {
      if (t !== centerUserId && !ring1Ids.has(t)) ring2Ids.add(t);
      if (ring1Ids.size + ring2Ids.size >= maxNodes) break;
    }
    if (ring1Ids.size + ring2Ids.size >= maxNodes) break;
  }

  const nodes: GraphNode[] = [
    { ...userById.get(centerUserId)!, ring: 0 as const },
    ...[...ring1Ids].map((id) => ({ ...userById.get(id)!, ring: 1 as const })),
    ...[...ring2Ids].map((id) => ({ ...userById.get(id)!, ring: 2 as const })),
  ].filter((n) => n.id);

  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges: GraphEdge[] = [];
  const seenEdge = new Set<string>();

  for (const f of allFollows) {
    if (!nodeIds.has(f.followerId) || !nodeIds.has(f.followingId)) continue;
    const key = [f.followerId, f.followingId].sort().join("|");
    if (seenEdge.has(key)) continue;
    seenEdge.add(key);
    edges.push({ source: f.followerId, target: f.followingId, kind: "follow" });
  }

  for (const s of similarities) {
    if (s.sim <= 0.15) continue;
    if (!ring1Ids.has(s.id)) continue;
    if (isFollowing(centerUserId, s.id) || isFollowing(s.id, centerUserId)) continue;
    edges.push({ source: centerUserId, target: s.id, kind: "similar" });
  }

  return { nodes, edges };
}

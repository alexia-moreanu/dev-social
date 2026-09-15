import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSimilarUsers, getRecommendedProjects } from "@/lib/affinity";
import Avatar from "@/components/Avatar";
import FollowButton from "@/components/FollowButton";
import { formatStars } from "@/lib/format";

export default async function Sidebar({ currentUserId }: { currentUserId?: string }) {
  const [similarUsers, recommendedProjects, tagCounts, myFollowing] = await Promise.all([
    currentUserId ? getSimilarUsers(currentUserId, 4) : Promise.resolve([]),
    currentUserId ? getRecommendedProjects(currentUserId, 3) : Promise.resolve([]),
    prisma.tag.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { posts: { _count: "desc" } },
      take: 10,
    }),
    currentUserId
      ? prisma.follow.findMany({ where: { followerId: currentUserId }, select: { followingId: true } })
      : Promise.resolve([]),
  ]);
  const followingSet = new Set(myFollowing.map((f) => f.followingId));

  return (
    <aside className="space-y-4">
      {similarUsers.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-3">
          <h3 className="text-xs font-mono uppercase tracking-wide text-muted mb-2.5">devs like you</h3>
          <div className="space-y-2.5">
            {similarUsers.map(({ user, similarity }) => (
              <div key={user.id} className="flex items-center gap-2">
                <Link href={`/u/${user.username}`} className="flex items-center gap-2 min-w-0 flex-1">
                  <Avatar src={user.avatar} name={user.name} size={26} />
                  <div className="min-w-0">
                    <div className="text-sm truncate">{user.name}</div>
                    <div className="text-xs text-muted font-mono">{Math.round(similarity * 100)}% match</div>
                  </div>
                </Link>
                <FollowButton userId={user.id} initialFollowing={followingSet.has(user.id)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {recommendedProjects.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-3">
          <h3 className="text-xs font-mono uppercase tracking-wide text-muted mb-2.5">projects for you</h3>
          <div className="space-y-2.5">
            {recommendedProjects.map(({ post }) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="block rounded-md hover:bg-surface-hover -mx-1 px-1 py-1 transition-colors"
              >
                <div className="text-sm font-medium truncate">{post.title}</div>
                <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                  <span>@{post.author.username}</span>
                  <span>·</span>
                  <span>★ {formatStars(post.repoStars ?? 0)}</span>
                  {post.repoLang && <span className="text-purple-400">{post.repoLang}</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface p-3">
        <h3 className="text-xs font-mono uppercase tracking-wide text-muted mb-2.5">trending tags</h3>
        <div className="flex flex-wrap gap-1.5">
          {tagCounts.map((t) => (
            <Link
              key={t.id}
              href={`/?tag=${encodeURIComponent(t.name)}`}
              className="rounded-full bg-tag-bg border border-border px-2 py-0.5 text-xs font-mono text-muted hover:text-accent transition-colors"
            >
              #{t.name} <span className="text-[10px]">{t._count.posts}</span>
            </Link>
          ))}
        </div>
      </section>
    </aside>
  );
}

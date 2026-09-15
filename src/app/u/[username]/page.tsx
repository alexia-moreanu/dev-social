import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { getFeedPosts } from "@/lib/posts";
import Avatar from "@/components/Avatar";
import FollowButton from "@/components/FollowButton";
import MessageButton from "@/components/MessageButton";
import PostCard from "@/components/PostCard";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const [profileUser, currentUser] = await Promise.all([
    prisma.user.findUnique({ where: { username } }),
    getCurrentUser(),
  ]);

  if (!profileUser) notFound();

  const [posts, followerCount, followingCount, isFollowing] = await Promise.all([
    getFeedPosts({ sort: "new", authorId: profileUser.id, currentUserId: currentUser?.id }),
    prisma.follow.count({ where: { followingId: profileUser.id } }),
    prisma.follow.count({ where: { followerId: profileUser.id } }),
    currentUser
      ? prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: currentUser.id, followingId: profileUser.id } },
        })
      : null,
  ]);

  const isSelf = currentUser?.id === profileUser.id;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="rounded-2xl border border-border bg-surface p-5 mb-6">
        <div className="flex items-start gap-4">
          <Avatar src={profileUser.avatar} name={profileUser.name} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-semibold">{profileUser.name}</h1>
              {!isSelf && currentUser && (
                <div className="flex items-center gap-2">
                  <FollowButton userId={profileUser.id} initialFollowing={!!isFollowing} />
                  <MessageButton userId={profileUser.id} />
                </div>
              )}
            </div>
            <div className="text-sm text-muted font-mono">@{profileUser.username}</div>
            {profileUser.bio && <p className="text-sm mt-2 leading-relaxed">{profileUser.bio}</p>}
            <div className="flex items-center gap-4 mt-3 text-sm">
              {profileUser.githubUrl && (
                <a
                  href={profileUser.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted hover:text-accent flex items-center gap-1"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                  github
                </a>
              )}
              <span className="text-muted">
                <span className="text-foreground font-medium">{followerCount}</span> followers
              </span>
              <span className="text-muted">
                <span className="text-foreground font-medium">{followingCount}</span> following
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center text-muted">
            No posts yet.
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { getFeedPosts } from "@/lib/posts";
import { getCurrentUser } from "@/lib/current-user";
import Avatar from "@/components/Avatar";
import VoteButton from "@/components/VoteButton";
import { CommentIcon } from "@/components/nav/icons";

export default async function ReelsPage() {
  const user = await getCurrentUser();
  const clips = await getFeedPosts({ sort: "new", type: "CLIP", currentUserId: user?.id });

  return (
    <div className="h-[calc(100dvh-112px)] md:h-[100dvh] overflow-y-scroll snap-y snap-mandatory bg-black">
      {clips.length === 0 && (
        <div className="h-full flex items-center justify-center text-muted">No clips yet.</div>
      )}
      {clips.map((post) => (
        <div key={post.id} className="h-[calc(100dvh-112px)] md:h-[100dvh] snap-start relative flex items-center justify-center">
          {post.poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.poster} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          {post.videoUrl && (
            <video
              src={post.videoUrl}
              poster={post.poster ?? undefined}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />

          <div className="absolute bottom-6 left-4 right-20 text-white">
            <Link href={`/u/${post.author.username}`} className="flex items-center gap-2 mb-2">
              <Avatar src={post.author.avatar} name={post.author.name} size={32} />
              <span className="font-semibold text-sm">@{post.author.username}</span>
            </Link>
            {post.title && <p className="font-medium text-sm mb-1">{post.title}</p>}
            {post.body && <p className="text-sm text-white/80 leading-snug">{post.body}</p>}
            <div className="flex gap-1.5 flex-wrap mt-2">
              {post.tags.map((t) => (
                <span key={t.tagId} className="text-[11px] font-mono bg-white/10 rounded-full px-2 py-0.5">
                  #{t.tag.name}
                </span>
              ))}
            </div>
          </div>

          <div className="absolute bottom-8 right-3 flex flex-col items-center gap-5 text-white">
            <VoteButton postId={post.id} initialCount={post.voteCount} initialVoted={post.hasVoted} size="lg" />
            <Link href={`/post/${post.id}`} className="flex flex-col items-center gap-1">
              <CommentIcon className="w-6 h-6" />
              <span className="text-xs font-medium">{post.commentCount}</span>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

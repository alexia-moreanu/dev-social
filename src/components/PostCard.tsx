import Link from "next/link";
import Avatar from "@/components/Avatar";
import TagPill from "@/components/TagPill";
import VoteButton from "@/components/VoteButton";
import CopyButton from "@/components/CopyButton";
import { CommentIcon } from "@/components/nav/icons";
import { timeAgo, formatStars } from "@/lib/format";
import { highlight } from "@/lib/highlight";
import type { FeedPost } from "@/lib/posts";

const TYPE_META: Record<string, { label: string; color: string; ring: string }> = {
  UPDATE: { label: "update", color: "text-muted", ring: "ring-border" },
  SNIPPET: { label: "snippet", color: "text-accent", ring: "ring-accent-dim/40" },
  TIP: { label: "tip", color: "text-up", ring: "ring-up-dim/40" },
  PROJECT: { label: "project", color: "text-purple-400", ring: "ring-purple-400/40" },
  CLIP: { label: "clip", color: "text-pink-400", ring: "ring-pink-400/40" },
  LINK: { label: "link", color: "text-orange-400", ring: "ring-orange-400/40" },
};

export default function PostCard({ post, linkToDetail = true }: { post: FeedPost; linkToDetail?: boolean }) {
  const meta = TYPE_META[post.type];

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2.5">
        <Link href={`/u/${post.author.username}`} className="shrink-0">
          <Avatar src={post.author.avatar} name={post.author.name} size={36} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/u/${post.author.username}`} className="font-semibold text-sm hover:underline">
            {post.author.name}
          </Link>
          <div className="text-xs text-muted">
            @{post.author.username} · {timeAgo(post.createdAt)} ago
          </div>
        </div>
        <span className={`text-[11px] font-mono font-medium px-2 py-1 rounded-full ring-1 ${meta.color} ${meta.ring} shrink-0`}>
          {meta.label}
        </span>
      </div>

      <div className="px-4">
        <PostMedia post={post} linkToDetail={linkToDetail} />
      </div>

      <div className="flex items-center gap-4 px-4 pt-3 pb-1">
        <VoteButton postId={post.id} initialCount={post.voteCount} initialVoted={post.hasVoted} size="lg" />
        {linkToDetail ? (
          <Link href={`/post/${post.id}`} className="flex items-center gap-1.5 text-foreground hover:text-accent transition-colors">
            <CommentIcon className="w-5 h-5" />
            <span className="text-sm font-medium">{post.commentCount}</span>
          </Link>
        ) : (
          <span className="flex items-center gap-1.5 text-muted">
            <CommentIcon className="w-5 h-5" />
            <span className="text-sm font-medium">{post.commentCount}</span>
          </span>
        )}
      </div>

      {post.body && (
        <p className="px-4 pb-2 text-sm leading-relaxed">
          <span className="font-semibold mr-1.5">{post.author.username}</span>
          <span className="text-foreground/90">{post.body}</span>
        </p>
      )}

      {post.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap px-4 pb-3.5">
          {post.tags.map((t) => (
            <TagPill key={t.tagId} name={t.tag.name} />
          ))}
        </div>
      )}

      {linkToDetail && post.commentCount > 0 && (
        <Link href={`/post/${post.id}`} className="block px-4 pb-3.5 -mt-2 text-xs text-muted hover:text-accent">
          View all {post.commentCount} comment{post.commentCount === 1 ? "" : "s"}
        </Link>
      )}
    </div>
  );
}

function PostMedia({ post, linkToDetail }: { post: FeedPost; linkToDetail: boolean }) {
  const TitleTag = linkToDetail ? Link : "div";
  const titleProps = linkToDetail ? { href: `/post/${post.id}` } : {};

  switch (post.type) {
    case "UPDATE":
      return null;

    case "SNIPPET":
      return (
        <div>
          {post.title && (
            // @ts-expect-error polymorphic tag
            <TitleTag {...titleProps} className="font-semibold hover:text-accent block mb-2">
              {post.title}
            </TitleTag>
          )}
          {post.code && (
            <pre className="rounded-xl border border-border bg-background p-3 overflow-x-auto text-[13px] leading-relaxed font-mono">
              <code dangerouslySetInnerHTML={{ __html: highlight(post.code, post.language) }} />
            </pre>
          )}
        </div>
      );

    case "TIP":
      return (
        <div>
          {post.title && (
            // @ts-expect-error polymorphic tag
            <TitleTag {...titleProps} className="font-semibold hover:text-up block mb-2">
              {post.title}
            </TitleTag>
          )}
          {post.command && (
            <div className="rounded-xl border border-up-dim/30 bg-background p-2.5 flex items-start gap-2">
              <pre className="flex-1 overflow-x-auto text-[13px] font-mono text-up leading-relaxed">
                {post.command.split("\n").map((line, i) => (
                  <div key={i}>
                    <span className="text-muted select-none">$ </span>
                    {line}
                  </div>
                ))}
              </pre>
              <CopyButton text={post.command} />
            </div>
          )}
        </div>
      );

    case "PROJECT":
      return (
        <div>
          {post.title && (
            // @ts-expect-error polymorphic tag
            <TitleTag {...titleProps} className="font-semibold hover:text-purple-400 block mb-2">
              {post.title}
            </TitleTag>
          )}
          {post.repoUrl && (
            <a
              href={post.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm hover:border-purple-400/50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="shrink-0 text-muted">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <span className="truncate font-mono text-xs text-muted flex-1">
                {post.repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//, "")}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted shrink-0">
                ★ {formatStars(post.repoStars ?? 0)}
              </span>
              {post.repoLang && (
                <span className="text-xs text-purple-400 shrink-0">{post.repoLang}</span>
              )}
            </a>
          )}
        </div>
      );

    case "CLIP":
      return (
        <div>
          {post.title && (
            // @ts-expect-error polymorphic tag
            <TitleTag {...titleProps} className="font-semibold hover:text-pink-400 block mb-2">
              {post.title}
            </TitleTag>
          )}
          <div className="relative w-full aspect-[9/13] rounded-xl overflow-hidden border border-border bg-background">
            {post.poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.poster} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors">
              <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 12 12" fill="white"><path d="M2 1l8 5-8 5V1z" /></svg>
              </div>
            </div>
          </div>
        </div>
      );

    case "LINK":
      return (
        <div>
          {post.title && (
            <a
              href={post.linkUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="font-semibold hover:text-orange-400 block mb-0.5"
            >
              {post.title}
            </a>
          )}
          {post.linkDomain && <span className="text-xs text-muted font-mono">{post.linkDomain}</span>}
        </div>
      );

    default:
      return null;
  }
}

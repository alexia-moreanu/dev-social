import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import PostCard from "@/components/PostCard";
import CommentForm from "@/components/CommentForm";
import CommentItem, { type CommentNode } from "@/components/CommentItem";

function buildTree(comments: CommentNode[]): CommentNode[] {
  const byId = new Map(comments.map((c) => [c.id, { ...c, replies: [] as CommentNode[] }]));
  const roots: CommentNode[] = [];
  for (const c of comments) {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: true,
      tags: { include: { tag: true } },
      _count: { select: { votes: true, comments: true } },
      votes: { where: { userId: user?.id ?? "__none__" } },
      comments: {
        include: { author: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post) notFound();

  const feedPost = {
    ...post,
    voteCount: post._count.votes,
    commentCount: post._count.comments,
    hasVoted: user ? post.votes.length > 0 : false,
    _sortScore: 0,
  };

  const commentNodes: CommentNode[] = post.comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt,
    author: c.author,
    replies: [],
    parentId: c.parentId,
  }));
  const tree = buildTree(commentNodes);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <PostCard post={feedPost} linkToDetail={false} />

      <div className="mt-6">
        <h2 className="text-sm font-mono text-muted mb-3">
          {post._count.comments} comment{post._count.comments === 1 ? "" : "s"}
        </h2>
        <div className="mb-5">
          <CommentForm postId={post.id} />
        </div>
        <div className="divide-y divide-border/50">
          {tree.map((c) => (
            <CommentItem key={c.id} comment={c} postId={post.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

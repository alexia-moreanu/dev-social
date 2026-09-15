"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import CommentForm from "@/components/CommentForm";
import { timeAgo } from "@/lib/format";

export type CommentNode = {
  id: string;
  body: string;
  createdAt: Date;
  author: { name: string; username: string; avatar: string | null };
  replies: CommentNode[];
  parentId?: string | null;
};

export default function CommentItem({ comment, postId, depth = 0 }: { comment: CommentNode; postId: string; depth?: number }) {
  const [replying, setReplying] = useState(false);

  return (
    <div className={depth > 0 ? "pl-4 border-l border-border" : ""}>
      <div className="flex items-start gap-2 py-2.5">
        <Avatar src={comment.author.avatar} name={comment.author.name} size={22} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs mb-0.5">
            <span className="font-medium">{comment.author.name}</span>
            <span className="text-muted">@{comment.author.username}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">{timeAgo(comment.createdAt)} ago</span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.body}</p>
          <button
            onClick={() => setReplying((r) => !r)}
            className="text-xs text-muted hover:text-accent mt-1 font-mono"
          >
            reply
          </button>
          {replying && (
            <div className="mt-2">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                autoFocus
                compact
                onDone={() => setReplying(false)}
              />
            </div>
          )}
          {comment.replies.length > 0 && (
            <div className="mt-1">
              {comment.replies.map((r) => (
                <CommentItem key={r.id} comment={r} postId={postId} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

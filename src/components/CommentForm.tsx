"use client";

import { useRef, useTransition } from "react";
import { addComment } from "@/lib/actions";

export default function CommentForm({
  postId,
  parentId,
  onDone,
  autoFocus,
  compact,
}: {
  postId: string;
  parentId?: string;
  onDone?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const body = String(formData.get("body") ?? "");
    if (!body.trim()) return;
    startTransition(async () => {
      await addComment(postId, body, parentId);
      if (ref.current) ref.current.value = "";
      onDone?.();
    });
  }

  return (
    <form action={submit} className="flex gap-2">
      <textarea
        ref={ref}
        name="body"
        autoFocus={autoFocus}
        placeholder={parentId ? "Write a reply..." : "Add a comment..."}
        rows={compact ? 1 : 2}
        className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent-dim"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent-dim text-white px-3 py-2 text-sm font-mono h-fit hover:bg-accent transition-colors disabled:opacity-50"
      >
        send
      </button>
    </form>
  );
}

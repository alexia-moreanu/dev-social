"use client";

import { useOptimistic, useTransition } from "react";
import { toggleVote } from "@/lib/actions";
import { HeartIcon } from "@/components/nav/icons";

export default function VoteButton({
  postId,
  initialCount,
  initialVoted,
  size = "md",
}: {
  postId: string;
  initialCount: number;
  initialVoted: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic(
    { count: initialCount, voted: initialVoted },
    (_prev, next: { count: number; voted: boolean }) => next
  );

  function onClick() {
    const next = { count: state.voted ? state.count - 1 : state.count + 1, voted: !state.voted };
    startTransition(async () => {
      setOptimistic(next);
      await toggleVote(postId);
    });
  }

  const iconSize = size === "lg" ? "w-7 h-7" : size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 transition-transform active:scale-90 ${
        state.voted ? "text-red-500" : "text-foreground hover:text-red-400"
      }`}
      aria-pressed={state.voted}
    >
      <HeartIcon className={iconSize} filled={state.voted} />
      <span className="text-sm font-medium tabular-nums">{state.count}</span>
    </button>
  );
}

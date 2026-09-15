"use client";

import { useOptimistic, useTransition } from "react";
import { toggleFollow } from "@/lib/actions";

export default function FollowButton({
  userId,
  initialFollowing,
}: {
  userId: string;
  initialFollowing: boolean;
}) {
  const [, startTransition] = useTransition();
  const [following, setOptimistic] = useOptimistic(initialFollowing, (_prev, next: boolean) => next);

  function onClick() {
    startTransition(async () => {
      setOptimistic(!following);
      await toggleFollow(userId);
    });
  }

  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-3 py-1 text-sm font-mono transition-colors ${
        following
          ? "border-border text-muted hover:border-red-500/50 hover:text-red-400"
          : "border-accent-dim bg-accent-dim/10 text-accent hover:bg-accent-dim/20"
      }`}
    >
      {following ? "following" : "+ follow"}
    </button>
  );
}

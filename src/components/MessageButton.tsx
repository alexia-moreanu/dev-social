"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { startConversationWith } from "@/lib/actions";
import { MessagesIcon } from "@/components/nav/icons";

export default function MessageButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    startTransition(async () => {
      const result = await startConversationWith(userId);
      if (result?.id) router.push(`/messages/${result.id}`);
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1 text-sm hover:bg-surface-hover transition-colors disabled:opacity-50"
    >
      <MessagesIcon className="w-4 h-4" />
      message
    </button>
  );
}

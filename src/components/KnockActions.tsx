"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondToKnock, setKnockCap } from "@/lib/actions";

export function KnockActions({ knockId }: { knockId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function respond(accept: boolean) {
    startTransition(async () => {
      const res = await respondToKnock(knockId, accept);
      if (res && "conversationId" in res && res.conversationId) {
        router.push(`/messages/${res.conversationId}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => respond(true)}
        disabled={pending}
        className="rounded-full bg-up-dim text-white px-4 py-1.5 text-sm font-medium hover:bg-up transition-colors disabled:opacity-50"
      >
        Let in
      </button>
      <button
        onClick={() => respond(false)}
        disabled={pending}
        className="rounded-full border border-border px-4 py-1.5 text-sm text-muted hover:text-foreground transition-colors disabled:opacity-50"
      >
        Not now
      </button>
    </div>
  );
}

export function CapControl({ cap }: { cap: number }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function change(next: number) {
    startTransition(async () => {
      await setKnockCap(next);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => change(cap - 1)}
        disabled={pending || cap <= 1}
        className="w-7 h-7 rounded-full border border-border text-muted hover:text-foreground disabled:opacity-40"
        aria-label="Lower daily limit"
      >
        −
      </button>
      <span className="w-6 text-center font-semibold tabular-nums">{cap}</span>
      <button
        onClick={() => change(cap + 1)}
        disabled={pending || cap >= 20}
        className="w-7 h-7 rounded-full border border-border text-muted hover:text-foreground disabled:opacity-40"
        aria-label="Raise daily limit"
      >
        +
      </button>
    </div>
  );
}

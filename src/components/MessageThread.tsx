"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage, markConversationRead } from "@/lib/actions";
import { SendIcon } from "@/components/nav/icons";
import { timeAgo } from "@/lib/format";

type Msg = {
  id: string;
  body: string;
  createdAt: Date;
  authorId: string;
};

export default function MessageThread({
  conversationId,
  currentUserId,
  messages,
}: {
  conversationId: string;
  currentUserId: string;
  messages: Msg[];
}) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 4000);
    return () => clearInterval(interval);
  }, [router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    startTransition(async () => {
      await sendMessage(conversationId, body);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.map((m) => {
          const mine = m.authorId === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine ? "bg-accent-dim text-white rounded-br-sm" : "bg-surface-hover rounded-bl-sm"
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{m.body}</p>
                <p className={`text-[10px] mt-1 ${mine ? "text-white/60" : "text-muted"}`}>{timeAgo(m.createdAt)} ago</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border p-3 shrink-0">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message..."
          className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:border-accent-dim"
        />
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-accent-dim text-white disabled:opacity-40 hover:bg-accent transition-colors"
        >
          <SendIcon className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

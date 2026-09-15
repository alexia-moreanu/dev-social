import Link from "next/link";
import { getConversationsForUser } from "@/lib/conversations";
import Avatar from "@/components/Avatar";
import { timeAgo } from "@/lib/format";

export default async function ConversationList({ userId, activeId }: { userId: string; activeId?: string }) {
  const conversations = await getConversationsForUser(userId);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3.5 border-b border-border shrink-0">
        <h1 className="font-semibold">Messages</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <p className="p-4 text-sm text-muted">
            No conversations yet. Visit a profile and hit &quot;message&quot; to start one.
          </p>
        )}
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/messages/${c.id}`}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-surface-hover border-b border-border/50 transition-colors ${
              activeId === c.id ? "bg-surface-hover" : ""
            }`}
          >
            <Avatar src={c.other!.avatar} name={c.other!.name} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm truncate ${c.unread ? "font-semibold" : ""}`}>{c.other!.name}</span>
                {c.lastMessage && (
                  <span className="text-[10px] text-muted shrink-0">{timeAgo(c.lastMessage.createdAt)}</span>
                )}
              </div>
              <p className={`text-xs truncate ${c.unread ? "text-foreground" : "text-muted"}`}>
                {c.lastMessage?.body ?? "Say hi \u{1F44B}"}
              </p>
            </div>
            {c.unread && <span className="w-2 h-2 rounded-full bg-accent shrink-0" />}
          </Link>
        ))}
      </div>
    </div>
  );
}

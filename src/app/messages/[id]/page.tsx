import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getConversationDetail } from "@/lib/conversations";
import ConversationList from "@/components/ConversationList";
import MessageThread from "@/components/MessageThread";
import Avatar from "@/components/Avatar";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const detail = await getConversationDetail(id, user.id);
  if (!detail || !detail.other) notFound();

  return (
    <div className="mx-auto max-w-4xl h-[calc(100dvh-112px)] md:h-[100dvh] flex border-x border-border">
      <div className="hidden sm:block sm:w-80 shrink-0 border-r border-border">
        <ConversationList userId={user.id} activeId={id} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <Link href="/messages" className="sm:hidden text-muted mr-1">
            ‹
          </Link>
          <Avatar src={detail.other.avatar} name={detail.other.name} size={32} />
          <div className="min-w-0">
            <Link href={`/u/${detail.other.username}`} className="text-sm font-semibold hover:underline block truncate">
              {detail.other.name}
            </Link>
            <span className="text-xs text-muted">@{detail.other.username}</span>
          </div>
        </div>
        <MessageThread
          conversationId={id}
          currentUserId={user.id}
          messages={detail.conversation.messages}
        />
      </div>
    </div>
  );
}

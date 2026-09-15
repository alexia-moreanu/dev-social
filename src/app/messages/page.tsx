import { getCurrentUser } from "@/lib/current-user";
import ConversationList from "@/components/ConversationList";

export default async function MessagesIndexPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl h-[calc(100dvh-112px)] md:h-[100dvh] flex border-x border-border">
      <div className="w-full sm:w-80 shrink-0 sm:border-r border-border">
        <ConversationList userId={user.id} />
      </div>
      <div className="hidden sm:flex flex-1 items-center justify-center text-muted text-sm">
        Select a conversation
      </div>
    </div>
  );
}

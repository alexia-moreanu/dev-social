import { prisma } from "@/lib/prisma";

export async function getConversationsForUser(userId: string) {
  const participants = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: { include: { user: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  return participants
    .map((p) => {
      const other = p.conversation.participants.find((x) => x.userId !== userId)?.user;
      const lastMessage = p.conversation.messages[0] ?? null;
      return {
        id: p.conversation.id,
        other,
        lastMessage,
        unread: lastMessage ? lastMessage.createdAt > p.lastReadAt && lastMessage.authorId !== userId : false,
      };
    })
    .filter((c) => c.other)
    .sort((a, b) => {
      const at = a.lastMessage?.createdAt.getTime() ?? 0;
      const bt = b.lastMessage?.createdAt.getTime() ?? 0;
      return bt - at;
    });
}

export async function getUnreadMessageCount(userId: string) {
  const conversations = await getConversationsForUser(userId);
  return conversations.filter((c) => c.unread).length;
}

export async function getOrCreateConversation(userAId: string, userBId: string) {
  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { participants: { some: { userId: userAId } } },
        { participants: { some: { userId: userBId } } },
      ],
    },
  });
  if (existing) return existing.id;

  const created = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: userAId }, { userId: userBId }],
      },
    },
  });
  return created.id;
}

export async function getConversationDetail(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: { include: { user: true } },
      messages: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) return null;
  const isParticipant = conversation.participants.some((p) => p.userId === userId);
  if (!isParticipant) return null;

  const other = conversation.participants.find((p) => p.userId !== userId)?.user ?? null;
  return { conversation, other };
}

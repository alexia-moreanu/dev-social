"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, CURRENT_USER_COOKIE } from "@/lib/current-user";
import { getOrCreateConversation } from "@/lib/conversations";
import type { PostType } from "@prisma/client";

export async function switchUser(userId: string) {
  const store = await cookies();
  store.set(CURRENT_USER_COOKIE, userId, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  revalidatePath("/", "layout");
}

export async function toggleVote(postId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const existing = await prisma.vote.findUnique({
    where: { userId_postId: { userId: user.id, postId } },
  });

  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } });
  } else {
    await prisma.vote.create({ data: { userId: user.id, postId } });
  }
  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
}

export async function toggleFollow(targetUserId: string) {
  const user = await getCurrentUser();
  if (!user || user.id === targetUserId) return;

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId: targetUserId } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({ data: { followerId: user.id, followingId: targetUserId } });
  }
  revalidatePath("/");
  revalidatePath("/u/[username]", "page");
}

export async function addComment(postId: string, body: string, parentId?: string) {
  const user = await getCurrentUser();
  if (!user || !body.trim()) return;

  await prisma.comment.create({
    data: { postId, authorId: user.id, body: body.trim(), parentId: parentId || null },
  });
  revalidatePath(`/post/${postId}`);
}

type SubmitPostInput = {
  type: PostType;
  title?: string;
  body?: string;
  code?: string;
  language?: string;
  command?: string;
  repoUrl?: string;
  repoLang?: string;
  linkUrl?: string;
  tags: string[];
};

export async function submitPost(input: SubmitPostInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in" };

  let linkDomain: string | undefined;
  if (input.linkUrl) {
    try {
      linkDomain = new URL(input.linkUrl).hostname.replace(/^www\./, "");
    } catch {
      // ignore invalid URL, leave domain undefined
    }
  }

  const post = await prisma.post.create({
    data: {
      type: input.type,
      authorId: user.id,
      title: input.title || undefined,
      body: input.body || undefined,
      code: input.code || undefined,
      language: input.language || undefined,
      command: input.command || undefined,
      repoUrl: input.repoUrl || undefined,
      repoLang: input.repoLang || undefined,
      linkUrl: input.linkUrl || undefined,
      linkDomain,
    },
  });

  for (const rawTag of input.tags) {
    const name = rawTag.trim().toLowerCase();
    if (!name) continue;
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    await prisma.postTag.create({ data: { postId: post.id, tagId: tag.id } }).catch(() => {});
  }

  revalidatePath("/");
  return { id: post.id };
}

export async function startConversationWith(targetUserId: string) {
  const user = await getCurrentUser();
  if (!user || user.id === targetUserId) return { error: "Invalid recipient" };

  const conversationId = await getOrCreateConversation(user.id, targetUserId);
  return { id: conversationId };
}

export async function sendMessage(conversationId: string, body: string) {
  const user = await getCurrentUser();
  if (!user || !body.trim()) return;

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: user.id } },
  });
  if (!participant) return;

  await prisma.message.create({
    data: { conversationId, authorId: user.id, body: body.trim() },
  });
  await prisma.conversationParticipant.update({
    where: { id: participant.id },
    data: { lastReadAt: new Date() },
  });
  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
}

export async function markConversationRead(conversationId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.conversationParticipant
    .update({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      data: { lastReadAt: new Date() },
    })
    .catch(() => {});
  revalidatePath("/messages");
}

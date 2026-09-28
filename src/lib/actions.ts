"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, CURRENT_USER_COOKIE } from "@/lib/current-user";
import { getOrCreateConversation } from "@/lib/conversations";
import { getKnockContext } from "@/lib/knocks";
import { MIN_KNOCK_LENGTH } from "@/lib/knock-rules";
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
  lookingFor?: string;
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
      lookingFor: input.type === "PROJECT" ? input.lookingFor || undefined : undefined,
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

export async function loadKnockContext(projectId: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  return getKnockContext(projectId, user.id);
}

export async function sendKnock(projectId: string, message: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in" };

  const body = message.trim();
  if (body.length < MIN_KNOCK_LENGTH) {
    return { error: `Add a bit more context (at least ${MIN_KNOCK_LENGTH} characters).` };
  }

  const ctx = await getKnockContext(projectId, user.id);
  if (!ctx) return { error: "Project not found" };
  if (ctx.project.author.id === user.id) return { error: "You can't knock on your own project." };
  if (ctx.existingStatus === "PENDING") return { error: "You already have a knock waiting here." };
  if (ctx.existingStatus === "ACCEPTED") return { error: "You're already in." };
  if (ctx.usedToday >= ctx.cap) {
    return { error: `${ctx.project.author.name}'s inbox is full for today. Try again tomorrow.` };
  }

  await prisma.knock.create({
    data: {
      projectId,
      fromId: user.id,
      toId: ctx.project.author.id,
      viaId: ctx.path.via?.id ?? null,
      message: body,
    },
  });
  revalidatePath("/knocks");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function respondToKnock(knockId: string, accept: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in" };

  const knock = await prisma.knock.findUnique({
    where: { id: knockId },
    include: { project: { select: { title: true } } },
  });
  if (!knock || knock.toId !== user.id || knock.status !== "PENDING") {
    return { error: "This knock can't be answered." };
  }

  await prisma.knock.update({
    where: { id: knockId },
    data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
  });

  let conversationId: string | undefined;
  if (accept) {
    // Letting someone in opens a DM seeded with their knock, so the context
    // they wrote carries into the first real conversation.
    conversationId = await getOrCreateConversation(user.id, knock.fromId);
    await prisma.message.create({
      data: {
        conversationId,
        authorId: knock.fromId,
        body: `Knock on ${knock.project.title ?? "your project"}: ${knock.message}`,
        createdAt: knock.createdAt,
      },
    });
    await prisma.message.create({
      data: { conversationId, authorId: user.id, body: "Let you in! Let's talk about where to start." },
    });
  }

  revalidatePath("/knocks");
  revalidatePath("/messages");
  revalidatePath("/", "layout");
  return { ok: true, conversationId };
}

export async function setKnockCap(cap: number) {
  const user = await getCurrentUser();
  if (!user) return;
  const safe = Math.max(1, Math.min(20, Math.round(cap)));
  await prisma.user.update({ where: { id: user.id }, data: { knockCap: safe } });
  revalidatePath("/knocks");
}

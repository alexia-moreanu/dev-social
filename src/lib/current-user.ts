import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "dev_social_uid";

export async function getCurrentUser() {
  const store = await cookies();
  const uid = store.get(COOKIE_NAME)?.value;

  if (uid) {
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (user) return user;
  }

  const fallback = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  return fallback;
}

export const CURRENT_USER_COOKIE = COOKIE_NAME;

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Avatar from "@/components/Avatar";

export default async function Stories() {
  const recentPosts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
    select: { author: { select: { id: true, username: true, name: true, avatar: true } } },
  });

  const seen = new Set<string>();
  const authors: { id: string; username: string; name: string; avatar: string | null }[] = [];
  for (const p of recentPosts) {
    if (seen.has(p.author.id)) continue;
    seen.add(p.author.id);
    authors.push(p.author);
    if (authors.length >= 14) break;
  }

  if (authors.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-1 mb-5 -mx-1 px-1 [scrollbar-width:none]">
      {authors.map((a) => (
        <Link key={a.id} href={`/u/${a.username}`} className="flex flex-col items-center gap-1 shrink-0 w-16">
          <div className="p-[2px] rounded-full bg-gradient-to-tr from-up via-accent to-pink-400">
            <div className="p-[2px] bg-background rounded-full">
              <Avatar src={a.avatar} name={a.name} size={56} />
            </div>
          </div>
          <span className="text-[11px] text-muted truncate w-full text-center">{a.username}</span>
        </Link>
      ))}
    </div>
  );
}

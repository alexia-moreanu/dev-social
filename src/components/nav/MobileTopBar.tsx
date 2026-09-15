import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import UserSwitcher from "@/components/UserSwitcher";
import Avatar from "@/components/Avatar";
import { PlusIcon } from "@/components/nav/icons";

export default async function MobileTopBar() {
  const [user, users] = await Promise.all([
    getCurrentUser(),
    prisma.user.findMany({
      select: { id: true, username: true, name: true, avatar: true },
      orderBy: { username: "asc" },
    }),
  ]);

  return (
    <header className="md:hidden sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="px-4 h-14 flex items-center gap-3">
        <Link href="/" className="font-mono font-bold text-lg tracking-tight">
          <span className="text-accent">dev</span>
          <span className="text-foreground">/</span>
          <span className="text-up">social</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/submit"
            className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-muted hover:text-foreground"
          >
            <PlusIcon className="w-5 h-5" />
          </Link>
          {user && (
            <>
              <UserSwitcher current={user} users={users} />
              <Link href={`/u/${user.username}`}>
                <Avatar src={user.avatar} name={user.name} size={28} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

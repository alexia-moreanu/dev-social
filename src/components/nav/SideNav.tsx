import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { getUnreadMessageCount } from "@/lib/conversations";
import { NavItem } from "@/components/nav/NavItem";
import UserSwitcher from "@/components/UserSwitcher";
import Avatar from "@/components/Avatar";
import {
  HomeIcon,
  ReelsIcon,
  NewsIcon,
  LearnIcon,
  WebIcon,
  MessagesIcon,
  PlusIcon,
} from "@/components/nav/icons";

export default async function SideNav() {
  const [user, users] = await Promise.all([
    getCurrentUser(),
    prisma.user.findMany({
      select: { id: true, username: true, name: true, avatar: true },
      orderBy: { username: "asc" },
    }),
  ]);
  const unread = user ? await getUnreadMessageCount(user.id) : 0;

  return (
    <nav className="hidden md:flex md:flex-col w-[72px] xl:w-64 shrink-0 border-r border-border h-screen sticky top-0 px-2 xl:px-3 py-4">
      <Link href="/" className="font-mono font-bold text-lg tracking-tight px-3 py-2 mb-2 block">
        <span className="xl:hidden text-accent">d/s</span>
        <span className="hidden xl:inline">
          <span className="text-accent">dev</span>
          <span className="text-foreground">/</span>
          <span className="text-up">social</span>
        </span>
      </Link>

      <div className="flex flex-col gap-1 flex-1">
        <NavItem href="/" icon={<HomeIcon className="w-6 h-6" />} label="Home" exact />
        <NavItem href="/reels" icon={<ReelsIcon className="w-6 h-6" />} label="Reels" />
        <NavItem href="/news" icon={<NewsIcon className="w-6 h-6" />} label="News" />
        <NavItem href="/learn" icon={<LearnIcon className="w-6 h-6" />} label="Learn" />
        <NavItem href="/web" icon={<WebIcon className="w-6 h-6" />} label="Web" />
        <NavItem href="/messages" icon={<MessagesIcon className="w-6 h-6" />} label="Messages" badge={unread} />
        <NavItem href="/submit" icon={<PlusIcon className="w-6 h-6" />} label="Post" />
      </div>

      {user && (
        <div className="border-t border-border pt-3 mt-2">
          <Link
            href={`/u/${user.username}`}
            className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-hover transition-colors mb-1"
          >
            <Avatar src={user.avatar} name={user.name} size={28} />
            <span className="hidden xl:inline text-sm truncate">{user.name}</span>
          </Link>
          <div className="px-1">
            <UserSwitcher current={user} users={users} fullWidth openUp />
          </div>
        </div>
      )}
    </nav>
  );
}

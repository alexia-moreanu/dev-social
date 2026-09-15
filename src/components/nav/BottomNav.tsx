import { getCurrentUser } from "@/lib/current-user";
import { getUnreadMessageCount } from "@/lib/conversations";
import { NavItem } from "@/components/nav/NavItem";
import { HomeIcon, ReelsIcon, NewsIcon, LearnIcon, WebIcon, MessagesIcon } from "@/components/nav/icons";

export default async function BottomNav() {
  const user = await getCurrentUser();
  const unread = user ? await getUnreadMessageCount(user.id) : 0;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur flex">
      <NavItem href="/" icon={<HomeIcon className="w-6 h-6" />} label="Home" compact exact />
      <NavItem href="/reels" icon={<ReelsIcon className="w-6 h-6" />} label="Reels" compact />
      <NavItem href="/news" icon={<NewsIcon className="w-6 h-6" />} label="News" compact />
      <NavItem href="/learn" icon={<LearnIcon className="w-6 h-6" />} label="Learn" compact />
      <NavItem href="/web" icon={<WebIcon className="w-6 h-6" />} label="Web" compact />
      <NavItem href="/messages" icon={<MessagesIcon className="w-6 h-6" />} label="Chat" compact badge={unread} />
    </nav>
  );
}

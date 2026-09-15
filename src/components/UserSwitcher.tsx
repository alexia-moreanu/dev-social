"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchUser } from "@/lib/actions";
import Avatar from "@/components/Avatar";

type SimpleUser = { id: string; username: string; name: string; avatar: string | null };

export default function UserSwitcher({
  current,
  users,
  fullWidth,
  openUp,
}: {
  current: SimpleUser;
  users: SimpleUser[];
  fullWidth?: boolean;
  openUp?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  function pick(id: string) {
    setOpen(false);
    startTransition(async () => {
      await switchUser(id);
      router.refresh();
    });
  }

  return (
    <div className={`relative ${fullWidth ? "w-full" : ""}`} ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-md border border-border px-2 py-1.5 hover:bg-surface-hover transition-colors text-xs text-muted ${
          fullWidth ? "w-full justify-center xl:justify-between" : ""
        }`}
      >
        <span className="hidden xl:inline">switch user</span>
        <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0">
          <path d="M2 4l3 3 3-3" stroke="currentColor" fill="none" strokeWidth="1.5" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={`absolute w-64 max-h-96 overflow-y-auto rounded-md border border-border bg-surface shadow-xl z-50 py-1 ${
              openUp ? "left-0 xl:left-auto xl:right-0 bottom-full mb-1" : "right-0 top-full mt-1"
            }`}
          >
            <div className="px-3 py-1.5 text-xs text-muted font-mono border-b border-border mb-1">
              acting as — demo mode
            </div>
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => pick(u.id)}
                className={`flex items-center gap-2 w-full text-left px-3 py-1.5 hover:bg-surface-hover transition-colors ${
                  u.id === current.id ? "bg-surface-hover" : ""
                }`}
              >
                <Avatar src={u.avatar} name={u.name} size={22} />
                <span className="text-sm truncate">{u.name}</span>
                <span className="text-xs text-muted font-mono ml-auto shrink-0">@{u.username}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavItem({
  href,
  icon,
  label,
  compact,
  badge,
  exact,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  compact?: boolean;
  badge?: number;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  if (compact) {
    return (
      <Link
        href={href}
        className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px]"
      >
        <span className={active ? "text-foreground" : "text-muted"}>{icon}</span>
        {badge ? (
          <span className="absolute top-1 right-1/2 translate-x-3 min-w-[14px] h-[14px] px-0.5 rounded-full bg-accent text-white text-[9px] leading-[14px] text-center">
            {badge}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        active ? "bg-surface-hover text-foreground font-medium" : "text-muted hover:bg-surface-hover hover:text-foreground"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="hidden xl:inline">{label}</span>
      {badge ? (
        <span className="ml-auto hidden xl:flex min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-white text-xs items-center justify-center">
          {badge}
        </span>
      ) : null}
      {badge && (
        <span className="xl:hidden absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-accent text-white text-[9px] leading-[14px] text-center">
          {badge}
        </span>
      )}
    </Link>
  );
}

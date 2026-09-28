import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { getIncomingKnocks, getSentKnocks, knocksReceivedToday } from "@/lib/knocks";
import { KnockActions, CapControl } from "@/components/KnockActions";
import Avatar from "@/components/Avatar";
import VouchButton from "@/components/VouchButton";
import { getVouchedIds } from "@/lib/vouches";
import { timeAgo } from "@/lib/format";

const STATUS_STYLE = {
  PENDING: "text-yellow-400 border-yellow-400/40",
  ACCEPTED: "text-up border-up-dim/60",
  DECLINED: "text-muted border-border",
} as const;
const STATUS_LABEL = { PENDING: "waiting", ACCEPTED: "let in", DECLINED: "not now" } as const;

export default async function KnocksPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const showSent = tab === "sent";
  const user = await getCurrentUser();
  if (!user) return null;

  const [incoming, sent, usedToday] = await Promise.all([
    getIncomingKnocks(user.id),
    getSentKnocks(user.id),
    knocksReceivedToday(user.id),
  ]);
  const pending = incoming.filter((k) => k.status === "PENDING");
  const answered = incoming.filter((k) => k.status !== "PENDING");
  const list = showSent ? sent : [...pending, ...answered];
  const collaboratorIds = list
    .filter((k) => k.status === "ACCEPTED")
    .map((k) => (showSent ? k.toId : k.fromId));
  const vouched = await getVouchedIds(user.id, collaboratorIds);
  const trustById = new Map(incoming.map((k) => [k.id, k]));

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Knocks</h1>
        <p className="text-xs text-muted">People asking to build with you, with context, before any code lands.</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium">Daily limit</div>
          <div className="text-xs text-muted">
            {usedToday} of {user.knockCap} used today. Keep it low enough that you read every one.
          </div>
        </div>
        <CapControl cap={user.knockCap} />
      </div>

      <div className="flex items-center gap-1 bg-surface border border-border rounded-full p-1 text-sm w-fit mb-4">
        <Link
          href="/knocks"
          className={`px-3 py-1 rounded-full transition-colors ${!showSent ? "bg-accent-dim text-white" : "text-muted hover:text-foreground"}`}
        >
          Incoming{pending.length > 0 ? ` · ${pending.length}` : ""}
        </Link>
        <Link
          href="/knocks?tab=sent"
          className={`px-3 py-1 rounded-full transition-colors ${showSent ? "bg-accent-dim text-white" : "text-muted hover:text-foreground"}`}
        >
          Sent
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-muted text-sm">
          {showSent ? "You haven't knocked yet. Find a project on the home feed." : "No knocks yet. Post a project with what you're looking for."}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((k) => {
            const person = showSent ? k.to : k.from;
            const trust = showSent ? undefined : trustById.get(k.id);
            return (
              <div key={k.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-start gap-3">
                  <Link href={`/u/${person.username}`} className="shrink-0">
                    <Avatar src={person.avatar} name={person.name} size={40} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/u/${person.username}`} className="font-semibold text-sm hover:underline">
                        {person.name}
                      </Link>
                      <span className="text-xs text-muted">· {timeAgo(k.createdAt)} ago</span>
                      <span className={`ml-auto text-[11px] font-mono px-2 py-0.5 rounded-full border ${STATUS_STYLE[k.status]}`}>
                        {STATUS_LABEL[k.status]}
                      </span>
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {showSent ? "You knocked on " : "wants to join "}
                      <Link href={`/post/${k.project.id}`} className="text-purple-400 hover:underline">
                        {k.project.title}
                      </Link>
                    </div>
                    {trust && k.status === "PENDING" && trust.vouchCount > 0 && (
                      <div className="text-xs text-purple-300 mt-1">
                        ✦ Vouched for by {trust.vouchCount} {trust.vouchCount === 1 ? "person" : "people"}
                        {trust.knownVouchers.length > 0 && (
                          <span className="text-purple-400 font-medium"> · incl. {trust.knownVouchers.join(", ")}, who you know</span>
                        )}
                      </div>
                    )}
                    {k.via && (
                      <div className="text-xs text-up mt-1">
                        🤝 {showSent ? "Via" : "You both know"} {k.via.name}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed mt-2 border-l-2 border-accent-dim/60 pl-3">{k.message}</p>
                    {!showSent && k.status === "PENDING" && (
                      <div className="mt-3">
                        <KnockActions knockId={k.id} />
                      </div>
                    )}
                    {k.status === "ACCEPTED" && (
                      <div className="mt-3 flex items-center gap-3">
                        <VouchButton
                          targetId={person.id}
                          targetName={person.name}
                          project={k.project.title}
                          initialVouched={vouched.has(person.id)}
                        />
                        {!vouched.has(person.id) && (
                          <span className="text-xs text-muted">You built together. Vouch if it went well.</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

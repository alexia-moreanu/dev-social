"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { loadKnockContext, sendKnock } from "@/lib/actions";
import { KnockIcon } from "@/components/nav/icons";
import { MIN_KNOCK_LENGTH as MIN } from "@/lib/knock-rules";

type Status = "PENDING" | "ACCEPTED" | "DECLINED" | null;
type Context = NonNullable<Awaited<ReturnType<typeof loadKnockContext>>>;

export default function KnockButton({
  projectId,
  initialStatus,
}: {
  projectId: string;
  initialStatus: Status;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [open, setOpen] = useState(false);
  const [ctx, setCtx] = useState<Context | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [sending, startSending] = useTransition();

  if (status === "PENDING") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-yellow-400/90">
        <KnockIcon className="w-5 h-5" /> Knocked · waiting
      </span>
    );
  }
  if (status === "ACCEPTED") {
    return (
      <Link href="/messages" className="flex items-center gap-1.5 text-sm text-up">
        <KnockIcon className="w-5 h-5" /> You&apos;re in ✓
      </Link>
    );
  }

  function openDialog() {
    setOpen(true);
    setError(null);
    startLoading(async () => {
      setCtx(await loadKnockContext(projectId));
    });
  }

  function submit() {
    setError(null);
    startSending(async () => {
      const res = await sendKnock(projectId, message);
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      setStatus("PENDING");
      setOpen(false);
    });
  }

  const remaining = ctx ? Math.max(0, ctx.cap - ctx.usedToday) : null;
  const full = remaining === 0;
  const maintainer = ctx?.project.author;

  return (
    <>
      <button
        onClick={openDialog}
        className="flex items-center gap-1.5 rounded-full bg-up-dim/15 border border-up-dim/60 text-up px-3 py-1 text-sm font-medium hover:bg-up-dim/25 transition-colors"
      >
        <KnockIcon className="w-4 h-4" />
        {status === "DECLINED" ? "Knock again" : "Knock"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Knock on this project"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-xs font-mono text-up uppercase tracking-wider">Knock, don&apos;t cold-PR</div>
                <h3 className="font-semibold mt-0.5">{ctx?.project.title ?? "Loading…"}</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground text-xl leading-none">×</button>
            </div>

            {loading || !ctx ? (
              <div className="py-8 text-center text-sm text-muted">Finding your warm path…</div>
            ) : (
              <>
                {ctx.project.lookingFor && (
                  <div className="text-sm rounded-lg bg-accent-dim/10 border border-accent-dim/40 text-accent px-3 py-2 mb-3">
                    Looking for: {ctx.project.lookingFor}
                  </div>
                )}

                <div className="rounded-lg bg-background border border-border px-3 py-2.5 mb-3">
                  <div className="text-[11px] font-mono text-muted uppercase mb-1">Your path to {maintainer?.name}</div>
                  {ctx.path.direct ? (
                    <div className="text-sm text-up">You&apos;re already connected.</div>
                  ) : ctx.path.via ? (
                    <div className="text-sm">
                      <span className="text-foreground">you</span>
                      <span className="text-muted"> → </span>
                      <span className="text-up font-medium">{ctx.path.via.name}</span>
                      <span className="text-muted"> → </span>
                      <span className="text-foreground">{maintainer?.name}</span>
                      <div className={`text-xs mt-0.5 ${ctx.path.viaVouched ? "text-purple-300" : "text-muted"}`}>
                        {ctx.path.viaVouched
                          ? `${ctx.path.via.name} vouched for you. Your knock will show it.`
                          : `Your knock will show you both know ${ctx.path.via.name}.`}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted">No shared connections yet. Good context matters even more.</div>
                  )}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  disabled={full}
                  placeholder="Why this project, and what you'd take on. e.g. “I use kvlite at work and I'd like to take the tombstone GC issue.”"
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent-dim disabled:opacity-50"
                />
                <div className="flex items-center justify-between text-xs mt-1.5 mb-3">
                  <span className={message.trim().length >= MIN ? "text-up" : "text-muted"}>
                    {message.trim().length}/{MIN} characters of context
                  </span>
                  <span className={full ? "text-red-400" : "text-muted"}>
                    {full ? "Inbox full today" : `${remaining} of ${ctx.cap} knocks left today`}
                  </span>
                </div>

                {error && <div className="text-sm text-red-400 mb-3">{error}</div>}

                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-muted leading-snug">
                    {maintainer?.name} sets a daily limit, so every knock gets read.
                  </p>
                  <button
                    onClick={submit}
                    disabled={sending || full || message.trim().length < MIN}
                    className="shrink-0 rounded-full bg-up-dim text-white px-4 py-1.5 text-sm font-medium hover:bg-up transition-colors disabled:opacity-40"
                  >
                    {sending ? "Knocking…" : "Knock"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

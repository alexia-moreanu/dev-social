"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { vouchFor } from "@/lib/actions";
import { MIN_VOUCH_LENGTH as MIN } from "@/lib/knock-rules";

export default function VouchButton({
  targetId,
  targetName,
  project,
  initialVouched,
}: {
  targetId: string;
  targetName: string;
  project: string | null;
  initialVouched: boolean;
}) {
  const [vouched, setVouched] = useState(initialVouched);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (vouched) {
    return <span className="text-sm text-purple-400">✓ You vouched</span>;
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await vouchFor(targetId, note);
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      setVouched(true);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-purple-400/60 bg-purple-400/10 text-purple-300 px-3 py-1 text-sm font-medium hover:bg-purple-400/20 transition-colors"
      >
        Vouch
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`Vouch for ${targetName}`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-xs font-mono text-purple-400 uppercase tracking-wider">Vouch</div>
                <h3 className="font-semibold mt-0.5">Vouch for {targetName}</h3>
                {project && <div className="text-xs text-muted mt-0.5">You built together on {project}</div>}
              </div>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground text-xl leading-none">×</button>
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="What did they actually do? e.g. “Fuzzed our WAL recovery and found two crash bugs.”"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
            />
            <div className={`text-xs mt-1.5 mb-3 ${note.trim().length >= MIN ? "text-purple-400" : "text-muted"}`}>
              {note.trim().length}/{MIN} characters. Specific beats generic.
            </div>

            {error && <div className="text-sm text-red-400 mb-3">{error}</div>}

            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted leading-snug">
                Public on their profile. It makes their next knock warmer.
              </p>
              <button
                onClick={submit}
                disabled={pending || note.trim().length < MIN}
                className="shrink-0 rounded-full bg-purple-500 text-white px-4 py-1.5 text-sm font-medium hover:bg-purple-400 transition-colors disabled:opacity-40"
              >
                {pending ? "Vouching…" : "Vouch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

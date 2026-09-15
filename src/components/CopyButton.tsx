"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable, ignore
    }
  }

  return (
    <button
      onClick={onClick}
      className="rounded border border-border px-2 py-0.5 text-xs font-mono text-muted hover:text-accent hover:border-accent-dim transition-colors shrink-0"
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitPost } from "@/lib/actions";
import type { PostType } from "@prisma/client";

const TYPES: { value: PostType; label: string; hint: string }[] = [
  { value: "UPDATE", label: "update", hint: "A short text update — what you're working on, a thought, a rant." },
  { value: "SNIPPET", label: "snippet", hint: "A piece of code worth sharing." },
  { value: "TIP", label: "tip", hint: "A command or one-liner that makes life easier." },
  { value: "PROJECT", label: "project", hint: "Show off something you built, with a GitHub link." },
  { value: "CLIP", label: "clip", hint: "A short-form video (placeholder for the demo)." },
  { value: "LINK", label: "news", hint: "Share an article or link with your take on it." },
];

export default function SubmitForm() {
  const [type, setType] = useState<PostType>("PROJECT");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [command, setCommand] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [repoLang, setRepoLang] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [tags, setTags] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitPost({
        type,
        title: title || undefined,
        body: body || undefined,
        code: code || undefined,
        language: language || undefined,
        command: command || undefined,
        repoUrl: repoUrl || undefined,
        repoLang: repoLang || undefined,
        linkUrl: linkUrl || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      if (result?.id) router.push(`/post/${result.id}`);
    });
  }

  const active = TYPES.find((t) => t.value === type)!;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {TYPES.map((t) => (
          <button
            type="button"
            key={t.value}
            onClick={() => setType(t.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-mono border transition-colors ${
              type === t.value
                ? "border-accent-dim bg-accent-dim/10 text-accent"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted -mt-2">{active.hint}</p>

      {type !== "UPDATE" && (
        <Field label="title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="A short, descriptive title"
          />
        </Field>
      )}

      {type === "SNIPPET" && (
        <>
          <Field label="language">
            <input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input"
              placeholder="typescript, python, rust..."
            />
          </Field>
          <Field label="code">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={8}
              className="input font-mono text-sm"
              placeholder="Paste your snippet"
            />
          </Field>
        </>
      )}

      {type === "TIP" && (
        <Field label="command">
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            rows={3}
            className="input font-mono text-sm"
            placeholder="the command or one-liner"
          />
        </Field>
      )}

      {type === "PROJECT" && (
        <>
          <Field label="repo url">
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="input"
              placeholder="https://github.com/you/project"
            />
          </Field>
          <Field label="primary language">
            <input
              value={repoLang}
              onChange={(e) => setRepoLang(e.target.value)}
              className="input"
              placeholder="Rust, Python, TypeScript..."
            />
          </Field>
        </>
      )}

      {type === "LINK" && (
        <Field label="link url">
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="input"
            placeholder="https://..."
          />
        </Field>
      )}

      <Field label={type === "UPDATE" ? "what's up" : "commentary"}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="input"
          placeholder={type === "UPDATE" ? "What are you building today?" : "Add context, why it matters, how it works..."}
        />
      </Field>

      <Field label="tags (comma separated)">
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="input"
          placeholder="rust, databases, performance"
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-up-dim text-white px-4 py-2 text-sm font-mono font-medium hover:bg-up transition-colors disabled:opacity-50"
      >
        {pending ? "posting..." : "post it"}
      </button>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid var(--border);
          background: var(--background);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: var(--foreground);
        }
        .input:focus {
          outline: none;
          border-color: var(--accent-dim);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-mono text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}

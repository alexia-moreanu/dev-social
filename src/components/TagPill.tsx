import Link from "next/link";

export default function TagPill({ name }: { name: string }) {
  return (
    <Link
      href={`/?tag=${encodeURIComponent(name)}`}
      className="inline-block rounded-full bg-tag-bg text-muted hover:text-accent border border-border px-2 py-0.5 text-xs font-mono transition-colors"
    >
      #{name}
    </Link>
  );
}

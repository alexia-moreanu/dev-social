import Link from "next/link";
import { getFeedPosts, type SortMode } from "@/lib/posts";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import PostCard from "@/components/PostCard";

const SORTS: { value: SortMode; label: string }[] = [
  { value: "hot", label: "Hot" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
];

const FILTERS = [
  { value: undefined, label: "All" },
  { value: "TIP" as const, label: "Tips" },
  { value: "SNIPPET" as const, label: "Snippets" },
];

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; type?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const sort = (SORTS.find((s) => s.value === params.sort)?.value ?? "hot") as SortMode;
  const typeFilter = FILTERS.find((f) => f.value === params.type)?.value;
  const tag = params.tag;

  const user = await getCurrentUser();
  const [posts, topTags] = await Promise.all([
    getFeedPosts({
      sort,
      type: typeFilter,
      types: typeFilter ? undefined : ["TIP", "SNIPPET"],
      tag,
      currentUserId: user?.id,
    }),
    prisma.tag.findMany({
      where: { posts: { some: { post: { type: { in: ["TIP", "SNIPPET"] } } } } },
      include: { _count: { select: { posts: true } } },
      orderBy: { posts: { _count: "desc" } },
      take: 12,
    }),
  ]);

  function qs(next: Partial<{ sort: string; type: string; tag: string }>) {
    const p = new URLSearchParams();
    const merged = { sort, type: typeFilter, tag, ...next };
    if (merged.sort && merged.sort !== "hot") p.set("sort", merged.sort);
    if (merged.type) p.set("type", merged.type);
    if (merged.tag) p.set("tag", merged.tag);
    const s = p.toString();
    return s ? `/learn?${s}` : "/learn";
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Learn</h1>
        <p className="text-xs text-muted">Tips, one-liners, and code worth keeping.</p>
      </div>

      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-surface border border-border rounded-full p-1 text-sm">
          {FILTERS.map((f) => (
            <Link
              key={f.label}
              href={qs({ type: f.value })}
              className={`px-3 py-1 rounded-full transition-colors ${
                typeFilter === f.value ? "bg-accent-dim text-white" : "text-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-surface border border-border rounded-full p-1 text-sm">
          {SORTS.map((s) => (
            <Link
              key={s.label}
              href={qs({ sort: s.value })}
              className={`px-3 py-1 rounded-full transition-colors ${
                sort === s.value ? "bg-accent-dim text-white" : "text-muted hover:text-foreground"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-5">
        {topTags.map((t) => (
          <Link
            key={t.id}
            href={qs({ tag: tag === t.name ? undefined : t.name })}
            className={`rounded-full border px-2.5 py-1 text-xs font-mono transition-colors ${
              tag === t.name
                ? "border-accent-dim bg-accent-dim/10 text-accent"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            #{t.name}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-muted">
          Nothing here yet.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

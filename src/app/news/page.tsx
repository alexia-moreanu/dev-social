import { getFeedPosts, type SortMode } from "@/lib/posts";
import { getCurrentUser } from "@/lib/current-user";
import PostCard from "@/components/PostCard";
import Link from "next/link";

const SORTS: { value: SortMode; label: string }[] = [
  { value: "hot", label: "Hot" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
];

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort: sortParam } = await searchParams;
  const sort = (SORTS.find((s) => s.value === sortParam)?.value ?? "hot") as SortMode;
  const user = await getCurrentUser();
  const posts = await getFeedPosts({ sort, type: "LINK", currentUserId: user?.id });

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold">News</h1>
          <p className="text-xs text-muted">What developers are reading right now.</p>
        </div>
        <div className="flex items-center gap-1 bg-surface border border-border rounded-full p-1 text-sm">
          {SORTS.map((s) => (
            <Link
              key={s.label}
              href={`/news?sort=${s.value}`}
              className={`px-3 py-1 rounded-full transition-colors ${
                sort === s.value ? "bg-accent-dim text-white" : "text-muted hover:text-foreground"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-muted">
          No news posted yet.
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

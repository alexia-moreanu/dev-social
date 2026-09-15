import Link from "next/link";
import { getFeedPosts, type SortMode } from "@/lib/posts";
import { getCurrentUser } from "@/lib/current-user";
import PostCard from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import Stories from "@/components/Stories";

const SORTS: { value: SortMode; label: string }[] = [
  { value: "hot", label: "Hot" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
  { value: "for-you", label: "For you" },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; tag?: string; following?: string }>;
}) {
  const params = await searchParams;
  const sort = (SORTS.find((s) => s.value === params.sort)?.value ?? "hot") as SortMode;
  const tag = params.tag;
  const followingOnly = params.following === "1";

  const user = await getCurrentUser();

  const posts = await getFeedPosts({
    sort,
    tag,
    followingOf: followingOnly ? user?.id : undefined,
    currentUserId: user?.id,
  });

  function withParam(key: "sort" | "following", value: string | undefined) {
    const current: Record<string, string> = {};
    if (sort !== "hot") current.sort = sort;
    if (tag) current.tag = tag;
    if (followingOnly) current.following = "1";

    if (value) current[key] = value;
    else delete current[key];

    const p = new URLSearchParams(current);
    const qs = p.toString();
    return qs ? `/?${qs}` : "/";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-8">
      <div className="min-w-0 max-w-xl w-full mx-auto lg:mx-0">
        <Stories />

        {tag && (
          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className="text-muted">filtering by</span>
            <span className="rounded-full bg-tag-bg border border-border px-2 py-0.5 font-mono text-accent">
              #{tag}
            </span>
            <Link href="/" className="text-muted hover:text-foreground underline">
              clear
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-1 bg-surface border border-border rounded-full p-1 text-sm">
            {SORTS.map((s) => (
              <Link
                key={s.label}
                href={withParam("sort", s.value)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  sort === s.value ? "bg-accent-dim text-white" : "text-muted hover:text-foreground"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
          <Link
            href={withParam("following", followingOnly ? "" : "1")}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors shrink-0 ${
              followingOnly
                ? "border-accent-dim bg-accent-dim/10 text-accent"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            Following
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center text-muted">
            Nothing here yet.{" "}
            {followingOnly ? (
              <>Follow some devs, or check the &quot;devs like you&quot; panel.</>
            ) : (
              <>Be the first to post.</>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      <div className="hidden lg:block">
        <Sidebar currentUserId={user?.id} />
      </div>
    </div>
  );
}

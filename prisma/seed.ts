import { PrismaClient, Prisma, PostType } from "@prisma/client";

const prisma = new PrismaClient();

function avatar(seed: string) {
  return `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(seed)}`;
}

function poster(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/480/854`;
}

const USERS = [
  { username: "mira_k", name: "Mira Kowalski", bio: "Rust nerd. Building a database from scratch for fun.", githubUrl: "https://github.com/mirak", tags: ["rust", "databases", "performance", "systems"] },
  { username: "devondavis", name: "Devon Davis", bio: "Frontend @ a startup nobody's heard of yet. Tailwind maximalist.", githubUrl: "https://github.com/devondavis", tags: ["frontend", "typescript", "webdev", "css"] },
  { username: "priya.codes", name: "Priya Nair", bio: "ML engineer. I make models say numbers.", githubUrl: "https://github.com/priyanair", tags: ["ai-ml", "python", "data"] },
  { username: "kwstas", name: "Kostas Papadopoulos", bio: "Backend, distributed systems, on-call survivor.", githubUrl: "https://github.com/kwstas", tags: ["backend", "go", "distributed-systems", "devops"] },
  { username: "yuki.term", name: "Yuki Tanaka", bio: "Neovim config is my real personality trait.", githubUrl: "https://github.com/yukiterm", tags: ["neovim", "terminal", "cli", "productivity"] },
  { username: "sam_builds", name: "Sam Whitfield", bio: "Indie hacker. Shipping something new every month, finishing none of it.", githubUrl: "https://github.com/samwhitfield", tags: ["indie-hacking", "webdev", "javascript"] },
  { username: "ada.sec", name: "Ada Chen", bio: "Security researcher. I break things so you don't have to.", githubUrl: "https://github.com/adachen", tags: ["security", "python", "cli"] },
  { username: "leo_infra", name: "Leo Martins", bio: "Kubernetes whisperer. Docker before it was cool, tired now.", githubUrl: "https://github.com/leomartins", tags: ["devops", "kubernetes", "docker", "homelab"] },
  { username: "nadia.rb", name: "Nadia Osei", bio: "Ruby on Rails since 2012. Yes it's still good actually.", githubUrl: "https://github.com/nadiaosei", tags: ["ruby", "backend", "webdev"] },
  { username: "theo_zig", name: "Theo Brandt", bio: "Writing Zig, complaining about C, occasionally shipping.", githubUrl: "https://github.com/theobrandt", tags: ["systems", "performance", "zig"] },
  { username: "hana_swift", name: "Hana Suzuki", bio: "iOS dev. SwiftUI convert. Building a habit tracker nobody asked for.", githubUrl: "https://github.com/hanasuzuki", tags: ["swift", "mobile", "indie-hacking"] },
  { username: "marcus.db", name: "Marcus Johnson", bio: "Postgres evangelist. Ask me about indexes, I will not stop talking.", githubUrl: "https://github.com/marcusjohnson", tags: ["databases", "sql", "backend"] },
  { username: "ren_ai", name: "Ren Fischer", bio: "AI agents, LLM tooling, prompt spelunking.", githubUrl: "https://github.com/renfischer", tags: ["ai-ml", "python", "devtools"] },
  { username: "olivia.rs", name: "Olivia Bennett", bio: "Compilers and type systems. I think in ASTs.", githubUrl: "https://github.com/oliviabennett", tags: ["rust", "systems", "programming-languages"] },
];

const TAGS = [
  "rust", "typescript", "javascript", "python", "go", "ruby", "swift", "zig", "sql",
  "webdev", "frontend", "backend", "css", "databases", "performance", "security",
  "devops", "docker", "kubernetes", "homelab", "cli", "terminal", "neovim",
  "productivity", "ai-ml", "data", "indie-hacking", "mobile", "systems",
  "distributed-systems", "devtools", "programming-languages",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}
function daysAgo(d: number) {
  return new Date(Date.now() - d * 86400000 - Math.random() * 86400000);
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating tags...");
  const tagRecords = await Promise.all(
    TAGS.map((name) => prisma.tag.create({ data: { name } }))
  );
  const tagByName = new Map(tagRecords.map((t) => [t.name, t]));

  console.log("Creating users...");
  const users = await Promise.all(
    USERS.map((u) =>
      prisma.user.create({
        data: {
          username: u.username,
          name: u.name,
          bio: u.bio,
          githubUrl: u.githubUrl,
          avatar: avatar(u.username),
        },
      })
    )
  );
  const userByUsername = new Map(users.map((u) => [u.username, u]));
  const userTags = new Map(USERS.map((u) => [u.username, u.tags]));

  console.log("Creating follows...");
  for (const u of users) {
    const others = users.filter((o) => o.id !== u.id);
    const myTags = new Set(userTags.get(u.username));
    const scored = others
      .map((o) => {
        const otherTags = new Set(userTags.get(o.username));
        let overlap = 0;
        myTags.forEach((t) => { if (otherTags.has(t as string)) overlap++; });
        return { o, overlap: overlap + Math.random() };
      })
      .sort((a, b) => b.overlap - a.overlap);
    const toFollow = scored.slice(0, 3 + Math.floor(Math.random() * 3));
    for (const { o } of toFollow) {
      await prisma.follow.create({
        data: { followerId: u.id, followingId: o.id },
      }).catch(() => {});
    }
  }

  type PostSeed = {
    type: PostType;
    author: string;
    title?: string;
    body?: string;
    code?: string;
    language?: string;
    command?: string;
    repoUrl?: string;
    repoStars?: number;
    repoLang?: string;
    videoUrl?: string;
    posterSeed?: string;
    linkUrl?: string;
    linkDomain?: string;
    tags: string[];
    age: number;
  };

  const posts: PostSeed[] = [
    {
      type: "PROJECT", author: "mira_k", title: "kvlite — a tiny embedded KV store in Rust",
      body: "Been building this for a few weekends. LSM-tree based, no deps, ~2k LOC. Benchmarks beat sled for write-heavy workloads on my machine. Would love eyes on the compaction logic.",
      repoUrl: "https://github.com/mirak/kvlite", repoStars: 342, repoLang: "Rust",
      tags: ["rust", "databases", "performance", "systems"], age: 1,
    },
    {
      type: "TIP", author: "yuki.term", title: "Stop typing `cd ..` a hundred times a day",
      command: "alias ..=\"cd ..\"\nalias ...=\"cd ../..\"\nalias ....=\"cd ../../..\"",
      body: "Put this in your .zshrc. Embarrassing how much time this has saved me. Bonus: `z` (zoxide) if you want it to learn your habits.",
      tags: ["cli", "productivity", "terminal"], age: 2,
    },
    {
      type: "SNIPPET", author: "devondavis", title: "One-liner to debounce anything in TS, no lodash",
      language: "typescript",
      code: `function debounce<T extends (...args: any[]) => void>(fn: T, ms = 250) {\n  let t: ReturnType<typeof setTimeout>;\n  return (...args: Parameters<T>) => {\n    clearTimeout(t);\n    t = setTimeout(() => fn(...args), ms);\n  };\n}`,
      body: "Pulled this out of a project instead of installing a dependency for one function. Fully typed, zero deps.",
      tags: ["typescript", "frontend", "webdev"], age: 3,
    },
    {
      type: "LINK", author: "ren_ai", title: "Why local-first LLM tooling is finally catching up to the cloud",
      linkUrl: "https://example-tech-news.dev/local-first-llm-2026", linkDomain: "example-tech-news.dev",
      body: "Good overview of the quantization + hardware progress this year. The section on structured output reliability is the most interesting part.",
      tags: ["ai-ml", "devtools"], age: 1,
    },
    {
      type: "CLIP", author: "hana_swift", title: "60 seconds: SwiftUI matched geometry effect for card transitions",
      videoUrl: "clip", posterSeed: "hana-swiftui-clip",
      body: "Recorded this because I couldn't find a clean example anywhere. Full code in the repo linked in my profile.",
      tags: ["swift", "mobile"], age: 4,
    },
    {
      type: "UPDATE", author: "sam_builds", title: undefined,
      body: "Day 47 of building in public: shipped auth, broke auth, fixed auth, went to bed at 2am. This is the way I guess.",
      tags: ["indie-hacking", "webdev"], age: 0,
    },
    {
      type: "PROJECT", author: "leo_infra", title: "homelab-gitops — my entire homelab defined in one repo",
      body: "ArgoCD + k3s + a pile of Raspberry Pis. Push to main, cluster reconciles. Includes the Grafana dashboards I actually use, not the demo ones.",
      repoUrl: "https://github.com/leomartins/homelab-gitops", repoStars: 891, repoLang: "YAML",
      tags: ["devops", "kubernetes", "homelab", "docker"], age: 5,
    },
    {
      type: "TIP", author: "ada.sec", title: "Check if a binary phones home before you run it",
      command: "strace -f -e trace=network ./suspicious-binary",
      body: "Not foolproof but catches a surprising amount of lazy telemetry and worse. Pair with a firewall rule that logs-and-drops if you want to be thorough.",
      tags: ["security", "cli"], age: 2,
    },
    {
      type: "SNIPPET", author: "marcus.db", title: "The Postgres index you're missing on every `created_at DESC` query",
      language: "sql",
      code: `CREATE INDEX CONCURRENTLY idx_events_created_at_desc\n  ON events (created_at DESC)\n  INCLUDE (id, type);`,
      body: "INCLUDE turns this into a covering index for the common 'latest N events' query — no heap fetch. Made a dashboard query go from 800ms to 12ms.",
      tags: ["sql", "databases", "performance"], age: 6,
    },
    {
      type: "LINK", author: "olivia.rs", title: "A gentle introduction to how borrow checkers actually work",
      linkUrl: "https://plt-notes.example.org/borrow-checkers-explained", linkDomain: "plt-notes.example.org",
      body: "Best mental model I've read for why the borrow checker rejects code that 'looks fine.' Wish this existed when I was learning Rust.",
      tags: ["rust", "programming-languages", "systems"], age: 3,
    },
    {
      type: "PROJECT", author: "priya.codes", title: "tinyrag — RAG pipeline in <300 lines, no framework",
      body: "Got tired of pulling in a huge framework for a simple retrieval pipeline. This is chunking + embeddings + cosine sim + a prompt template. Good for learning how RAG actually works under the hood.",
      repoUrl: "https://github.com/priyanair/tinyrag", repoStars: 1204, repoLang: "Python",
      tags: ["ai-ml", "python", "data"], age: 7,
    },
    {
      type: "UPDATE", author: "kwstas", title: undefined,
      body: "PSA: if your retry logic doesn't have jitter, you don't have retry logic, you have a coordinated DDoS against yourself. Ask me how I know.",
      tags: ["backend", "distributed-systems"], age: 1,
    },
    {
      type: "TIP", author: "nadia.rb", title: "Rails console trick I use constantly",
      command: "bin/rails console --sandbox",
      body: "Everything you do gets rolled back on exit. I use this for 90% of my 'let me just check something in prod-like data' moments.",
      tags: ["ruby", "backend", "productivity"], age: 4,
    },
    {
      type: "SNIPPET", author: "theo_zig", title: "Zig comptime for a zero-cost unit-checked type",
      language: "zig",
      code: `fn Meters(comptime T: type) type {\n    return struct { value: T };\n}\nfn add(a: Meters(f64), b: Meters(f64)) Meters(f64) {\n    return .{ .value = a.value + b.value };\n}`,
      body: "No runtime cost, and the compiler stops you from adding meters to seconds. This is the kind of thing that sold me on Zig.",
      tags: ["zig", "systems", "performance"], age: 5,
    },
    {
      type: "CLIP", author: "devondavis", title: "CSS-only accordion, no JS, 40 seconds",
      videoUrl: "clip", posterSeed: "devon-css-clip",
      body: "Using the newer `:has()` selector. Browser support is finally good enough to ship this.",
      tags: ["css", "frontend", "webdev"], age: 2,
    },
    {
      type: "PROJECT", author: "yuki.term", title: "dotfiles — my neovim config, now with LSP for 14 languages",
      body: "Rebuilt this from scratch after my old config became unmaintainable spaghetti. Lazy-loaded, sub-50ms startup. Readme has a full breakdown of every plugin and why it's there.",
      repoUrl: "https://github.com/yukiterm/dotfiles", repoStars: 2033, repoLang: "Lua",
      tags: ["neovim", "terminal", "cli", "productivity"], age: 8,
    },
    {
      type: "LINK", author: "leo_infra", title: "Kubernetes 1.34 changelog: the sleeper feature nobody's talking about",
      linkUrl: "https://k8s-watch.example.net/1-34-sleeper-feature", linkDomain: "k8s-watch.example.net",
      body: "The in-place resource resize going stable is bigger than it sounds if you've ever had to evict a pod just to bump its memory limit.",
      tags: ["kubernetes", "devops"], age: 3,
    },
    {
      type: "TIP", author: "ren_ai", title: "Force an LLM to actually follow your JSON schema",
      command: "response_format={\"type\": \"json_schema\", \"json_schema\": {...}, \"strict\": true}",
      body: "Skip the 'please respond only in valid JSON' prompt begging. Constrained decoding with strict mode has made my parsing error rate basically zero.",
      tags: ["ai-ml", "devtools"], age: 1,
    },
    {
      type: "SNIPPET", author: "kwstas", title: "Context-aware retry with jitter in Go, copy-paste ready",
      language: "go",
      code: `func retry(ctx context.Context, attempts int, base time.Duration, fn func() error) error {\n  var err error\n  for i := 0; i < attempts; i++ {\n    if err = fn(); err == nil { return nil }\n    jitter := time.Duration(rand.Int63n(int64(base)))\n    select {\n    case <-time.After(base + jitter):\n    case <-ctx.Done():\n      return ctx.Err()\n    }\n    base *= 2\n  }\n  return err\n}`,
      body: "Following up on my earlier rant — here's the actual function I use. Full jitter, exponential backoff, context-cancellable.",
      tags: ["go", "backend", "distributed-systems"], age: 1,
    },
    {
      type: "PROJECT", author: "ada.sec", title: "leakscan — grep your codebase for secrets before you commit them",
      body: "Pre-commit hook + CLI. Entropy-based detection plus known-pattern matching for ~40 provider key formats. Runs in under 200ms on a mid-size repo.",
      repoUrl: "https://github.com/adachen/leakscan", repoStars: 567, repoLang: "Python",
      tags: ["security", "python", "cli", "devtools"], age: 9,
    },
    {
      type: "UPDATE", author: "hana_swift", title: undefined,
      body: "Apple reviewers rejected my app for 'insufficient functionality.' The app is a habit tracker. I have never felt more attacked.",
      tags: ["mobile", "swift", "indie-hacking"], age: 2,
    },
    {
      type: "SNIPPET", author: "olivia.rs", title: "A macro that makes exhaustive enum matching a compile error if you forget a case",
      language: "rust",
      code: `macro_rules! exhaustive_match {\n    ($val:expr, $($pat:pat => $res:expr),+ $(,)?) => {\n        match $val {\n            $($pat => $res,)+\n        }\n    };\n}`,
      body: "Not magic — this just leans on Rust's own exhaustiveness check — but wrapping it like this makes the intent explicit at call sites.",
      tags: ["rust", "programming-languages"], age: 6,
    },
    {
      type: "LINK", author: "marcus.db", title: "Postgres 18's async I/O: benchmarks from a real production migration",
      linkUrl: "https://db-internals.example.com/pg18-async-io-prod", linkDomain: "db-internals.example.com",
      body: "30% throughput improvement on their read-heavy OLTP workload just from the upgrade, no query changes. Worth reading the 'what didn't improve' section too.",
      tags: ["databases", "sql", "performance"], age: 4,
    },
    {
      type: "TIP", author: "sam_builds", title: "The only pricing-page trick that's actually moved my conversion",
      body: "Anchor with a price nobody picks. Added a 'Team' tier way above what anyone needs and my 'Pro' tier conversions went up 18%. Classic, but it works.",
      tags: ["indie-hacking", "webdev"], age: 5,
    },
    {
      type: "CLIP", author: "priya.codes", title: "Watching a tiny neural net learn XOR in real time",
      videoUrl: "clip", posterSeed: "priya-xor-clip",
      body: "Made this for a talk, but it's oddly satisfying on its own. Loss curve + decision boundary rendered live.",
      tags: ["ai-ml", "python"], age: 3,
    },
    {
      type: "SNIPPET", author: "nadia.rb", title: "Rails: a scope that actually reads like English",
      language: "ruby",
      code: `scope :recent, -> { where("created_at > ?", 1.week.ago) }\nscope :published, -> { where(published: true) }\n# Post.published.recent.order(created_at: :desc)`,
      body: "Small thing but composable scopes are one of the reasons I've stuck with Rails for over a decade.",
      tags: ["ruby", "backend"], age: 7,
    },
    {
      type: "PROJECT", author: "theo_zig", title: "ziglet — a tiny HTTP server in Zig, zero allocations on the hot path",
      body: "Learning project that got out of hand. ~4k req/s single-threaded on my laptop with zero heap allocations per request. Not production ready, very much a learning exercise.",
      repoUrl: "https://github.com/theobrandt/ziglet", repoStars: 233, repoLang: "Zig",
      tags: ["zig", "systems", "performance"], age: 10,
    },
    {
      type: "UPDATE", author: "olivia.rs", title: undefined,
      body: "Spent 3 hours today making an error message 2 lines shorter and more accurate. No regrets. This is the job.",
      tags: ["rust", "programming-languages"], age: 0,
    },
    {
      type: "TIP", author: "leo_infra", title: "See exactly why your pod got OOMKilled",
      command: "kubectl get pod <name> -o jsonpath='{.status.containerStatuses[0].lastState.terminated}'",
      body: "Saves you from squinting at `kubectl describe` output. Straight to the terminated-state JSON with exit code and reason.",
      tags: ["kubernetes", "devops", "cli"], age: 6,
    },
    {
      type: "LINK", author: "ada.sec", title: "A supply-chain attack hid inside a typosquatted CLI tool for 8 months",
      linkUrl: "https://sec-weekly.example.com/typosquat-cli-postmortem", linkDomain: "sec-weekly.example.com",
      body: "The detection method in the postmortem — diffing published package hashes against the git tag — is something more projects should just do by default.",
      tags: ["security", "devtools"], age: 2,
    },
    {
      type: "SNIPPET", author: "devondavis", title: "CSS `:has()` to style a form field based on its own error state, no JS",
      language: "css",
      code: `.field:has(input:invalid:not(:placeholder-shown)) label {\n  color: var(--error);\n}`,
      body: "Been slowly replacing JS validation-state classes with pure CSS selectors. This one still surprises people when I show it.",
      tags: ["css", "frontend"], age: 8,
    },
    {
      type: "PROJECT", author: "ren_ai", title: "promptdiff — git diff, but for prompt template changes and their eval scores",
      body: "Every time we tweak a system prompt we lose track of whether it actually helped. This tracks prompt versions against a fixed eval set and shows you the delta.",
      repoUrl: "https://github.com/renfischer/promptdiff", repoStars: 678, repoLang: "Python",
      tags: ["ai-ml", "devtools", "python"], age: 4,
    },
    {
      type: "UPDATE", author: "mira_k", title: undefined,
      body: "Finally found the bug. It was a signed/unsigned comparison in a loop bound. Three days. I am at peace with nothing.",
      tags: ["rust", "systems"], age: 3,
    },
    {
      type: "TIP", author: "marcus.db", title: "Find your slowest Postgres queries without installing anything extra",
      command: "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;",
      body: "pg_stat_statements is usually already available, just needs enabling in shared_preload_libraries. No APM tool required for a first pass.",
      tags: ["sql", "databases", "performance"], age: 9,
    },
    {
      type: "CLIP", author: "yuki.term", title: "My terminal setup in 60 seconds — tmux + neovim + fzf",
      videoUrl: "clip", posterSeed: "yuki-terminal-clip",
      body: "Gets asked about this constantly so finally recorded it. Config link in bio.",
      tags: ["terminal", "neovim", "cli", "productivity"], age: 12,
    },
    {
      type: "LINK", author: "kwstas", title: "Why your load balancer's health check is lying to you",
      linkUrl: "https://distsys-weekly.example.io/health-check-lies", linkDomain: "distsys-weekly.example.io",
      body: "The distinction between liveness and readiness checks in the article is the thing most teams get wrong, in my experience on-call.",
      tags: ["distributed-systems", "devops", "backend"], age: 5,
    },
    {
      type: "SNIPPET", author: "hana_swift", title: "SwiftUI: a reusable loading-state wrapper view",
      language: "swift",
      code: `enum LoadState<T> { case loading, loaded(T), failed(Error) }\n\nstruct LoadingView<T, Content: View>: View {\n  let state: LoadState<T>\n  let content: (T) -> Content\n  var body: some View {\n    switch state {\n    case .loading: ProgressView()\n    case .loaded(let v): content(v)\n    case .failed(let e): Text(e.localizedDescription)\n    }\n  }\n}`,
      body: "Stopped writing this from scratch in every view. Generic enough to cover most of my screens now.",
      tags: ["swift", "mobile"], age: 6,
    },
    {
      type: "PROJECT", author: "nadia.rb", title: "rails-audit-log — polymorphic audit trail for any model, 5-minute setup",
      body: "Wanted 'who changed what and when' on a few models without pulling in a heavy gem. This is ~150 lines and a migration.",
      repoUrl: "https://github.com/nadiaosei/rails-audit-log", repoStars: 156, repoLang: "Ruby",
      tags: ["ruby", "backend", "webdev"], age: 11,
    },
    {
      type: "UPDATE", author: "theo_zig", title: undefined,
      body: "Someone asked why I'm 'still' writing Zig instead of Rust. Different tools for different jobs. Also I like the pain, apparently.",
      tags: ["zig", "systems"], age: 4,
    },
    {
      type: "TIP", author: "priya.codes", title: "Cap your token spend during dev without changing code",
      command: "export ANTHROPIC_MAX_TOKENS=512  # sanity-cap responses while iterating on a prompt",
      body: "Small thing, saved me from a few embarrassing bill spikes while iterating quickly on prompts in a loop.",
      tags: ["ai-ml", "productivity"], age: 1,
    },
    {
      type: "LINK", author: "theo_zig", title: "The case for writing your next CLI tool in Zig instead of Go or Rust",
      linkUrl: "https://systems-corner.example.dev/zig-for-clis", linkDomain: "systems-corner.example.dev",
      body: "Don't fully agree with the conclusion but the binary size and startup time comparisons are genuinely compelling data.",
      tags: ["zig", "cli", "systems"], age: 7,
    },
    {
      type: "SNIPPET", author: "ada.sec", title: "Constant-time string comparison, because == will leak timing info",
      language: "python",
      code: `import hmac\n\ndef safe_equals(a: str, b: str) -> bool:\n    return hmac.compare_digest(a.encode(), b.encode())`,
      body: "Seen this exact bug in three separate code reviews this year — comparing API keys or tokens with a plain `==`. Use the stdlib function.",
      tags: ["security", "python"], age: 3,
    },
    {
      type: "PROJECT", author: "olivia.rs", title: "littlelang — a toy language with a Hindley-Milner type checker, for learning",
      body: "Built this to actually understand type inference instead of just reading about it. Includes a walkthrough doc explaining every step of unification.",
      repoUrl: "https://github.com/oliviabennett/littlelang", repoStars: 445, repoLang: "Rust",
      tags: ["rust", "programming-languages", "systems"], age: 13,
    },
  ];

  console.log("Creating posts...");
  for (const p of posts) {
    const author = userByUsername.get(p.author)!;
    const data: Prisma.PostCreateInput = {
      type: p.type,
      author: { connect: { id: author.id } },
      title: p.title,
      body: p.body,
      code: p.code,
      language: p.language,
      command: p.command,
      repoUrl: p.repoUrl,
      repoStars: p.repoStars,
      repoLang: p.repoLang,
      linkUrl: p.linkUrl,
      linkDomain: p.linkDomain,
      createdAt: daysAgo(p.age),
    };
    if (p.videoUrl) {
      data.videoUrl = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
      data.poster = poster(p.posterSeed ?? p.author);
    }
    const post = await prisma.post.create({ data });

    await Promise.all(
      p.tags.map((tagName) => {
        const tag = tagByName.get(tagName);
        if (!tag) return null;
        return prisma.postTag.create({ data: { postId: post.id, tagId: tag.id } });
      }).filter((p): p is NonNullable<typeof p> => p !== null)
    );

    // votes: bias toward users whose tags overlap with the post's tags
    const postTagSet = new Set(p.tags);
    for (const voter of users) {
      if (voter.id === author.id) continue;
      const voterTags = new Set(userTags.get(voter.username));
      let overlap = 0;
      postTagSet.forEach((t) => { if (voterTags.has(t)) overlap++; });
      const chance = 0.08 + overlap * 0.18;
      if (Math.random() < chance) {
        await prisma.vote.create({ data: { userId: voter.id, postId: post.id } }).catch(() => {});
      }
    }

    // comments
    const commenters = pickN(users.filter((u) => u.id !== author.id), Math.random() < 0.6 ? 1 + Math.floor(Math.random() * 3) : 0);
    const commentBank = [
      "This is exactly what I needed today, thank you.",
      "Wait, this is really clever. Stealing this.",
      "Have you benchmarked this against the standard approach?",
      "Following the repo, this looks great.",
      "How does this handle the edge case where it's empty?",
      "Underrated post. More people need to see this.",
      "I did something similar but ran into issues with concurrency — did you hit that?",
      "Saving this for later, solid writeup.",
      "Curious what made you choose this over the more common approach.",
      "This just saved me probably an hour of debugging.",
    ];
    let firstComment: { id: string } | null = null;
    for (const c of commenters) {
      const created = await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: c.id,
          body: pick(commentBank),
          createdAt: daysAgo(Math.max(0, p.age - Math.random())),
        },
      });
      if (!firstComment) firstComment = created;
      // occasional reply
      if (firstComment && created.id !== firstComment.id && Math.random() < 0.3) {
        await prisma.comment.create({
          data: {
            postId: post.id,
            authorId: author.id,
            parentId: firstComment.id,
            body: pick(["Appreciate it!", "Good question — yes, handled in the linked repo.", "Thanks for reading!", "Totally fair point."]),
            createdAt: daysAgo(Math.max(0, p.age - Math.random())),
          },
        });
      }
    }
  }

  console.log("Creating conversations...");
  const exchanges: { a: string; b: string; lines: [string, string][] }[] = [
    {
      a: "mira_k", b: "olivia.rs",
      lines: [
        ["mira_k", "saw your borrow-checker post, sending it to everyone on my team"],
        ["olivia.rs", "ha, glad it's useful. are you still fighting that compaction bug?"],
        ["mira_k", "found it. off-by-one in the tombstone GC. classic."],
        ["olivia.rs", "always is. nice work on kvlite btw, benchmarks looked great"],
      ],
    },
    {
      a: "devondavis", b: "sam_builds",
      lines: [
        ["sam_builds", "your css accordion clip is exactly what I need for the pricing page"],
        ["devondavis", "steal it, no attribution needed lol"],
        ["sam_builds", "appreciated. how's the :has() browser support looking these days"],
        ["devondavis", "good enough to ship, I stopped worrying about the last 2%"],
      ],
    },
    {
      a: "ada.sec", b: "ren_ai",
      lines: [
        ["ren_ai", "the leakscan entropy detection — would that catch a leaked API key inside a prompt template?"],
        ["ada.sec", "yeah if it's high enough entropy, but templates with placeholders can false-negative"],
        ["ren_ai", "makes sense. might wire it into promptdiff's CI check"],
      ],
    },
    {
      a: "yuki.term", b: "leo_infra",
      lines: [
        ["leo_infra", "your neovim startup time is making me self-conscious about my config"],
        ["yuki.term", "50ms is achievable, just lazy-load everything that isn't the colorscheme"],
        ["leo_infra", "sending you my config for a roast later"],
        ["yuki.term", "looking forward to it"],
      ],
    },
    {
      a: "priya.codes", b: "marcus.db",
      lines: [
        ["marcus.db", "tinyrag's cosine sim step — are you doing it in-db or pulling everything into python?"],
        ["priya.codes", "python for now, in-db once the corpus gets big enough to matter"],
        ["marcus.db", "pgvector would get you there without much rework"],
      ],
    },
  ];

  for (const ex of exchanges) {
    const userA = userByUsername.get(ex.a)!;
    const userB = userByUsername.get(ex.b)!;
    const conversation = await prisma.conversation.create({ data: {} });
    await prisma.conversationParticipant.createMany({
      data: [
        { conversationId: conversation.id, userId: userA.id },
        { conversationId: conversation.id, userId: userB.id },
      ],
    });
    let t = ex.lines.length;
    for (const [sender, body] of ex.lines) {
      const senderUser = userByUsername.get(sender)!;
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          authorId: senderUser.id,
          body,
          createdAt: new Date(Date.now() - t * 3600_000),
        },
      });
      t -= 1;
    }
  }

  console.log(`Seeded ${users.length} users, ${tagRecords.length} tags, ${posts.length} posts, ${exchanges.length} conversations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

# dev/social

**Meet before the pull request.** A social layer for developers to show their
work, find people through people, and ask to join projects with context
instead of cold pull requests.

## ▶ Start here: the pitch deck

**[View the 5-slide deck → alexia-moreanu.github.io/dev-social](https://alexia-moreanu.github.io/dev-social/)**

| Slide | What it covers |
|---|---|
| 1 · The insight | AI made code cheap and trust expensive: merged PRs on GitHub went from 25M to 90M a month, and maintainers can now switch PRs off |
| 2 · User & pain | The solo builder, a journey that leaks at every step, and why people join people |
| 3 · Market & strategy | The empty corner where proof of work meets a social graph, and why Google |
| 4 · Solution & MVP | One loop (Show → Find → Knock → Build → Vouch), priorities, and what I cut on purpose |
| 5 · GTM, metrics & risks | Phased rollout with gates, North Star, counter-metrics, and risks |

Use ← → to navigate, **N** for speaker notes, **P** to save as PDF.
Tell me where it breaks: **[give feedback](https://github.com/alexia-moreanu/dev-social/issues/new?template=feedback.yml)**.

## The prototype

A working Next.js app that implements the core loop from the deck.

- **Knock** (`/knocks`), the core idea. Instead of a cold PR, you ask to join
  a project with at least 40 characters of context. The dialog shows your warm
  path to the maintainer ("you → Ada → Mira") and how many knocks they have
  left today. Maintainers set their own daily limit, then **Let in** (which
  opens a DM seeded with your knock) or **Not now**.
- **Vouch**: once you've built together (a knock was let in), either side can
  vouch for the other with a note on what they actually did. Vouches show on
  profiles, rank vouched-for knocks higher in a maintainer's inbox (especially
  vouches from people the maintainer knows), count as ties for warm paths, and
  appear as purple edges on the Web graph.
- **Home** (`/`): one feed of projects (with GitHub repo card and "looking
  for" ask), code snippets, tips, 60s clips, links, and updates. Sort by
  Hot / New / Top / **For You**.
- **Web** (`/web`): your social graph as a force-directed node graph, inspired
  by Obsidian. Dashed edges show people you're similar to but not yet connected with.
- **Reels** (`/reels`), **Learn** (`/learn`), **News** (`/news`),
  **Messages** (`/messages`).

For You, "devs like you", "projects for you", and the Web's similarity edges
all come from one recommendation model: a tag-affinity vector per user built
from what they post, like, and comment on, compared by cosine similarity.

### Run it locally

```bash
npm install
npm run seed   # 14 demo users, ~45 posts, follows, DMs, knocks, and vouches
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). There's no auth yet:
use **switch user** in the nav to act as any demo user. Try switching to
`mira_k` to answer knocks on her project, then to another user to send one.

### Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- Prisma + SQLite locally (point the `datasource` in
  [`prisma/schema.prisma`](prisma/schema.prisma) at Postgres for production)
- `d3-force` for the graph layout

### Project structure

- `docs/index.html`: the pitch deck (served by GitHub Pages)
- `prisma/schema.prisma`: data model, including `Knock`
- `src/lib/knocks.ts`: warm-path lookup, daily cap, trust-ranked knock inbox
- `src/lib/vouches.ts`: who can vouch (collaboration check) and vouch queries
- `src/lib/affinity.ts`: the recommendation model
- `src/lib/graph.ts`: node/edge data for the Web graph
- `src/lib/actions.ts`: server actions (knock, vote, comment, follow, post, messages)
- `src/components/KnockButton.tsx`: the knock dialog
- `src/app/`: routes

### Not built yet

GitHub verification of merges (today a vouch unlocks after a knock is let in),
real auth, video upload (clips use placeholder media), and live GitHub repo stats.

# dev/social

Social media built for developers, in the age of AI — Twitter's brevity, Reddit's
threads, GitHub's context, Instagram's visual feel, and Hacker News' trust in
substance over polish, in one app.

## Surfaces

- **Home** (`/`) — one feed, six kinds of posts: **project** (GitHub-style repo
  card), **snippet** (syntax highlighted code), **tip** (copy-to-clipboard
  command), **clip** (short-form video), **link** (news, with your commentary),
  **update** (short text). Story circles up top, Hot/New/Top/**For You**
  sorting, a Following filter.
- **Reels** (`/reels`) — full-viewport, swipeable vertical video feed, clips only.
- **News** (`/news`) — link posts only, headline-first.
- **Learn** (`/learn`) — tips + snippets, filterable by tag — the resource/education feed.
- **Web** (`/web`) — your social graph as an actual force-directed node graph:
  who you follow, who follows you, and who you're similar to but not yet
  connected with (dashed edges). Drag nodes, click one to visit their profile.
- **Messages** (`/messages`) — 1:1 DMs, Slack/Discord-style two-pane layout,
  lightweight polling for a "live" feel without websockets.

**For You**, **devs like you**, **projects for you**, and the similarity edges
on the web graph are all powered by one lightweight recommendation model: a
tag-affinity vector per user built from what they've posted, upvoted, and
commented on, compared via cosine similarity.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite for local dev (swap the `datasource` in
  [`prisma/schema.prisma`](prisma/schema.prisma) and `DATABASE_URL` in `.env`
  to point at Postgres for production — the schema itself needs no changes)
- `d3-force` for the network graph layout (client-side only, so its physics
  never has to match between server and browser)
- No auth yet — a "demo mode" user switcher (nav rail / mobile top bar) lets
  you act as any seeded user via a cookie, so the whole social graph (follows,
  votes, comments, DMs) is fully interactive without wiring up real accounts

## Getting started

```bash
npm install
npm run seed   # 14 fake users, ~45 posts, votes, comments, follows, DM threads
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Project structure

- `prisma/schema.prisma` — data model (users, posts, tags, votes, comments, follows, conversations/messages)
- `prisma/seed.ts` — seed data generator
- `src/lib/affinity.ts` — the recommendation model (tag-affinity vectors, cosine similarity)
- `src/lib/graph.ts` — builds the node/edge data for the `/web` social graph
- `src/lib/posts.ts` — feed query + ranking (hot / new / top / for-you)
- `src/lib/conversations.ts` — DM conversation queries
- `src/lib/actions.ts` — server actions (vote, comment, follow, submit post, messages, switch user)
- `src/components/PostCard.tsx` — renders each post type differently
- `src/components/NetworkGraph.tsx` — the draggable force-directed graph
- `src/components/nav/` — desktop icon rail, mobile top bar, mobile bottom tab bar
- `src/app/` — routes: `/`, `/reels`, `/news`, `/learn`, `/web`, `/messages`, `/post/[id]`, `/u/[username]`, `/submit`

## What's not built yet

Real auth, real video upload (clips use placeholder video/poster assets), live
GitHub API sync for repo stats (currently seeded as static numbers), group
chats/channels (DMs are 1:1 only), and search.

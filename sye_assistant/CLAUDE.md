# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project intent

A personal (single-user) assistant web app for the repo owner. The UI is a sidebar of "tools" — each tool is a self-contained feature accessed by clicking its token in the navbar. Access is gated by OAuth so only the owner can reach any data.

Planned tools (non-exhaustive):
- **Birthday tracker** — pulls birthdays from a Google Calendar; lets the user brainstorm gift ideas per contact.
- **Markdown notes** — Obsidian-style local MD storage and editing.

Treat the sidebar as the extension point. New tools should plug in without modifying unrelated tools.

## Commands

Package manager is **pnpm** (note `pnpm-workspace.yaml` declares this dir as the only workspace package — required by pnpm v10 even for single-package repos).

- `pnpm dev` — Next.js dev server on http://localhost:3000
- `pnpm build` — production build
- `pnpm start` — serve the production build
- `pnpm lint` — ESLint (flat config in `eslint.config.mjs`, extends `next/core-web-vitals` + `next/typescript`)

No test runner is wired up yet. Before adding tests, agree with the user on the framework (Vitest is the natural fit alongside Next 16 / React 19).

## Architecture

Next.js 16 App Router, React 19, TypeScript, Tailwind v4 (PostCSS-based, no `tailwind.config` — theme tokens live in `app/globals.css` via `@theme inline`). Path alias `@/*` → repo root.

Currently a `create-next-app` boilerplate: `app/layout.tsx` + `app/page.tsx` + `app/globals.css` are the only meaningful files. Everything below is the intended shape — confirm with the user before deviating.

### Suggested layout for tools

```
app/
  (auth)/...              -- sign-in / callback routes
  (app)/                  -- authed shell: sidebar + tool viewport
    layout.tsx            -- renders <Sidebar/> from the tool registry
    [tool]/page.tsx       -- or one route per tool, whichever the user prefers
  api/                    -- route handlers (Google APIs, MD storage)
lib/
  auth.ts                 -- OAuth config + session helpers (server-only)
  tools/
    registry.ts           -- single source of truth: id, label, icon, route, loader
    birthdays/...         -- one folder per tool, owns its UI + server actions
    notes/...
```

The **tool registry** is the architectural keystone: the sidebar reads it to render tokens, and route segments resolve their tool from it. Adding a tool = adding a folder + one registry entry. Don't let tools cross-import each other; shared logic goes in `lib/`.

### Auth model

Single-user app. The cheapest correct design:

- Google OAuth (one provider — birthdays already need Google Calendar scopes, and the user's identity is Google).
- Server-side allowlist of one Google account (env var). Reject every other `sub`/email at the callback.
- Middleware (`middleware.ts`) protects everything under `(app)` and `api/` except the auth routes.

NextAuth/Auth.js v5 is the path of least resistance and handles token refresh for Google APIs. Push back if the user reaches for a hand-rolled OAuth flow — there's no upside here.

### Data persistence

Not yet decided. The two tools have different needs:
- **Birthdays / gift ideas** — small structured data; a SQLite file via Prisma or Drizzle is plenty.
- **Notes** — Markdown files. Storing them as actual `.md` on disk (or in a synced folder / git repo) preserves the "Obsidian-like" property of being readable outside the app. A DB-backed blob loses that.

Raise this trade-off explicitly the first time persistence is touched; don't silently pick one.

## Conventions to enforce

- **Server-only secrets stay server-only.** OAuth client secret, Google refresh tokens, and the allowlisted account ID must never appear in a Client Component or be sent to the browser. Use Server Components / Route Handlers / Server Actions for anything that touches them.
- **Tools are isolated.** A change to the notes tool should never require editing the birthday tool. If shared UI emerges (e.g. a tool-page chrome), lift it to `app/(app)/layout.tsx` or `components/`, not into a sibling tool.
- **Push back on scope creep.** This is a single-user app — don't add multi-tenant abstractions, role systems, public-facing pages, or analytics unless the user asks.

# Nybro Run Club — nybrorunclub.dk

A web app for timing and displaying results from running races. Built with Next.js 16, Supabase, and deployed on Vercel.

---

## What it does

Two main features:

1. **Public race results** — spectators visit the site and see a live leaderboard that updates in real time as laps are recorded
2. **Admin race timer** — an authenticated admin creates races, registers runners, starts a timer, and records lap times by typing bib numbers

---

## Tech stack

| Layer     | Choice                                     |
| --------- | ------------------------------------------ |
| Framework | Next.js 16.2 (App Router, Turbopack)       |
| Language  | TypeScript                                 |
| Styling   | Tailwind CSS v4                            |
| Database  | Supabase (Postgres)                        |
| Realtime  | Supabase Realtime (postgres_changes)       |
| Auth      | NextAuth.js v4 with Credentials provider   |
| Hosting   | Vercel                                     |
| Domain    | nybrorunclub.dk (registered at Simply.com) |

---

## Project structure

```
app/
  admin/
    dashboard/
      page.tsx          ← Race list for admin (client component, fetches /api/races)
    races/
      new/
        page.tsx        ← Create race form
      [id]/
        timer/
          page.tsx      ← Server component, loads race data
          TimerClient.tsx ← Client component with live timer, bib input, runner table
  races/
    [id]/
      page.tsx          ← Public race results (server component)
      LiveLeaderboard.tsx ← Client component with Supabase Realtime subscription
  api/
    auth/
      [...nextauth]/
        route.ts        ← NextAuth credentials handler
    races/
      route.ts          ← GET all races, POST create race
      [id]/
        route.ts        ← PATCH update race (start/finish)
        runners/
          route.ts      ← GET runners for race, POST add runner
    laps/
      route.ts          ← POST record a lap
  login/
    page.tsx            ← Password login form
  page.tsx              ← Public home page, lists all races
  layout.tsx            ← Root layout with SessionProvider
  Providers.tsx         ← NextAuth SessionProvider wrapper
  globals.css           ← Tailwind v4 import
lib/
  supabase.ts           ← Supabase anon client (browser-safe, used in client components)
  supabaseAdmin.ts      ← Supabase service role client (server-only, bypasses RLS)
types/
  index.ts              ← Shared TypeScript types (Race, Runner, Lap, RaceStatus)
proxy.ts                ← Next.js 16 middleware (protects /admin/* routes)
```

---

## Database schema (Supabase — public schema)

```sql
races (
  id uuid PK,
  name text,
  date date,
  laps_count int,
  lap_distance_m int,
  status text,           -- 'pending' | 'active' | 'finished'
  started_at timestamptz,
  created_at timestamptz
)

runners (
  id uuid PK,
  race_id uuid FK → races.id,
  bib_number int,
  name text nullable,
  UNIQUE(race_id, bib_number)
)

laps (
  id uuid PK,
  race_id uuid FK → races.id,
  runner_id uuid FK → runners.id,
  lap_number int,
  recorded_at timestamptz,
  elapsed_ms bigint        -- milliseconds since race started_at
)
```

### RLS policies

RLS is enabled on all three tables. Public read access is granted via policies:

```sql
create policy "Public read races" on races for select using (true);
create policy "Public read runners" on runners for select using (true);
create policy "Public read laps" on laps for select using (true);
```

Writes go through `supabaseAdmin` (service role key) in API routes, bypassing RLS.

### Realtime

The `laps` table is added to the Supabase realtime publication:

```sql
alter publication supabase_realtime add table laps;
```

---

## Environment variables

Required in `.env.local` (local) and Vercel dashboard (production):

```bash
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=         # Supabase service role key (server only)
NEXTAUTH_SECRET=                   # Random secret: openssl rand -base64 32
NEXTAUTH_URL=                      # http://localhost:3000 (local) or https://nybrorunclub.dk (prod)
ADMIN_PASSWORD=                    # Password for admin login
```

---

## Auth

NextAuth.js v4 with the Credentials provider. A single admin password is stored in `ADMIN_PASSWORD`. Sessions use JWT strategy (no database needed).

The `proxy.ts` file protects all `/admin/*` routes — unauthenticated users are redirected to `/login`.

**Important Next.js 16 note:** The middleware file is named `proxy.ts` (not `middleware.ts`) and exports a function named `proxy` (not `middleware`). This is a Next.js 16 breaking change.

---

## Known quirks and decisions

### Next.js 16 breaking changes

- `params` in page components and API route handlers is now a `Promise` and must be awaited: `const { id } = await params`
- Middleware file is `proxy.ts` exporting `proxy` function, not `middleware.ts`
- Tailwind v4 uses `@import "tailwindcss"` in CSS, not `@tailwind base/components/utilities`

### Supabase client caching

Both Supabase clients override the global `fetch` with `cache: 'no-store'` to prevent Next.js from caching Supabase responses in production:

```typescript
global: {
  fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
}
```

Without this, newly created races don't appear until the next deployment.

### Two Supabase clients

- `lib/supabase.ts` — uses the anon key, safe to use in client components and browser
- `lib/supabaseAdmin.ts` — uses the service role key, server-only (API routes and server components). Never import this in a client component.

### Route groups removed

The project originally used `(admin)` and `(public)` Next.js route groups but these caused 404s in Next.js 16. Routes are now flat under `app/admin/` and `app/races/`.

---

## Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. Admin at `http://localhost:3000/admin/dashboard`.

---

## Deployment

Pushes to `main` auto-deploy to Vercel. No manual steps needed.

DNS is managed at Simply.com pointing to Vercel:

- `A` record: `@` → `216.198.79.1`
- `CNAME` record: `www` → Vercel-provided value

---

## Potential improvements

- [ ] Multiple admin users
- [ ] Public race registration (runners sign up online)
- [ ] Mobile-optimised timer screen (large bib input for use on phone at finish line)
- [ ] QR code on public results page for spectators to scan

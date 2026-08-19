# Nybro Run Club — nybrorunclub.dk

A web app for Nybrogård Løbeklub. Handles public race sign-up, live timing, results, and a blog. Built with Next.js 16, Supabase, and deployed on Vercel.

---

## What it does

- **Public sign-up** — participants register for upcoming races at `/signup`
- **Live race results** — public leaderboard updates in real time as laps are recorded
- **Admin race timer** — authenticated admin assigns bibs, starts a timer, records laps by bib number
- **Blog** — admin writes markdown posts with hero images and multi-image slideshows

---

## Tech stack

| Layer     | Choice                                     |
| --------- | ------------------------------------------ |
| Framework | Next.js 16.2 (App Router, webpack bundler) |
| Language  | TypeScript                                 |
| Styling   | Tailwind CSS v4                            |
| Database  | Supabase (Postgres)                        |
| Realtime  | Supabase Realtime (postgres_changes)       |
| Auth      | NextAuth.js v4 with Credentials provider   |
| Storage   | Supabase Storage (`blog-images` bucket)    |
| Hosting   | Vercel                                     |
| Domain    | nybrorunclub.dk (registered at Simply.com) |
| Emails    | Resend                                     |

---

## Project structure

```
app/
  admin/
    dashboard/
      page.tsx              ← Races + blog posts tabs (client component)
    races/
      new/
        page.tsx            ← Create race form
      [id]/
        edit/
          page.tsx          ← Server component wrapper
          EditRaceClient.tsx← Edit race form (name, date, lap distance, available_laps)
        timer/
          page.tsx          ← Server component, loads race + participants + laps
          TimerClient.tsx   ← Live timer, numpad bib input, participant table
        participants/
          page.tsx          ← Server component wrapper
          ParticipantsClient.tsx ← Bib assignment, paid toggle, comment sheet, delete
    posts/
      new/
        page.tsx            ← New post form
      [id]/
        edit/
          page.tsx          ← Edit post form
  races/
    [id]/
      page.tsx              ← Public race page (server component, uses supabaseAdmin)
      LiveLeaderboard.tsx   ← Client component with Realtime subscription
  blog/
    page.tsx                ← Public blog index
    [slug]/
      page.tsx              ← Public post page
  signup/
    page.tsx                ← Public sign-up form
  api/
    auth/
      [...nextauth]/
        route.ts            ← NextAuth credentials handler
    races/
      route.ts              ← GET all races (admin), POST create race
      public/
        route.ts            ← GET upcoming visible races (public, for signup form)
      [id]/
        route.ts            ← PATCH update race, DELETE race
    participants/
      route.ts              ← GET all participants (admin), POST sign up
      [id]/
        route.ts            ← PATCH update participant, DELETE participant
    laps/
      route.ts              ← POST record a lap
      [id]/
        route.ts            ← DELETE a lap (undo)
    posts/
      route.ts              ← GET all posts (admin), POST create post
      [id]/
        route.ts            ← PATCH update post, DELETE post
      upload/
        route.ts            ← POST upload image to Supabase Storage
  login/
    page.tsx                ← Password login form
  page.tsx                  ← Public home page
  layout.tsx                ← Root layout with SessionProvider
  Providers.tsx             ← NextAuth SessionProvider wrapper
  globals.css               ← Tailwind v4 import
components/
  ImageSlideshow.tsx        ← Client component: prev/next, dots, thumbnail strip
lib/
  supabase.ts               ← Supabase anon client (browser-safe)
  supabaseAdmin.ts          ← Supabase service role client (server-only)
  utils.ts                  ← generateSlug helper
types/
  index.ts                  ← Shared TypeScript types
proxy.ts                    ← Next.js 16 middleware (protects /admin/* routes)
```

---

## Database schema

```sql
races (
  id uuid PK,
  name text,
  date date,
  laps_count int,           -- max of available_laps, used as race default
  lap_distance_m int,
  available_laps int[],     -- e.g. {14,28,42} for 7/14/21km at 500m laps
  status text,              -- 'pending' | 'active' | 'finished'
  is_visible boolean,
  description text nullable,
  started_at timestamptz nullable,
  ended_at timestamptz nullable,
  created_at timestamptz
)

participants (
  id uuid PK,
  race_id uuid FK → races.id ON DELETE CASCADE,
  name text NOT NULL,
  email text nullable,      -- null for migrated historical runners
  gender text nullable,
  birth_year int nullable,
  team text nullable,       -- hallway name e.g. "AB-lige"
  bib_number int nullable,  -- assigned by admin before race
  laps_count int nullable,  -- participant's chosen distance in laps
  is_member boolean,        -- lives at Nybrogård or external participant
  paid boolean,
  comments text nullable,
  created_at timestamptz
)

laps (
  id uuid PK,
  race_id uuid FK → races.id,
  participant_id uuid FK → participants.id ON DELETE CASCADE,
  lap_number int,
  recorded_at timestamptz,
  elapsed_ms bigint         -- milliseconds since race started_at
)

posts (
  id uuid PK,
  title text,
  slug text UNIQUE,
  summary text nullable,
  content text,             -- markdown
  hero_image_url text nullable,
  images text[],            -- slideshow images
  is_visible boolean,
  published_at timestamptz nullable,
  updated_at timestamptz,
  created_at timestamptz
)
```

### RLS

RLS is enabled on all tables. Participants has an INSERT-only public policy (sign-up form). All other writes go through `supabaseAdmin` (service role), bypassing RLS. Public race pages use `supabaseAdmin` server-side to read participant data without exposing emails.

```sql
-- Participants: public can insert (sign-up), nobody can read without service role
create policy "Anyone can sign up" on participants for insert with check (true);

-- Laps: added to realtime publication for live leaderboard
alter publication supabase_realtime add table laps;
```

---

## Key flows

### Sign-up flow

1. Participant visits `/signup` (or `/signup?race=<id>` from a shared link)
2. Form fetches upcoming visible races from `/api/races/public`
3. Distance options derived from `race.available_laps` × `race.lap_distance_m`
4. On submit → `POST /api/participants` → row created with `laps_count`, no bib yet
5. Participant appears immediately on public race page pending list

### Race day flow

1. Admin opens `/admin/races/[id]/participants`
2. Assigns bib numbers (manually or auto-assign by sign-up order)
3. Opens `/admin/races/[id]/timer` → clicks Start race
4. Types bib numbers on numpad as runners finish laps → `POST /api/laps`
5. Public leaderboard at `/races/[id]` updates in real time via Supabase Realtime

### Blog flow

1. Admin creates post at `/admin/posts/new` with MDEditor
2. Uploads hero image and slideshow images (reuse same `/api/posts/upload` route)
3. Images stored in Supabase Storage `blog-images` bucket
4. Publish toggles `is_visible`

---

## Public leaderboard columns by race status

| Status     | Columns shown                                                  |
| ---------- | -------------------------------------------------------------- |
| `pending`  | Name, gender, team, distance — signup list, no timing          |
| `active`   | + Bib, progress (laps done/target), finish time — live updates |
| `finished` | + Position, per-lap split times                                |

---

## Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only, never expose to client
NEXTAUTH_SECRET=                   # openssl rand -base64 32
NEXTAUTH_URL=                      # http://localhost:3000 or https://nybrorunclub.dk
ADMIN_PASSWORD=                    # single admin password
```

---

## Auth

NextAuth.js v4 with Credentials provider. Single `ADMIN_PASSWORD` env variable, JWT sessions, no database adapter. `proxy.ts` protects all `/admin/*` routes.

---

## Known quirks

### Bundler: webpack not Turbopack

`@uiw/react-md-editor` is incompatible with Turbopack. Dev script uses `--webpack` flag:

```json
"dev": "next dev --webpack"
```

### Next.js 16 breaking changes

- `params` in pages and API routes is a Promise: `const { id } = await params`
- Middleware is `proxy.ts` exporting `proxy`, not `middleware.ts`
- Tailwind v4: `@import "tailwindcss"` not `@tailwind` directives

### Supabase caching

Both clients override global fetch with `cache: 'no-store'` to prevent Next.js caching stale data in production.

### Two Supabase clients

- `lib/supabase.ts` — anon key, safe in client components and browser
- `lib/supabaseAdmin.ts` — service role key, server-only. Never import in client components. Used in all API routes and server components that read sensitive data (emails, participant details).

### Public race page uses supabaseAdmin

`app/races/[id]/page.tsx` uses `supabaseAdmin` (not the anon client) to fetch participants server-side, selecting only public fields. This keeps emails and other sensitive data server-side only while still rendering the public leaderboard.

---

## Local development

```bash
npm install
npm run dev   # uses --webpack flag
```

Visit `http://localhost:3000`. Admin at `/admin/dashboard`. Sign-up at `/signup`.

---

## Deployment

Pushes to `main` auto-deploy to Vercel. DNS at Simply.com:

- `A` record: `@` → Vercel IP
- `CNAME` record: `www` → Vercel-provided value

---

## Roadmap

- [ ] Phase 2: Email — confirmation on sign-up, admin broadcast to all participants
- [ ] Waitlist when race is full
- [ ] Capacity limits per distance
- [ ] Result email post-race with personal finish time
- [ ] Multiple admin users
- [ ] QR code on public results page

# nybrorunclub.dk — Project Skill

## What this project is

nybrorunclub.dk is a Next.js 16 web app for Nybrogård Løbeklub, a Danish running club at a student residence (kollegium). It handles:

- Public race sign-up
- Live race timing and leaderboard
- Blog with markdown posts and image slideshows
- Admin dashboard for managing races, participants, and posts

Live at nybrorunclub.dk. Repo on GitHub, auto-deployed to Vercel.

---

## Stack

- **Next.js 16.2** — App Router, **webpack bundler** (NOT Turbopack — incompatible with MDEditor)
- **TypeScript**
- **Tailwind CSS v4** — uses `@import "tailwindcss"`, not `@tailwind` directives
- **Supabase** — Postgres + Realtime + Storage
- **NextAuth.js v4** — Credentials provider, JWT, single `ADMIN_PASSWORD` env var
- **Vercel** — hosting, auto-deploy from main
- **Simply.com** — domain registrar for nybrorunclub.dk

---

## Critical patterns — always follow these

### Client components with fetch-based API routes

The project uses **client components** that call **fetch-based API routes** — NOT server actions. This is the established pattern throughout. Never propose server actions.

### Two Supabase clients

- `lib/supabase.ts` — anon key, safe in client components
- `lib/supabaseAdmin.ts` — service role key, **server-only** (API routes + server components). Never import in client components.

### Public race page uses supabaseAdmin

`app/races/[id]/page.tsx` uses `supabaseAdmin` server-side to fetch participants, selecting only public fields. Keeps emails server-side.

### Next.js 16 quirks

- `params` is a Promise in pages and API routes: `const { id } = await params`
- Middleware file is `proxy.ts` exporting `proxy` function (not `middleware.ts`)
- Both Supabase clients override fetch with `cache: 'no-store'` to prevent stale data

### Incremental, test-as-you-go

Build one piece at a time. Test before moving on. Don't write 5 files at once.

---

## Database schema

```sql
races (
  id uuid PK,
  name text,
  date date,
  laps_count int,           -- max of available_laps
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
  email text nullable,
  gender text nullable,     -- 'male' | 'female' | 'non-binary' | 'prefer not to say'
  birth_year int nullable,
  team text nullable,       -- hallway name e.g. "AB-lige"
  bib_number int nullable,  -- assigned by admin before race
  laps_count int nullable,  -- participant's chosen distance in laps
  is_member boolean,        -- lives at Nybrogård or external
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
  elapsed_ms bigint         -- ms since race started_at
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

- `participants`: INSERT-only public policy (sign-up). Reads via supabaseAdmin only.
- All writes go through supabaseAdmin in API routes.
- `laps` table in Supabase Realtime publication.

---

## TypeScript types (types/index.ts)

```typescript
export type RaceStatus = "pending" | "active" | "finished";

export interface Race {
  id: string;
  name: string;
  date: string;
  description: string | null;
  laps_count: number;
  lap_distance_m: number;
  available_laps: number[];
  status: RaceStatus;
  started_at: string | null;
  created_at: string;
  ended_at: string | null;
  is_visible: boolean;
}

export interface Participant {
  id: string;
  race_id: string;
  bib_number: number | null;
  name: string;
  email: string | null;
  gender: string | null;
  birth_year: number | null;
  team: string | null;
  is_member: boolean;
  comments: string | null;
  paid: boolean;
  laps_count: number | null;
  created_at: string;
}

export interface Lap {
  id: string;
  race_id: string;
  participant_id: string;
  lap_number: number;
  recorded_at: string;
  elapsed_ms: number;
}

export type Post = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  hero_image_url: string | null;
  images: string[] | null;
  is_visible: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
```

---

## API routes

| Method | Route                  | Auth    | Description                           |
| ------ | ---------------------- | ------- | ------------------------------------- |
| GET    | /api/races             | session | All races (admin dashboard)           |
| POST   | /api/races             | session | Create race                           |
| GET    | /api/races/public      | none    | Upcoming visible races (signup form)  |
| PATCH  | /api/races/[id]        | session | Update race (status, visibility, etc) |
| DELETE | /api/races/[id]        | session | Delete race                           |
| GET    | /api/participants      | session | All participants                      |
| POST   | /api/participants      | none    | Sign up (public)                      |
| PATCH  | /api/participants/[id] | none    | Update participant (bib, paid, etc)   |
| DELETE | /api/participants/[id] | none    | Delete participant                    |
| POST   | /api/laps              | session | Record a lap                          |
| DELETE | /api/laps/[id]         | session | Undo a lap                            |
| GET    | /api/posts             | session | All posts (admin)                     |
| POST   | /api/posts             | session | Create post                           |
| PATCH  | /api/posts/[id]        | session | Update post                           |
| DELETE | /api/posts/[id]        | session | Delete post                           |
| POST   | /api/posts/upload      | session | Upload image to Supabase Storage      |

---

## Key flows

### Sign-up

1. `/signup?race=<id>` — pre-selects race via query param
2. Fetches `/api/races/public` → `id, name, date, lap_distance_m, available_laps`
3. Distance buttons derived from `race.available_laps` × `race.lap_distance_m`
4. Sends `laps_count` (integer) not distance string
5. `POST /api/participants` → row created, bib_number null

### Race day

1. Admin: `/admin/races/[id]/participants` → assign bibs (manual or auto by sign-up order)
2. Admin: `/admin/races/[id]/timer` → Start race → type bibs on numpad
3. `POST /api/laps` looks up participant by `bib_number` + `race_id`
4. Public `/races/[id]` updates live via Supabase Realtime on `laps` table

### Leaderboard columns by status

- `pending`: name, gender, team, distance (signup list)
- `active`: + bib, progress, finish time (live)
- `finished`: + position, per-lap splits

---

## Hallways (team options)

AB-lige, AB-ulige, CD-lige, CD-ulige, EF-lige, EF-ulige, GH-lige, GH-ulige, JK-lige, JK-ulige, LM-lige, LM-ulige, NO-lige, NO-ulige, PR-lige, PR-ulige, ST-lige, ST-ulige

Note: no IJ, QR — jumps from GH to JK and from NO to PR.

---

## Blog

- `@uiw/react-md-editor` for markdown editing — webpack only, breaks with Turbopack
- `react-markdown` + `remark-gfm` for public rendering
- `@tailwindcss/typography` for prose styling
- Images stored in Supabase Storage `blog-images` bucket (1MB limit per file)
- `components/ImageSlideshow.tsx` — no external deps, CSS/state only, prev/next + dots + thumbnail strip

---

## Roadmap (next up)

- **Phase 2: Email** — Resend provider, confirmation email on sign-up, admin broadcast to participants
- Capacity limits + waitlist per distance
- Result email post-race with personal finish time
- Multiple admin users

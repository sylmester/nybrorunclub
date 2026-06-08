"use client";

import { useEffect, useState } from "react";
import { Race } from "@/types";
import Link from "next/link";

type Post = {
  id: string;
  title: string;
  slug: string;
  is_visible: boolean;
  published_at: string | null;
  created_at: string;
};

const statusColors: Record<Race["status"], string> = {
  pending: "bg-yellow-100 text-gray-500",
  active: "bg-green-100 text-gray-500",
  finished: "bg-gray-100 text-gray-500",
};

// Shared SVGs
const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function DashboardPage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  async function fetchRaces() {
    const res = await fetch("/api/races", { cache: "no-store" });
    setRaces(await res.json());
  }

  async function fetchPosts() {
    const res = await fetch("/api/posts", { cache: "no-store" });
    setPosts(await res.json());
  }

  useEffect(() => {
    fetchRaces();
    fetchPosts();
  }, []);

  async function deleteRace(id: string, name: string) {
    if (
      !confirm(`Delete "${name}"? This will remove all runners and lap times.`)
    )
      return;
    await fetch(`/api/races/${id}`, { method: "DELETE" });
    fetchRaces();
  }

  async function toggleRaceVisibility(id: string, current: boolean) {
    await fetch(`/api/races/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: !current }),
    });
    fetchRaces();
  }

  async function deletePost(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    fetchPosts();
  }

  async function togglePostVisibility(id: string, current: boolean) {
    await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: !current }),
    });
    fetchPosts();
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-medium">Dashboard</h1>
        <p className="text-gray-500 mt-1">Nybrogård Løbeklub</p>
      </div>

      {/* ── Races ── */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Races</h2>
          <Link
            href="/admin/races/new"
            className="inline-flex items-center gap-1.5 bg-black text-white px-3.5 py-2 rounded-lg hover:opacity-80 transition-opacity text-sm font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            New race
          </Link>
        </div>

        {!races?.length ? (
          <p className="text-gray-400 text-sm">No races yet.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {races.map((race) => (
              <div
                key={race.id}
                className="border border-gray-200 rounded-xl px-4 py-3.5 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-sm">{race.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(race.date).toLocaleDateString("da-DK")} ·{" "}
                    {race.laps_count} laps · {race.lap_distance_m}m
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusColors[race.status]}`}
                  >
                    {race.status}
                  </span>
                  <div className="w-px h-4 bg-gray-200 mx-1" />
                  <button
                    onClick={() =>
                      toggleRaceVisibility(race.id, race.is_visible)
                    }
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    title={race.is_visible ? "Hide" : "Show"}
                  >
                    {race.is_visible ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                  <Link
                    href={`/admin/races/${race.id}/edit`}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <EditIcon />
                  </Link>
                  <Link
                    href={`/admin/races/${race.id}/timer`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="10 8 16 12 10 16 10 8" />
                    </svg>
                    Timer
                  </Link>
                  <button
                    onClick={() => deleteRace(race.id, race.name)}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Blog Posts ── */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Blog Posts</h2>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-1.5 bg-black text-white px-3.5 py-2 rounded-lg hover:opacity-80 transition-opacity text-sm font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            New post
          </Link>
        </div>

        {!posts?.length ? (
          <p className="text-gray-400 text-sm">No posts yet.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border border-gray-200 rounded-xl px-4 py-3.5 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-sm">{post.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {post.published_at
                      ? `Published ${new Date(post.published_at).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" })}`
                      : `Created ${new Date(post.created_at).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" })}`}
                    {" · "}/blog/{post.slug}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${post.is_visible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {post.is_visible ? "Published" : "Draft"}
                  </span>
                  <div className="w-px h-4 bg-gray-200 mx-1" />
                  <button
                    onClick={() =>
                      togglePostVisibility(post.id, post.is_visible)
                    }
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    title={post.is_visible ? "Unpublish" : "Publish"}
                  >
                    {post.is_visible ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <EditIcon />
                  </Link>
                  <button
                    onClick={() => deletePost(post.id, post.title)}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

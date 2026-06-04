"use client";

import { useEffect, useState } from "react";
import { Race } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

const statusColors: Record<Race["status"], string> = {
  draft: "bg-gray-100 text-gray-500",
  pending: "bg-yellow-100 text-gray-500",
  active: "bg-green-100 text-gray-500",
  finished: "bg-gray-100 text-gray-500",
};

export default function DashboardPage() {
  const [races, setRaces] = useState<Race[]>([]);
  const router = useRouter();

  async function fetchRaces() {
    const res = await fetch("/api/races", { cache: "no-store" });
    const data = await res.json();
    setRaces(data);
  }

  useEffect(() => {
    fetchRaces();
  }, []);

  async function deleteRace(id: string, name: string) {
    if (
      !confirm(`Delete "${name}"? This will remove all runners and lap times.`)
    )
      return;
    await fetch(`/api/races/${id}`, { method: "DELETE" });
    fetchRaces();
  }

  async function publishRace(raceId: string) {
    await fetch(`/api/races/${raceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending" }),
    });
    fetchRaces();
  }
  async function unpublishRace(raceId: string) {
    await fetch(`/api/races/${raceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "draft" }),
    });
    fetchRaces();
  }

  async function toggleVisibility(raceId: string, current: boolean) {
    await fetch(`/api/races/${raceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: !current }),
    });
    fetchRaces();
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-medium">Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage races</p>
        </div>
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

      {!races?.length && (
        <p className="text-gray-400">No races yet. Create your first one.</p>
      )}

      <div className="flex flex-col gap-2.5">
        {races?.map((race: Race) => (
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
              {/* Status badge */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusColors[race.status]}`}
              >
                {race.status}
              </span>
              <div className="w-px h-4 bg-gray-200 mx-1" />

              {/* Visibility toggle */}
              <button
                onClick={() => toggleVisibility(race.id, race.is_visible)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title={race.is_visible ? "Hide from public" : "Show to public"}
              >
                {race.is_visible ? (
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
                ) : (
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
                )}
              </button>

              {/* Publish (draft only) */}
              {race.status === "draft" && (
                <button
                  onClick={() => publishRace(race.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-100 border border-blue text-gray-500 text-xs font-medium hover:bg-blue-200 transition-colors"
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
                    <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
                  </svg>
                  Publish
                </button>
              )}
              {/* Unpublish (pending only) */}
              {race.status === "pending" && (
                <button
                  onClick={() => unpublishRace(race.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-200 transition-colors"
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
                    <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  Unpublish
                </button>
              )}
              {/* Edit */}
              <Link
                href={`/admin/races/${race.id}/edit`}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                title="Edit race"
              >
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
              </Link>
              {/* Timer */}
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
              {/* Delete */}
              <button
                onClick={() => deleteRace(race.id, race.name)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete race"
              >
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
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

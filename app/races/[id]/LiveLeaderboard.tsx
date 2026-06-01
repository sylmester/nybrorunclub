"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Race, Runner, Lap } from "@/types";

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0)
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

interface Props {
  race: Race;
  initialRunners: Runner[];
  initialLaps: Lap[];
}

interface RunnerRow {
  runner: Runner;
  lapsCompleted: number;
  targetLaps: number;
  lapTimes: Lap[];
  lastElapsed: number | null;
  finished: boolean;
}

function buildLeaderboard(
  runners: Runner[],
  laps: Lap[],
  defaultLaps: number,
): RunnerRow[] {
  return runners
    .map((runner) => {
      const runnerLaps = laps
        .filter((l) => l.runner_id === runner.id)
        .sort((a, b) => a.lap_number - b.lap_number);
      const lapsCompleted = runnerLaps.length;
      const targetLaps = runner.laps_count ?? defaultLaps;
      const lastLap = runnerLaps[runnerLaps.length - 1];
      return {
        runner,
        lapsCompleted,
        targetLaps,
        lapTimes: runnerLaps,
        lastElapsed: lastLap?.elapsed_ms ?? null,
        finished: lapsCompleted >= targetLaps,
      };
    })
    .sort((a, b) => {
      if (a.finished && b.finished)
        return (a.lastElapsed ?? 0) - (b.lastElapsed ?? 0);
      if (a.finished) return -1;
      if (b.finished) return 1;
      if (b.lapsCompleted !== a.lapsCompleted)
        return b.lapsCompleted - a.lapsCompleted;
      return (a.lastElapsed ?? Infinity) - (b.lastElapsed ?? Infinity);
    });
}

export default function LiveLeaderboard({
  race,
  initialRunners,
  initialLaps,
}: Props) {
  const [laps, setLaps] = useState<Lap[]>(initialLaps);
  const [runners] = useState<Runner[]>(initialRunners);

  const maxLaps = Math.max(
    ...(race.categories?.map((c) => c.laps_count) ?? [race.laps_count]),
  );

  useEffect(() => {
    if (race.status !== "active") return;
    const channel = supabase
      .channel(`laps-${race.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "laps",
          filter: `race_id=eq.${race.id}`,
        },
        (payload) => {
          setLaps((prev) => [...prev, payload.new as Lap]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [race.id, race.status]);

  function exportCsv() {
    const lapHeaders = Array.from(
      { length: maxLaps },
      (_, i) => `Lap ${i + 1}`,
    );
    const headers = [
      "Pos",
      "Bib",
      "Participant",
      "Category",
      "Team",
      "Country",
      "Finish time",
      ...lapHeaders,
    ];
    const rows = leaderboard.map((row, i) => [
      i + 1,
      row.runner.bib_number,
      row.runner.name ?? "",
      row.runner.gender ?? "",
      row.runner.team ?? "",
      row.runner.country ?? "",
      row.lastElapsed ? formatTime(row.lastElapsed) : "",
      ...Array.from({ length: maxLaps }, (_, j) =>
        row.lapTimes[j] ? formatTime(row.lapTimes[j].elapsed_ms) : "",
      ),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${race.name.replace(/\s+/g, "_")}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Group by category

  const leaderboard = buildLeaderboard(runners, laps, race.laps_count);

  // Build unique categories from race.categories, keyed by name+laps
  const categories = race.categories?.length
    ? race.categories
    : [{ name: "Results", laps_count: race.laps_count }];

  if (!runners.length) {
    return <p className="text-gray-400">No runners registered yet.</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        {race.status === "active" && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-600 font-medium">Live</span>
          </div>
        )}
        {race.status !== "active" && <div />}
        <button
          onClick={exportCsv}
          className="text-sm text-gray-500 hover:text-black transition-colors"
        >
          Export CSV ↓
        </button>
      </div>

      {categories.map((category, i) => {
        const categoryRunners = leaderboard.filter(
          (row) =>
            row.runner.gender === category.name &&
            row.runner.laps_count === category.laps_count,
        );
        if (!categoryRunners.length) return null;

        return (
          <div key={i} className="mb-10">
            <h2 className="text-lg font-medium mb-3">
              {category.name} —{" "}
              {(category.laps_count * race.lap_distance_m) / 1000}km
              <span className="text-sm text-gray-400 font-normal ml-2">
                ({category.laps_count} laps × {race.lap_distance_m}m)
              </span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100">
                    <th className="pb-2 pr-3">Pos.</th>
                    <th className="pb-2 pr-3">Bib no.</th>
                    <th className="pb-2 pr-3">Participant</th>
                    <th className="pb-2 pr-3">Category</th>
                    <th className="pb-2 pr-3">Team</th>
                    <th className="pb-2 pr-3">Country</th>
                    <th className="pb-2 pr-3 text-right">Finish time</th>
                    {Array.from({ length: category.laps_count }, (_, j) => (
                      <th key={j} className="pb-2 pr-3 text-right">
                        Lap {j + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categoryRunners.map((row, j) => (
                    <tr
                      key={row.runner.id}
                      className={`border-b border-gray-50 ${row.finished ? "text-green-700" : ""}`}
                    >
                      <td className="py-3 pr-3 text-gray-400">{j + 1}</td>
                      <td className="py-3 pr-3 font-mono font-medium">
                        {row.runner.bib_number}
                      </td>
                      <td className="py-3 pr-3">{row.runner.name ?? "—"}</td>
                      <td className="py-3 pr-3 text-gray-500">
                        {row.runner.gender ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-gray-500">
                        {row.runner.team ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-gray-500">
                        {row.runner.country ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-right font-mono">
                        {row.finished && row.lastElapsed
                          ? formatTime(row.lastElapsed)
                          : "—"}
                      </td>
                      {Array.from({ length: category.laps_count }, (_, k) => (
                        <td
                          key={k}
                          className="py-3 pr-3 text-right font-mono text-gray-400"
                        >
                          {row.lapTimes[k]
                            ? formatTime(row.lapTimes[k].elapsed_ms)
                            : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      {/* Fallback for runners without category assigned */}
      {(() => {
        const uncategorized = leaderboard.filter(
          (row) => !row.runner.gender || !row.runner.laps_count,
        );
        if (!uncategorized.length) return null;
        return (
          <div className="mb-10">
            <h2 className="text-lg font-medium mb-3 text-gray-400">
              Uncategorized
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100">
                    <th className="pb-2 pr-3">Pos.</th>
                    <th className="pb-2 pr-3">Bib no.</th>
                    <th className="pb-2 pr-3">Participant</th>
                    <th className="pb-2 pr-3">Category</th>
                    <th className="pb-2 pr-3">Team</th>
                    <th className="pb-2 pr-3">Country</th>
                    <th className="pb-2 pr-3 text-right">Finish time</th>
                  </tr>
                </thead>
                <tbody>
                  {uncategorized.map((row, i) => (
                    <tr key={row.runner.id} className="border-b border-gray-50">
                      <td className="py-3 pr-3 text-gray-400">{i + 1}</td>
                      <td className="py-3 pr-3 font-mono font-medium">
                        {row.runner.bib_number}
                      </td>
                      <td className="py-3 pr-3">{row.runner.name ?? "—"}</td>
                      <td className="py-3 pr-3 text-gray-500">
                        {row.runner.gender ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-gray-500">
                        {row.runner.team ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-gray-500">
                        {row.runner.country ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-right font-mono">
                        {row.finished && row.lastElapsed
                          ? formatTime(row.lastElapsed)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

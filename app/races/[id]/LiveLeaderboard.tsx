"use client";

import { useEffect, useState, useMemo } from "react";
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

function computeStats(
  runners: Runner[],
  laps: Lap[],
  leaderboard: RunnerRow[],
  race: Race,
) {
  const finishers = leaderboard.filter((r) => r.finished);
  const totalDistanceM = runners.reduce((sum, runner) => {
    const count = laps.filter((l) => l.runner_id === runner.id).length;
    return sum + count * race.lap_distance_m;
  }, 0);
  const fastestFinisher = finishers.reduce(
    (best, row) =>
      !best || (row.lastElapsed ?? Infinity) < (best.lastElapsed ?? Infinity)
        ? row
        : best,
    null as RunnerRow | null,
  );
  const avgFinishMs = finishers.length
    ? finishers.reduce((sum, r) => sum + (r.lastElapsed ?? 0), 0) /
      finishers.length
    : null;
  const teamMap = new Map<string, number>();
  runners.forEach((runner) => {
    const team = runner.team ?? "No team";
    const lapCount = laps.filter((l) => l.runner_id === runner.id).length;
    teamMap.set(
      team,
      (teamMap.get(team) ?? 0) + lapCount * race.lap_distance_m,
    );
  });
  const teamStats = Array.from(teamMap.entries())
    .map(([name, distM]) => ({ name, distM }))
    .sort((a, b) => b.distM - a.distM)
    .slice(0, 5);
  const maxTeamDist = teamStats[0]?.distM ?? 1;
  const categories = race.categories?.length
    ? race.categories
    : [{ name: "All", laps_count: race.laps_count }];
  const categoryStats = categories.map((cat) => ({
    name: cat.name,
    laps_count: cat.laps_count,
    finishers: leaderboard.filter(
      (r) =>
        r.runner.gender === cat.name &&
        r.runner.laps_count === cat.laps_count &&
        r.finished,
    ).length,
  }));
  return {
    finishers: finishers.length,
    total: runners.length,
    totalDistanceM,
    fastestFinisher,
    avgFinishMs,
    teamStats,
    maxTeamDist,
    categoryStats,
  };
}

export default function LiveLeaderboard({
  race,
  initialRunners,
  initialLaps,
}: Props) {
  const [laps, setLaps] = useState<Lap[]>(initialLaps);
  const [runners] = useState<Runner[]>(initialRunners);
  const [tab, setTab] = useState<"leaderboard" | "stats">("leaderboard");
  const [filterGender, setFilterGender] = useState("");
  const [filterDistance, setFilterDistance] = useState("");
  const [filterTeam, setFilterTeam] = useState("");

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

  const leaderboard = useMemo(
    () => buildLeaderboard(runners, laps, race.laps_count),
    [runners, laps, race.laps_count],
  );
  const stats = useMemo(
    () => computeStats(runners, laps, leaderboard, race),
    [runners, laps, leaderboard, race],
  );

  // Unique filter options derived from actual runner data
  const genderOptions = useMemo(
    () =>
      [...new Set(runners.map((r) => r.gender).filter(Boolean))] as string[],
    [runners],
  );
  const distanceOptions = useMemo(
    () =>
      [...new Set(runners.map((r) => r.laps_count).filter(Boolean))].sort(
        (a, b) => (a ?? 0) - (b ?? 0),
      ) as number[],
    [runners],
  );
  const teamOptions = useMemo(
    () => [...new Set(runners.map((r) => r.team).filter(Boolean))] as string[],
    [runners],
  );

  const filtered = useMemo(
    () =>
      leaderboard.filter((row) => {
        if (filterGender && row.runner.gender !== filterGender) return false;
        if (filterDistance && row.runner.laps_count !== Number(filterDistance))
          return false;
        if (filterTeam && row.runner.team !== filterTeam) return false;
        return true;
      }),
    [leaderboard, filterGender, filterDistance, filterTeam],
  );

  const isFiltered = filterGender || filterDistance || filterTeam;

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
    const rows = filtered.map((row, i) => [
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

  if (!runners.length)
    return <p className="text-gray-400">No runners registered yet.</p>;

  return (
    <div>
      {race.description && (
        <p className="text-gray-500 mb-6 leading-relaxed">{race.description}</p>
      )}

      <hr className="my-6 border-gray-100" />

      {/* Tab bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-1">
          <button
            onClick={() => setTab("leaderboard")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === "leaderboard" ? "bg-black text-white" : "text-gray-500 hover:text-black"}`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setTab("stats")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === "stats" ? "bg-black text-white" : "text-gray-500 hover:text-black"}`}
          >
            Statistics
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={exportCsv}
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            Export CSV ↓
          </button>
        </div>
      </div>

      {/* Leaderboard tab */}
      {tab === "leaderboard" && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {genderOptions.length > 0 && (
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-gray-400 bg-white"
              >
                <option value="">All categories</option>
                {genderOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            )}
            {distanceOptions.length > 0 && (
              <select
                value={filterDistance}
                onChange={(e) => setFilterDistance(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-gray-400 bg-white"
              >
                <option value="">All distances</option>
                {distanceOptions.map((d) => (
                  <option key={d} value={d}>
                    {((d * race.lap_distance_m) / 1000).toFixed(0)} km ({d}{" "}
                    laps)
                  </option>
                ))}
              </select>
            )}
            {teamOptions.length > 0 && (
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-gray-400 bg-white"
              >
                <option value="">All teams</option>
                {teamOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
            {isFiltered && (
              <button
                onClick={() => {
                  setFilterGender("");
                  setFilterDistance("");
                  setFilterTeam("");
                }}
                className="text-sm text-gray-400 hover:text-black transition-colors px-2"
              >
                Clear ✕
              </button>
            )}
          </div>

          {/* Unified table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="pb-2 pr-3">Pos.</th>
                  <th className="pb-2 pr-3">Bib</th>
                  <th className="pb-2 pr-3">Participant</th>
                  <th className="pb-2 pr-3">Category</th>
                  <th className="pb-2 pr-3">Team</th>
                  <th className="pb-2 pr-3">Country</th>
                  <th className="pb-2 pr-3 text-right">Distance</th>
                  <th className="pb-2 pr-3 text-right">Finish time</th>
                  {Array.from({ length: maxLaps }, (_, j) => (
                    <th key={j} className="pb-2 pr-3 text-right">
                      Lap {j + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr
                    key={row.runner.id}
                    className={`border-b border-gray-50 ${row.finished ? "text-green-700" : ""}`}
                  >
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
                    <td className="py-3 pr-3 text-right text-gray-500">
                      {row.runner.laps_count
                        ? `${((row.runner.laps_count * race.lap_distance_m) / 1000).toFixed(0)} km`
                        : "—"}
                    </td>
                    <td className="py-3 pr-3 text-right font-mono">
                      {row.finished && row.lastElapsed
                        ? formatTime(row.lastElapsed)
                        : "—"}
                    </td>
                    {Array.from({ length: maxLaps }, (_, k) => (
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
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8 + maxLaps}
                      className="py-8 text-center text-gray-400"
                    >
                      No runners match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistics tab */}
      {tab === "stats" && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            Overview
          </p>
          <div className="grid grid-cols-2 gap-3 mb-8 sm:grid-cols-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Finishers</p>
              <p className="text-2xl font-medium">{stats.finishers}</p>
              <p className="text-sm text-gray-400">of {stats.total} starters</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Total distance</p>
              <p className="text-2xl font-medium">
                {(stats.totalDistanceM / 1000).toFixed(1)} km
              </p>
              <p className="text-sm text-gray-400">across all runners</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Fastest finish</p>
              <p className="text-2xl font-medium">
                {stats.fastestFinisher
                  ? formatTime(stats.fastestFinisher.lastElapsed!)
                  : "—"}
              </p>
              <p className="text-sm text-gray-400">
                {stats.fastestFinisher
                  ? (stats.fastestFinisher.runner.name ??
                    `Bib #${stats.fastestFinisher.runner.bib_number}`)
                  : "—"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Avg. finish time</p>
              <p className="text-2xl font-medium">
                {stats.avgFinishMs ? formatTime(stats.avgFinishMs) : "—"}
              </p>
              <p className="text-sm text-gray-400">all categories</p>
            </div>
          </div>

          {stats.teamStats.length > 0 && (
            <div className="mb-8">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">
                Teams by total distance
              </p>
              <div className="flex flex-col gap-3">
                {stats.teamStats.map(({ name, distM }) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-36 truncate">
                      {name}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-2 bg-black rounded-full"
                        style={{
                          width: `${(distM / stats.maxTeamDist) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-16 text-right font-mono">
                      {(distM / 1000).toFixed(1)} km
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.categoryStats.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                Category breakdown
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.categoryStats.map((cat, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">
                      {cat.name} ·{" "}
                      {((cat.laps_count * race.lap_distance_m) / 1000).toFixed(
                        0,
                      )}
                      km
                    </p>
                    <p className="text-2xl font-medium">{cat.finishers}</p>
                    <p className="text-sm text-gray-400">finishers</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
  lastElapsed: number | null;
  finished: boolean;
}

function buildLeaderboard(
  runners: Runner[],
  laps: Lap[],
  totalLaps: number,
): RunnerRow[] {
  return runners
    .map((runner) => {
      const runnerLaps = laps.filter((l) => l.runner_id === runner.id);
      const lapsCompleted = runnerLaps.length;
      const lastLap = runnerLaps[runnerLaps.length - 1];
      return {
        runner,
        lapsCompleted,
        lastElapsed: lastLap?.elapsed_ms ?? null,
        finished: lapsCompleted >= totalLaps,
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

  const leaderboard = buildLeaderboard(runners, laps, race.laps_count);

  function exportCsv() {
    const headers = ["Position", "Bib", "Name", "Laps completed", "Time"];
    const rows = leaderboard.map((row, i) => [
      i + 1,
      row.runner.bib_number,
      row.runner.name ?? "",
      `${row.lapsCompleted}/${race.laps_count}`,
      row.lastElapsed ? formatTime(row.lastElapsed) : "",
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

  if (!runners.length) {
    return <p className="text-gray-400">No runners registered yet.</p>;
  }

  return (
    <div>
      {race.status === "active" && (
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-green-600 font-medium">Live</span>
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        {race.status === "active" && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-600 font-medium">Live</span>
          </div>
        )}
        {race.status !== "active" && <div />}
        {leaderboard.length > 0 && (
          <button
            onClick={exportCsv}
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            Export CSV ↓
          </button>
        )}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-100">
            <th className="pb-2 w-8">#</th>
            <th className="pb-2 w-12">Bib</th>
            <th className="pb-2">Name</th>
            <th className="pb-2 text-right">Laps</th>
            <th className="pb-2 text-right">Time</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((row, i) => (
            <tr key={row.runner.id} className="border-b border-gray-50">
              <td className="py-3 text-gray-400">{i + 1}</td>
              <td className="py-3 font-mono font-medium">
                {row.runner.bib_number}
              </td>
              <td className="py-3">{row.runner.name ?? "—"}</td>
              <td className="py-3 text-right">
                {row.lapsCompleted}/{race.laps_count}
                {row.finished && <span className="ml-1 text-green-600">✓</span>}
              </td>
              <td className="py-3 text-right font-mono">
                {row.lastElapsed ? formatTime(row.lastElapsed) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

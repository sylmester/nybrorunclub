"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

export default function TimerClient({
  race: initialRace,
  initialRunners,
  initialLaps,
}: Props) {
  const [race, setRace] = useState(initialRace);
  const [runners, setRunners] = useState<Runner[]>(initialRunners);
  const [laps, setLaps] = useState<Lap[]>(initialLaps);
  const [elapsed, setElapsed] = useState(0);
  const [bibInput, setBibInput] = useState("");
  const [newBib, setNewBib] = useState("");
  const [newName, setNewName] = useState("");
  const [feedback, setFeedback] = useState<{
    message: string;
    ok: boolean;
  } | null>(null);
  const bibRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Run the clock
  useEffect(() => {
    if (race.status !== "active" || !race.started_at) return;
    const tick = () => {
      setElapsed(Date.now() - new Date(race.started_at!).getTime());
    };
    tick();
    intervalRef.current = setInterval(tick, 100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [race.status, race.started_at]);

  const showFeedback = useCallback((message: string, ok: boolean) => {
    setFeedback({ message, ok });
    setTimeout(() => setFeedback(null), 2000);
  }, []);

  async function startRace() {
    const res = await fetch(`/api/races/${race.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "active",
        started_at: new Date().toISOString(),
      }),
    });
    const updated = await res.json();
    setRace(updated);
    setTimeout(() => bibRef.current?.focus(), 100);
  }

  async function finishRace() {
    if (!confirm("Mark this race as finished?")) return;
    const res = await fetch(`/api/races/${race.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "finished" }),
    });
    const updated = await res.json();
    setRace(updated);
  }

  async function recordLap(e: React.FormEvent) {
    e.preventDefault();
    if (!bibInput.trim()) return;
    const currentElapsed = Date.now() - new Date(race.started_at!).getTime();

    const res = await fetch("/api/laps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        race_id: race.id,
        bib_number: Number(bibInput),
        elapsed_ms: currentElapsed,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setLaps((prev) => [...prev, data]);
      const lapCount =
        laps.filter((l) => l.runner_id === data.runner_id).length + 1;
      const isFinish = lapCount >= race.laps_count;
      showFeedback(
        `#${bibInput} — ${isFinish ? "🏁 Finished!" : `Lap ${lapCount}/${race.laps_count}`} — ${formatTime(currentElapsed)}`,
        true,
      );
    } else {
      showFeedback(`Bib #${bibInput} not found`, false);
    }

    setBibInput("");
    bibRef.current?.focus();
  }

  async function addRunner(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/races/${race.id}/runners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bib_number: Number(newBib),
        name: newName || null,
      }),
    });
    if (res.ok) {
      const runner = await res.json();
      setRunners((prev) =>
        [...prev, runner].sort((a, b) => a.bib_number - b.bib_number),
      );
      setNewBib("");
      setNewName("");
    }
  }

  // Build runner status table
  const runnerRows = runners
    .map((runner) => {
      const runnerLaps = laps.filter((l) => l.runner_id === runner.id);
      const lapsCompleted = runnerLaps.length;
      const lastLap = runnerLaps[runnerLaps.length - 1];
      return {
        runner,
        lapsCompleted,
        lastElapsed: lastLap?.elapsed_ms ?? null,
        finished: lapsCompleted >= race.laps_count,
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

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <a
        href="/admin/dashboard"
        className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block"
      >
        ← Dashboard
      </a>

      {/* Race header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-medium">{race.name}</h1>
          <p className="text-gray-500 mt-1">
            {race.laps_count} laps · {race.lap_distance_m}m
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-mono font-medium">
            {formatTime(elapsed)}
          </div>
          <div className="mt-2">
            {race.status === "pending" && (
              <button
                onClick={startRace}
                disabled={runners.length === 0}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40 text-sm"
              >
                Start race
              </button>
            )}
            {race.status === "active" && (
              <button
                onClick={finishRace}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                End race
              </button>
            )}
            {race.status === "finished" && (
              <span className="text-sm text-gray-400">Race finished</span>
            )}
          </div>
        </div>
      </div>

      {/* Bib input — only when active */}
      {race.status === "active" && (
        <form onSubmit={recordLap} className="mb-8">
          <label className="text-sm text-gray-500 mb-2 block">
            Enter bib number
          </label>
          <div className="flex gap-2">
            <input
              ref={bibRef}
              type="number"
              value={bibInput}
              onChange={(e) => setBibInput(e.target.value)}
              placeholder="Bib #"
              className="border-2 border-black rounded-lg px-4 py-3 text-2xl font-mono w-40 outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors text-lg"
            >
              Record
            </button>
          </div>
          {feedback && (
            <p
              className={`mt-3 text-sm font-medium ${feedback.ok ? "text-green-600" : "text-red-500"}`}
            >
              {feedback.message}
            </p>
          )}
        </form>
      )}

      {/* Add runners — only when pending */}
      {race.status === "pending" && (
        <div className="mb-8 p-4 border border-gray-200 rounded-lg">
          <h2 className="font-medium mb-3">Add runners</h2>
          <form onSubmit={addRunner} className="flex gap-2">
            <input
              type="number"
              value={newBib}
              onChange={(e) => setNewBib(e.target.value)}
              placeholder="Bib #"
              required
              className="border border-gray-200 rounded-lg px-3 py-2 w-24 outline-none focus:border-gray-400"
            />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name (optional)"
              className="border border-gray-200 rounded-lg px-3 py-2 flex-1 outline-none focus:border-gray-400"
            />
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              Add
            </button>
          </form>
        </div>
      )}

      {/* Runner status table */}
      {runners.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="pb-2 w-8">#</th>
              <th className="pb-2 w-16">Bib</th>
              <th className="pb-2">Name</th>
              <th className="pb-2 text-right">Laps</th>
              <th className="pb-2 text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {runnerRows.map((row, i) => (
              <tr
                key={row.runner.id}
                className={`border-b border-gray-50 ${row.finished ? "text-green-600" : ""}`}
              >
                <td className="py-3 text-gray-400">{i + 1}</td>
                <td className="py-3 font-mono font-medium">
                  {row.runner.bib_number}
                </td>
                <td className="py-3">{row.runner.name ?? "—"}</td>
                <td className="py-3 text-right">
                  {row.lapsCompleted}/{race.laps_count}
                  {row.finished && <span className="ml-1">✓</span>}
                </td>
                <td className="py-3 text-right font-mono">
                  {row.lastElapsed ? formatTime(row.lastElapsed) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {race.status === "pending" && runners.length === 0 && (
        <p className="text-gray-400 text-sm">
          Add at least one runner before starting.
        </p>
      )}
    </main>
  );
}

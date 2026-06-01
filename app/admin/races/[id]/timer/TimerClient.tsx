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
  const [newGender, setNewGender] = useState("");
  const uniqueGenders = [...new Set(race.categories.map((c) => c.name))];
  const availableLaps = race.categories.filter((c) => c.name === newGender);
  const [newTeam, setNewTeam] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newLapsCount, setNewLapsCount] = useState("");
  const [feedback, setFeedback] = useState<{
    message: string;
    ok: boolean;
  } | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const bibRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (race.status !== "active" || !race.started_at) return;
    const tick = () =>
      setElapsed(Date.now() - new Date(race.started_at!).getTime());
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
    setRace(await res.json());
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
        gender: newGender || null,
        team: newTeam || null,
        country: newCountry || null,
        laps_count: newLapsCount ? Number(newLapsCount) : null,
      }),
    });
    if (res.ok) {
      const runner = await res.json();
      setRunners((prev) =>
        [...prev, runner].sort((a, b) => a.bib_number - b.bib_number),
      );
      setNewBib("");
      setNewName("");
      setNewGender("");
      setNewTeam("");
      setNewCountry("");
      setNewLapsCount("");
    }
  }

  async function removeRunner(runnerId: string, bibNumber: number) {
    if (!confirm(`Remove bib #${bibNumber} from this race?`)) return;
    await fetch(`/api/races/${race.id}/runners/${runnerId}`, {
      method: "DELETE",
    });
    setRunners((prev) => prev.filter((r) => r.id !== runnerId));
    setLaps((prev) => prev.filter((l) => l.runner_id !== runnerId));
  }

  async function undoLastLap(runnerId: string, bibNumber: number) {
    const runnerLaps = laps.filter((l) => l.runner_id === runnerId);
    if (!runnerLaps.length) return;
    const lastLap = runnerLaps[runnerLaps.length - 1];
    if (!confirm(`Undo last lap for bib #${bibNumber}?`)) return;
    await fetch(`/api/laps/${lastLap.id}`, { method: "DELETE" });
    setLaps((prev) => prev.filter((l) => l.id !== lastLap.id));
  }

  async function importCsv(e: React.ChangeEvent<HTMLInputElement>) {
    setCsvError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text
      .trim()
      .split("\n")
      .filter((l) => l.trim());

    // Skip header row if present
    const dataLines = lines[0].toLowerCase().includes("bib")
      ? lines.slice(1)
      : lines;

    let imported = 0;
    let errors = 0;

    for (const line of dataLines) {
      const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
      const bib = parseInt(parts[0]);
      const name = parts[1] || null;
      const gender = parts[2] || null;
      const team = parts[3] || null;
      const country = parts[4] || null;
      const laps_count = parts[5] ? parseInt(parts[5]) : null;

      if (isNaN(bib)) {
        errors++;
        continue;
      }

      const res = await fetch(`/api/races/${race.id}/runners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bib_number: bib,
          name,
          gender,
          team,
          country,
          laps_count,
        }),
      });
      if (res.ok) {
        const runner = await res.json();
        setRunners((prev) => {
          const exists = prev.find((r) => r.id === runner.id);
          if (exists) return prev;
          return [...prev, runner].sort((a, b) => a.bib_number - b.bib_number);
        });
        imported++;
      } else {
        errors++;
      }
    }

    if (fileRef.current) fileRef.current.value = "";
    setCsvError(
      errors > 0
        ? `Imported ${imported} runners. ${errors} skipped (duplicate bib or invalid row).`
        : `Imported ${imported} runners successfully.`,
    );
  }

  const runnerRows = runners
    .map((runner) => {
      const runnerLaps = laps.filter((l) => l.runner_id === runner.id);
      const lapsCompleted = runnerLaps.length;
      const lastLap = runnerLaps[runnerLaps.length - 1];
      const targetLaps = runner.laps_count ?? race.laps_count;
      return {
        runner,
        lapsCompleted,
        targetLaps,
        lastElapsed: lastLap?.elapsed_ms ?? null,
        lastLapId: lastLap?.id ?? null,
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

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <a
        href="/admin/dashboard"
        className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block"
      >
        ← Dashboard
      </a>

      {/* Header */}
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

      {/* Bib input */}
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

      {/* Add runners + CSV import */}
      {race.status === "pending" && (
        <div className="mb-8 p-4 border border-gray-200 rounded-lg space-y-4">
          <h2 className="font-medium">Add runners</h2>

          {/* Manual add */}
          <form onSubmit={addRunner} className="flex flex-col gap-2">
            <div className="flex gap-2">
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
                placeholder="Name"
                className="border border-gray-200 rounded-lg px-3 py-2 flex-1 outline-none focus:border-gray-400"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={newGender}
                onChange={(e) => setNewGender(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
              >
                <option value="">Gender</option>
                {uniqueGenders.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                placeholder="Team"
                className="border border-gray-200 rounded-lg px-3 py-2 flex-1 outline-none focus:border-gray-400"
              />
              <input
                type="text"
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                placeholder="Country"
                className="border border-gray-200 rounded-lg px-3 py-2 w-28 outline-none focus:border-gray-400"
              />
              <select
                value={newLapsCount}
                onChange={(e) => setNewLapsCount(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
                required
              >
                <option value="">Laps</option>
                {availableLaps.map((c, i) => (
                  <option key={i} value={c.laps_count}>
                    {c.laps_count} laps
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                Add
              </button>
            </div>
          </form>

          {/* CSV import */}
          <div>
            <p className="text-sm text-gray-500 mb-1">
              Or import from CSV{" "}
              <span className="text-gray-400">
                (columns: bib, name, gender, team, country, laps_count)
              </span>
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={importCsv}
              className="text-sm text-gray-600"
            />
            {csvError && (
              <p className="text-sm mt-1 text-blue-600">{csvError}</p>
            )}
          </div>
        </div>
      )}

      {/* Runner table */}
      {runners.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="pb-2 w-8">#</th>
              <th className="pb-2 w-16">Bib</th>
              <th className="pb-2">Name</th>
              <th className="pb-2 text-right">Laps</th>
              <th className="pb-2 text-right">Time</th>
              <th className="pb-2 w-20"></th>
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
                  {row.lapsCompleted}/{row.targetLaps}
                  {row.finished && <span className="ml-1">✓</span>}
                </td>
                <td className="py-3 text-right font-mono">
                  {row.lastElapsed ? formatTime(row.lastElapsed) : "—"}
                </td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {race.status === "active" && row.lapsCompleted > 0 && (
                      <button
                        onClick={() =>
                          undoLastLap(row.runner.id, row.runner.bib_number)
                        }
                        className="text-xs text-amber-500 hover:text-amber-700"
                        title="Undo last lap"
                      >
                        Undo
                      </button>
                    )}
                    {race.status === "pending" && (
                      <button
                        onClick={() =>
                          removeRunner(row.runner.id, row.runner.bib_number)
                        }
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {race.status === "pending" && runners.length === 0 && (
        <p className="text-gray-400 text-sm mt-4">
          Add at least one runner before starting.
        </p>
      )}
    </main>
  );
}

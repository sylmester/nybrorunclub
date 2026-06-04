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

interface LogEntry {
  lapId: string;
  runnerId: string;
  bibNumber: number;
  runnerName: string | null;
  lapNumber: number;
  elapsedMs: number;
  isFinish: boolean;
  isOverLimit: boolean;
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
  const [log, setLog] = useState<LogEntry[]>([]);
  const [newBib, setNewBib] = useState("");
  const [newName, setNewName] = useState("");
  const [newGender, setNewGender] = useState("");
  const [newTeam, setNewTeam] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newLapsCount, setNewLapsCount] = useState("");
  const [csvError, setCsvError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    ok: boolean;
    warn?: boolean;
  } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uniqueGenders = [...new Set(race.categories.map((c) => c.name))];
  const availableLaps = race.categories.filter((c) => c.name === newGender);

  // Timer
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

  // Keyboard input
  useEffect(() => {
    if (race.status !== "active") return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key >= "0" && e.key <= "9") {
        numpadPress(e.key);
      } else if (e.key === "Backspace") {
        numpadPress("DEL");
      } else if (e.key === "Enter") {
        recordLap();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [race.status, bibInput, laps, runners]);

  // Feedback handler
  const showFeedback = useCallback((message: string, ok: boolean) => {
    setFeedback({ message, ok });
    setTimeout(() => setFeedback(null), 5000);
  }, []);

  // Publish
  async function publishRace() {
    const res = await fetch(`/api/races/${race.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending" }),
    });
    setRace(await res.json());
  }

  // Start
  async function startRace() {
    const res = await fetch(`/api/races/${race.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "active",
        started_at: new Date().toISOString(),
      }),
    });
    setRace(await res.json());
  }

  // Finish
  async function finishRace() {
    if (!confirm("Mark this race as finished?")) return;
    const res = await fetch(`/api/races/${race.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "finished" }),
    });
    setRace(await res.json());
  }

  // Numpad press
  function numpadPress(val: string) {
    if (val === "DEL") {
      setBibInput((prev) => prev.slice(0, -1));
    } else if (bibInput.length < 4) {
      setBibInput((prev) => prev + val);
    }
  }

  // Record lap
  async function recordLap() {
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
      const runner = runners.find((r) => r.id === data.runner_id);
      const runnerLapCount =
        laps.filter((l) => l.runner_id === data.runner_id).length + 1;
      const targetLaps = runner?.laps_count ?? race.laps_count;
      const isFinish = runnerLapCount >= targetLaps;
      const entry: LogEntry = {
        lapId: data.id,
        runnerId: data.runner_id,
        bibNumber: Number(bibInput),
        runnerName: runner?.name ?? null,
        lapNumber: runnerLapCount,
        elapsedMs: currentElapsed,
        isFinish,
        isOverLimit: runnerLapCount > targetLaps,
      };
      setLog((prev) => [entry, ...prev]);

      if (runnerLapCount > targetLaps) {
        setFeedback({
          message: `⚠ #${bibInput} exceeded ${targetLaps} laps (${runnerLapCount} recorded)`,
          ok: false,
          warn: true,
        });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        showFeedback(
          isFinish
            ? `#${bibInput} Finished!`
            : `#${bibInput} Lap ${runnerLapCount}`,
          true,
        );
      }
    } else {
      showFeedback(`Bib #${bibInput} not found`, false);
    }
    setBibInput("");
  }

  // Undo log entry
  async function undoLogEntry(entry: LogEntry) {
    if (!confirm(`Undo lap for bib #${entry.bibNumber}?`)) return;
    await fetch(`/api/laps/${entry.lapId}`, { method: "DELETE" });
    setLaps((prev) => prev.filter((l) => l.id !== entry.lapId));
    setLog((prev) => prev.filter((l) => l.lapId !== entry.lapId));
  }

  // Add runner
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

  // Remove runner
  async function removeRunner(runnerId: string, bibNumber: number) {
    if (!confirm(`Remove bib #${bibNumber} from this race?`)) return;
    await fetch(`/api/races/${race.id}/runners/${runnerId}`, {
      method: "DELETE",
    });
    setRunners((prev) => prev.filter((r) => r.id !== runnerId));
    setLaps((prev) => prev.filter((l) => l.runner_id !== runnerId));
  }

  // Import CSV
  async function importCsv(e: React.ChangeEvent<HTMLInputElement>) {
    setCsvError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text
      .trim()
      .split("\n")
      .filter((l) => l.trim());
    const dataLines = lines[0].toLowerCase().includes("bib")
      ? lines.slice(1)
      : lines;
    let imported = 0,
      errors = 0;
    for (const line of dataLines) {
      const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
      const bib = parseInt(parts[0]);
      if (isNaN(bib)) {
        errors++;
        continue;
      }
      const res = await fetch(`/api/races/${race.id}/runners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bib_number: bib,
          name: parts[1] || null,
          gender: parts[2] || null,
          team: parts[3] || null,
          country: parts[4] || null,
          laps_count: parts[5] ? parseInt(parts[5]) : null,
        }),
      });
      if (res.ok) {
        const runner = await res.json();
        setRunners((prev) => {
          if (prev.find((r) => r.id === runner.id)) return prev;
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
        ? `Imported ${imported} runners. ${errors} skipped.`
        : `Imported ${imported} runners successfully.`,
    );
  }

  // Prepare runner rows with status
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
    <main className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <a
        href="/admin/dashboard"
        className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block"
      >
        ← Dashboard
      </a>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-medium">{race.name}</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {race.laps_count} laps · {race.lap_distance_m}m
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-mono font-medium">
            {formatTime(elapsed)}
          </div>
          <div className="mt-2">
            {race.status === "draft" && (
              <button
                onClick={publishRace}
                className="bg-blue-100 text-gray-500 px-6 py-2 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-40 text-sm border border-blue"
              >
                Publish race
              </button>
            )}
            {race.status === "pending" && (
              <button
                onClick={startRace}
                disabled={runners.length === 0}
                className="bg-green-100 text-green-600 px-6 py-2 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-40 text-sm border border-green"
              >
                Start race
              </button>
            )}
            {race.status === "active" && (
              <button
                onClick={finishRace}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm border border-red"
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

      {/* Numpad — only when active */}
      {race.status === "active" && (
        <div className="mb-8">
          {/* Display */}
          <div
            className={`border-2 rounded-xl px-6 py-4 text-6xl font-mono text-center tracking-widest mb-3 transition-colors ${bibInput ? "border-black" : "border-gray-200 text-gray-300"}`}
          >
            {bibInput || "—"}
          </div>

          {/* Number grid */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
              <button
                key={n}
                onClick={() => numpadPress(n)}
                className="bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all rounded-xl py-5 text-2xl font-medium"
              >
                {n}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => numpadPress("DEL")}
              className="bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all rounded-xl py-5 text-lg font-medium text-gray-500"
            >
              ⌫
            </button>
            <button
              onClick={() => numpadPress("0")}
              className="bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all rounded-xl py-5 text-2xl font-medium"
            >
              0
            </button>
            <button
              onClick={recordLap}
              disabled={!bibInput}
              className="bg-black text-white hover:bg-gray-800 active:scale-95 transition-all rounded-xl py-5 text-lg font-medium disabled:opacity-30"
            >
              ✓
            </button>
          </div>

          {/* Feedback */}
          {feedback && (
            <p
              className={`text-center text-sm font-medium mb-3 ${
                feedback.warn
                  ? "text-amber-500"
                  : feedback.ok
                    ? "text-green-600"
                    : "text-red-500"
              }`}
            >
              {feedback.message}
            </p>
          )}
        </div>
      )}

      {/* Recording log */}
      {race.status === "active" && log.length > 0 && (
        <div className="mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            Recent recordings
          </p>
          <div className="flex flex-col gap-2">
            {log.map((entry) => (
              <div
                key={entry.lapId}
                className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-medium text-lg w-10">
                    #{entry.bibNumber}
                  </span>
                  <div>
                    <span className="text-sm">
                      {entry.runnerName ?? `Bib #${entry.bibNumber}`}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {entry.isOverLimit ? (
                        <span className="text-amber-500">
                          ⚠ Lap {entry.lapNumber} (limit{" "}
                          {runners.find((r) => r.id === entry.runnerId)
                            ?.laps_count ?? race.laps_count}
                          )
                        </span>
                      ) : entry.isFinish ? (
                        <span className="text-green-600">🏁 Finished</span>
                      ) : (
                        `Lap ${entry.lapNumber}`
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-gray-500">
                    {formatTime(entry.elapsedMs)}
                  </span>
                  <button
                    onClick={() => undoLogEntry(entry)}
                    className="text-xs text-amber-500 hover:text-amber-700 transition-colors"
                  >
                    Undo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add runners */}
      {(race.status === "pending" || race.status === "draft") && (
        <div className="mb-8 p-4 border border-gray-200 rounded-lg space-y-4">
          <h2 className="font-medium">Add runners</h2>
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
            <div className="flex gap-2 flex-wrap">
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
                required
                className="border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
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
          <div>
            <p className="text-sm text-gray-500 mb-1">
              Or import from CSV{" "}
              <span className="text-gray-400">
                (bib, name, gender, team, country, laps_count)
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
        <div className="overflow-x-auto -mx-4 md:-mx-8 px-4 md:px-8">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            Runners
          </p>
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
                <th className="pb-2 pr-3 text-right">Progress</th>
                <th className="pb-2 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {runnerRows.map((row, i) => (
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
                  <td className="py-3 pr-3 text-right">
                    {row.lapsCompleted}/{row.targetLaps}
                    {row.finished && <span className="ml-1">✓</span>}
                  </td>
                  <td className="py-3 text-right">
                    {(race.status === "pending" || race.status === "draft") && (
                      <button
                        onClick={() =>
                          removeRunner(row.runner.id, row.runner.bib_number)
                        }
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove runner"
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
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {race.status === "pending" && runners.length === 0 && (
        <p className="text-gray-400 text-sm mt-4">
          Add at least one runner before starting.
        </p>
      )}
    </main>
  );
}

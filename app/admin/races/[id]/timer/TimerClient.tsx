"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Race, Participant, Lap } from "@/types";

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
  initialParticipants: Participant[];
  initialLaps: Lap[];
}

interface LogEntry {
  lapId: string;
  participantId: string;
  bibNumber: number;
  participantName: string | null;
  lapNumber: number;
  elapsedMs: number;
  isFinish: boolean;
  isOverLimit: boolean;
}

export default function TimerClient({
  race: initialRace,
  initialParticipants,
  initialLaps,
}: Props) {
  const [race, setRace] = useState(initialRace);
  const [participants] = useState<Participant[]>(initialParticipants);
  const [laps, setLaps] = useState<Lap[]>(initialLaps);
  const [elapsed, setElapsed] = useState(0);
  const [bibInput, setBibInput] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [feedback, setFeedback] = useState<{
    message: string;
    ok: boolean;
    warn?: boolean;
  } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer
  useEffect(() => {
    if (!race.started_at) return;

    if (race.status === "finished" && race.ended_at) {
      setElapsed(
        new Date(race.ended_at).getTime() - new Date(race.started_at).getTime(),
      );
      return;
    }

    if (race.status !== "active") return;

    const tick = () =>
      setElapsed(Date.now() - new Date(race.started_at!).getTime());
    tick();
    intervalRef.current = setInterval(tick, 100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [race.status, race.started_at, race.ended_at]);

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
  }, [race.status, bibInput, laps, participants]);

  const showFeedback = useCallback(
    (message: string, ok: boolean, warn = false) => {
      setFeedback({ message, ok, warn });
      setTimeout(() => setFeedback(null), 5000);
    },
    [],
  );

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

  async function finishRace() {
    const res = await fetch(`/api/races/${race.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "finished",
        ended_at: new Date().toISOString(),
      }),
    });
    setRace(await res.json());
  }

  function numpadPress(val: string) {
    if (val === "DEL") {
      setBibInput((prev) => prev.slice(0, -1));
    } else if (bibInput.length < 4) {
      setBibInput((prev) => prev + val);
    }
  }

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

      const participant = participants.find(
        (p) => p.id === data.participant_id,
      );
      const participantLapCount =
        laps.filter((l) => l.participant_id === data.participant_id).length + 1;
      const targetLaps = participant?.laps_count ?? race.laps_count;
      const isFinish = participantLapCount >= targetLaps;
      const isOverLimit = participantLapCount > targetLaps;

      const entry: LogEntry = {
        lapId: data.id,
        participantId: data.participant_id,
        bibNumber: Number(bibInput),
        participantName: participant?.name ?? null,
        lapNumber: participantLapCount,
        elapsedMs: currentElapsed,
        isFinish,
        isOverLimit,
      };
      setLog((prev) => [entry, ...prev]);

      if (isOverLimit) {
        showFeedback(
          `⚠ #${bibInput} exceeded ${targetLaps} laps (${participantLapCount} recorded)`,
          false,
          true,
        );
      } else {
        showFeedback(
          isFinish
            ? `#${bibInput} Finished!`
            : `#${bibInput} Lap ${participantLapCount}`,
          true,
        );
      }
    } else {
      showFeedback(`Bib #${bibInput} not found`, false);
    }

    setBibInput("");
  }

  async function undoLogEntry(entry: LogEntry) {
    if (!confirm(`Undo lap for bib #${entry.bibNumber}?`)) return;
    await fetch(`/api/laps/${entry.lapId}`, { method: "DELETE" });
    setLaps((prev) => prev.filter((l) => l.id !== entry.lapId));
    setLog((prev) => prev.filter((l) => l.lapId !== entry.lapId));
  }

  // Participant rows with live status
  const participantRows = participants
    .filter((p) => p.bib_number !== null)
    .map((participant) => {
      const participantLaps = laps.filter(
        (l) => l.participant_id === participant.id,
      );
      const lapsCompleted = participantLaps.length;
      const lastLap = participantLaps[participantLaps.length - 1];
      const targetLaps = participant.laps_count ?? race.laps_count;
      return {
        participant,
        lapsCompleted,
        targetLaps,
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
            {race.status === "pending" && (
              <button
                onClick={startRace}
                disabled={participantRows.length === 0}
                className="bg-green-100 text-green-600 px-6 py-2 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-40 text-sm border border-green-200"
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

      {/* Numpad — only when active */}
      {race.status === "active" && (
        <div className="mb-8">
          <div
            className={`border-2 rounded-xl px-6 py-4 text-6xl font-mono text-center tracking-widest mb-3 transition-colors ${
              bibInput ? "border-black" : "border-gray-200 text-gray-300"
            }`}
          >
            {bibInput || "—"}
          </div>

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

          {feedback && (
            <p
              className={`text-center text-sm font-medium mt-3 ${
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
                      {entry.participantName ?? `Bib #${entry.bibNumber}`}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {entry.isOverLimit ? (
                        <span className="text-amber-500">
                          ⚠ Lap {entry.lapNumber} (limit{" "}
                          {participants.find(
                            (p) => p.id === entry.participantId,
                          )?.laps_count ?? race.laps_count}
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

      {/* Pending message */}
      {race.status === "pending" && participantRows.length === 0 && (
        <p className="text-gray-400 text-sm mt-4">
          No participants with bib numbers assigned yet. Go to the{" "}
          <a
            href={`/admin/races/${race.id}/participants`}
            className="underline hover:text-gray-700"
          >
            participants page
          </a>{" "}
          to assign bibs before starting.
        </p>
      )}

      {/* Participant table */}
      {participantRows.length > 0 && (
        <div className="overflow-x-auto -mx-4 md:-mx-8 px-4 md:px-8">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            Participants
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-2 pr-3">Pos.</th>
                <th className="pb-2 pr-3">Bib</th>
                <th className="pb-2 pr-3">Name</th>
                <th className="pb-2 pr-3">Gender</th>
                <th className="pb-2 pr-3">Team</th>
                <th className="pb-2 pr-3 text-right">Target</th>
                <th className="pb-2 pr-3 text-right">Finish time</th>
                <th className="pb-2 pr-3 text-right">Progress</th>
              </tr>
            </thead>
            <tbody>
              {participantRows.map((row, i) => (
                <tr
                  key={row.participant.id}
                  className={`border-b border-gray-50 ${row.finished ? "text-green-700" : ""}`}
                >
                  <td className="py-3 pr-3 text-gray-400">{i + 1}</td>
                  <td className="py-3 pr-3 font-mono font-medium">
                    {row.participant.bib_number}
                  </td>
                  <td className="py-3 pr-3">{row.participant.name ?? "—"}</td>
                  <td className="py-3 pr-3 text-gray-500">
                    {row.participant.gender ?? "—"}
                  </td>
                  <td className="py-3 pr-3 text-gray-500">
                    {row.participant.team ?? "—"}
                  </td>
                  <td className="py-3 pr-3 text-right text-gray-500">
                    {row.targetLaps
                      ? `${((row.targetLaps * race.lap_distance_m) / 1000).toFixed(0)} km`
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

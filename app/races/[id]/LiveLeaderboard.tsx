"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
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

interface ParticipantRow {
  participant: Participant;
  lapsCompleted: number;
  targetLaps: number;
  lapTimes: Lap[];
  lastElapsed: number | null;
  finished: boolean;
}

function buildLeaderboard(
  participants: Participant[],
  laps: Lap[],
  defaultLaps: number,
): ParticipantRow[] {
  return participants
    .map((participant) => {
      const participantLaps = laps
        .filter((l) => l.participant_id === participant.id)
        .sort((a, b) => a.lap_number - b.lap_number);
      const lapsCompleted = participantLaps.length;
      const targetLaps = participant.laps_count ?? defaultLaps;
      const lastLap = participantLaps[participantLaps.length - 1];
      return {
        participant,
        lapsCompleted,
        targetLaps,
        lapTimes: participantLaps,
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
  participants: Participant[],
  laps: Lap[],
  leaderboard: ParticipantRow[],
  race: Race,
) {
  const finishers = leaderboard.filter((r) => r.finished);
  const totalDistanceM = participants.reduce((sum, participant) => {
    const count = laps.filter(
      (l) => l.participant_id === participant.id,
    ).length;
    return sum + count * race.lap_distance_m;
  }, 0);

  let fastestLapMs: number | null = null;
  let fastestLapParticipant: Participant | null = null;

  participants.forEach((participant) => {
    const participantLaps = laps
      .filter((l) => l.participant_id === participant.id)
      .sort((a, b) => a.lap_number - b.lap_number);

    participantLaps.forEach((lap, i) => {
      const lapDuration =
        i === 0
          ? lap.elapsed_ms
          : lap.elapsed_ms - participantLaps[i - 1].elapsed_ms;
      if (fastestLapMs === null || lapDuration < fastestLapMs) {
        fastestLapMs = lapDuration;
        fastestLapParticipant = participant;
      }
    });
  });

  const avgFinishMs = finishers.length
    ? finishers.reduce((sum, r) => sum + (r.lastElapsed ?? 0), 0) /
      finishers.length
    : null;

  const teamMap = new Map<string, number>();
  participants.forEach((participant) => {
    const team = participant.team ?? "No team";
    const lapCount = laps.filter(
      (l) => l.participant_id === participant.id,
    ).length;
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

  const categoryStats = (race.available_laps ?? [race.laps_count]).map(
    (laps) => ({
      name: `${((laps * race.lap_distance_m) / 1000).toFixed(0)} km`,
      laps_count: laps,
      finishers: leaderboard.filter(
        (r) => r.participant.laps_count === laps && r.finished,
      ).length,
    }),
  );

  return {
    finishers: finishers.length,
    total: participants.length,
    totalDistanceM,
    fastestLapMs,
    fastestLapParticipant: fastestLapParticipant as Participant | null,
    avgFinishMs,
    teamStats,
    maxTeamDist,
    categoryStats,
  };
}

export default function LiveLeaderboard({
  race,
  initialParticipants,
  initialLaps,
}: Props) {
  const [laps, setLaps] = useState<Lap[]>(initialLaps);
  const [participants] = useState<Participant[]>(initialParticipants);
  const [tab, setTab] = useState<"leaderboard" | "stats">("leaderboard");
  const [filterGender, setFilterGender] = useState("");
  const [filterDistance, setFilterDistance] = useState("");
  const [filterTeam, setFilterTeam] = useState("");

  const isPending = race.status === "pending";
  const isActive = race.status === "active";
  const isFinished = race.status === "finished";

  const maxLaps = race?.available_laps?.length
    ? Math.max(...race.available_laps)
    : race.laps_count;

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
    () => buildLeaderboard(participants, laps, race.laps_count),
    [participants, laps, race.laps_count],
  );

  const stats = useMemo(
    () => computeStats(participants, laps, leaderboard, race),
    [participants, laps, leaderboard, race],
  );

  const genderOptions = useMemo(
    () =>
      [
        ...new Set(participants.map((p) => p.gender).filter(Boolean)),
      ] as string[],
    [participants],
  );
  const distanceOptions = useMemo(
    () =>
      [...new Set(participants.map((p) => p.laps_count).filter(Boolean))].sort(
        (a, b) => (a ?? 0) - (b ?? 0),
      ) as number[],
    [participants],
  );
  const teamOptions = useMemo(
    () =>
      [...new Set(participants.map((p) => p.team).filter(Boolean))] as string[],
    [participants],
  );

  const filtered = useMemo(
    () =>
      leaderboard.filter((row) => {
        if (filterGender && row.participant.gender !== filterGender)
          return false;
        if (
          filterDistance &&
          row.participant.laps_count !== Number(filterDistance)
        )
          return false;
        if (filterTeam && row.participant.team !== filterTeam) return false;
        return true;
      }),
    [leaderboard, filterGender, filterDistance, filterTeam],
  );

  const isFiltered = filterGender || filterDistance || filterTeam;

  function exportCsv() {
    const headers = [
      "Pos",
      "Name",
      "Gender",
      "Team",
      "Distance",
      "Finish time",
    ];
    if (isActive || isFinished) headers.splice(1, 0, "Bib");
    const rows = filtered.map((row, i) => {
      const base = [
        i + 1,
        row.participant.name ?? "",
        row.participant.gender ?? "",
        row.participant.team ?? "",
        row.targetLaps
          ? `${((row.targetLaps * race.lap_distance_m) / 1000).toFixed(0)} km`
          : "",
        row.lastElapsed ? formatTime(row.lastElapsed) : "",
      ];
      if (isActive || isFinished)
        base.splice(1, 0, row.participant.bib_number ?? "");
      return base;
    });
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${race.name.replace(/\s+/g, "_")}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Pending state — show signup list without timing info
  if (isPending) {
    return (
      <div>
        {race.description && (
          <p className="text-gray-500 mb-6 leading-relaxed">
            {race.description}
          </p>
        )}
        {participants.length === 0 ? (
          <p className="text-gray-400">No participants signed up yet.</p>
        ) : (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
              {participants.length} participant
              {participants.length !== 1 ? "s" : ""} registered
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100">
                    <th className="pb-2 pr-3">#</th>
                    <th className="pb-2 pr-3">Name</th>
                    <th className="pb-2 pr-3">Gender</th>
                    <th className="pb-2 pr-3">Team</th>
                    <th className="pb-2 pr-3 text-right">Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p, i) => (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="py-3 pr-3 text-gray-400">{i + 1}</td>
                      <td className="py-3 pr-3 font-medium">{p.name}</td>
                      <td className="py-3 pr-3 text-gray-500">
                        {p.gender ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-gray-500">
                        {p.team ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-right text-gray-500">
                        {p.laps_count
                          ? `${((p.laps_count * race.lap_distance_m) / 1000).toFixed(0)} km`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active / finished state — full leaderboard with timing
  return (
    <div>
      {race.description && (
        <p className="text-gray-500 mb-6 leading-relaxed">{race.description}</p>
      )}

      <hr className="my-6 border-gray-100" />

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
        <button
          onClick={exportCsv}
          className="text-sm text-gray-500 hover:text-black transition-colors"
        >
          Export CSV ↓
        </button>
      </div>

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

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  {isFinished && <th className="pb-2 pr-3">Pos.</th>}
                  {(isActive || isFinished) && (
                    <th className="pb-2 pr-3">Bib</th>
                  )}
                  <th className="pb-2 pr-3">Name</th>
                  <th className="pb-2 pr-3">Gender</th>
                  <th className="pb-2 pr-3">Team</th>
                  <th className="pb-2 pr-3 text-right">Distance</th>
                  {(isActive || isFinished) && (
                    <>
                      <th className="pb-2 pr-3 text-right">Progress</th>
                      <th className="pb-2 pr-3 text-right">Finish time</th>
                      {isFinished &&
                        Array.from({ length: maxLaps }, (_, j) => (
                          <th key={j} className="pb-2 pr-3 text-right">
                            Lap {j + 1}
                          </th>
                        ))}
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr
                    key={row.participant.id}
                    className={`border-b border-gray-50 ${row.finished ? "text-green-700" : ""}`}
                  >
                    {isFinished && (
                      <td className="py-3 pr-3 text-gray-400">{i + 1}</td>
                    )}
                    {(isActive || isFinished) && (
                      <td className="py-3 pr-3 font-mono font-medium">
                        {row.participant.bib_number ?? "—"}
                      </td>
                    )}
                    <td className="py-3 pr-3 font-medium">
                      {row.participant.name ?? "—"}
                    </td>
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
                    {(isActive || isFinished) && (
                      <>
                        <td className="py-3 pr-3 text-right text-gray-500">
                          {row.lapsCompleted}/{row.targetLaps}
                        </td>
                        <td className="py-3 pr-3 text-right font-mono">
                          {row.finished && row.lastElapsed
                            ? formatTime(row.lastElapsed)
                            : "—"}
                        </td>
                        {isFinished &&
                          Array.from({ length: maxLaps }, (_, k) => (
                            <td
                              key={k}
                              className="py-3 pr-3 text-right font-mono text-gray-400"
                            >
                              {row.lapTimes[k]
                                ? formatTime(row.lapTimes[k].elapsed_ms)
                                : "—"}
                            </td>
                          ))}
                      </>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-gray-400">
                      No participants match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              <p className="text-xs text-gray-400 mb-1">Fastest lap</p>
              <p className="text-2xl font-medium">
                {stats.fastestLapMs ? formatTime(stats.fastestLapMs) : "—"}
              </p>
              <p className="text-sm text-gray-400">
                {stats.fastestLapParticipant?.name ?? "—"}
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
                      )}{" "}
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

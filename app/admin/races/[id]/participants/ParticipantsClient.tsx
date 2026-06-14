"use client";

import { useState } from "react";
import { Race, Participant } from "@/types";

interface Props {
  race: Race;
  initialParticipants: Participant[];
}

export default function ParticipantsClient({
  race,
  initialParticipants,
}: Props) {
  const [participants, setParticipants] =
    useState<Participant[]>(initialParticipants);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [commentSheet, setCommentSheet] = useState<Participant | null>(null);

  async function updateParticipant(id: string, fields: Partial<Participant>) {
    setSaving(id);
    setError(null);

    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...fields } : p)),
    );

    const res = await fetch(`/api/participants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setParticipants(initialParticipants);
    }

    setSaving(null);
  }

  async function deleteParticipant(id: string, name: string) {
    if (!confirm(`Remove "${name}" from this race?`)) return;
    setSaving(id);
    await fetch(`/api/participants/${id}`, { method: "DELETE" });
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    setSaving(null);
  }

  async function autoAssignBibs() {
    if (
      !confirm(
        "Auto-assign bib numbers by sign-up order? This will overwrite any existing bibs.",
      )
    )
      return;

    await Promise.all(
      participants.map((p, i) =>
        fetch(`/api/participants/${p.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bib_number: i + 1 }),
        }),
      ),
    );

    setParticipants((prev) =>
      prev.map((p, i) => ({ ...p, bib_number: i + 1 })),
    );
  }

  async function copyEmail(email: string) {
    await navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  }

  const withBib = participants.filter((p) => p.bib_number !== null).length;
  const withLaps = participants.filter((p) => p.laps_count !== null).length;

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <a
        href="/admin/dashboard"
        className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block"
      >
        ← Dashboard
      </a>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-medium">{race.name}</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {participants.length} participants · {withBib} bibs assigned ·{" "}
            {withLaps} distances set
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/admin/races/${race.id}/timer`}
            className="inline-flex items-center gap-1.5 border border-gray-200 px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
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
          </a>
          <button
            onClick={autoAssignBibs}
            disabled={participants.length === 0}
            className="inline-flex items-center gap-1.5 border border-gray-200 px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            Auto-assign bibs
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {participants.length === 0 ? (
        <p className="text-gray-400 text-sm">
          No participants yet.{" "}
          <a
            href={`/signup?race=${race.id}`}
            className="underline hover:text-gray-700"
          >
            Share the signup link →
          </a>
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-2 pr-3">Bib</th>
                <th className="pb-2 pr-3">Name</th>
                <th className="pb-2 pr-3">Email</th>
                <th className="pb-2 pr-3">Gender</th>
                <th className="pb-2 pr-3">Team</th>
                <th className="pb-2 pr-3">Distance</th>
                <th className="pb-2 pr-3">Paid</th>
                <th className="pb-2 pr-3">Signed up</th>
                <th className="pb-2 pr-3 w-8"></th>
                <th className="pb-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-gray-50 ${saving === p.id ? "opacity-50" : ""}`}
                >
                  {/* Bib */}
                  <td className="py-2.5 pr-3">
                    <input
                      type="number"
                      value={p.bib_number ?? ""}
                      onChange={(e) =>
                        setParticipants((prev) =>
                          prev.map((x) =>
                            x.id === p.id
                              ? {
                                  ...x,
                                  bib_number: e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                }
                              : x,
                          ),
                        )
                      }
                      onBlur={(e) =>
                        updateParticipant(p.id, {
                          bib_number: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      placeholder="—"
                      className="w-16 border border-gray-200 rounded-lg px-2 py-1 font-mono text-sm outline-none focus:border-gray-400"
                    />
                  </td>

                  {/* Name */}
                  <td className="py-2.5 pr-3 font-medium whitespace-nowrap">
                    {p.name}
                  </td>

                  {/* Email — click to copy */}
                  <td className="py-2.5 pr-3">
                    {p.email ? (
                      <button
                        onClick={() => copyEmail(p.email!)}
                        className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1 group"
                        title="Click to copy"
                      >
                        <span>
                          {copiedEmail === p.email ? "Copied!" : p.email}
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* Gender */}
                  <td className="py-2.5 pr-3 text-gray-500">
                    {p.gender ?? "—"}
                  </td>

                  {/* Team */}
                  <td className="py-2.5 pr-3 text-gray-500">{p.team ?? "—"}</td>

                  {/* Distance — read only */}
                  <td className="py-2.5 pr-3 text-gray-500">
                    {p.laps_count
                      ? `${((p.laps_count * race.lap_distance_m) / 1000).toFixed(0)} km`
                      : "—"}
                  </td>

                  {/* Paid */}
                  <td className="py-2.5 pr-3">
                    <button
                      onClick={() => updateParticipant(p.id, { paid: !p.paid })}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                        p.paid
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {p.paid ? "Paid" : "Unpaid"}
                    </button>
                  </td>

                  {/* Signed up */}
                  <td className="py-2.5 pr-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>

                  {/* Comment button */}
                  <td className="py-2.5 pr-3">
                    {p.comments ? (
                      <button
                        onClick={() => setCommentSheet(p)}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title="View comment"
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
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                    ) : (
                      <div className="w-8" />
                    )}
                  </td>

                  {/* Delete */}
                  <td className="py-2.5">
                    <button
                      onClick={() => deleteParticipant(p.id, p.name)}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove"
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Comment sheet */}
      {commentSheet && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setCommentSheet(null)}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl p-6 max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{commentSheet.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">Comment</p>
              </div>
              <button
                onClick={() => setCommentSheet(null)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-xl px-4 py-3">
              {commentSheet.comments}
            </p>
          </div>
        </>
      )}
    </main>
  );
}

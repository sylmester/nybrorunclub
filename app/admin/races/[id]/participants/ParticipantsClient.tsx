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
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Broadcast
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    sent: number;
    failed: number;
  } | null>(null);

  const withEmail = participants.filter((p) => p.email);
  const emailCount = withEmail.length;
  const selectedWithEmail = participants.filter(
    (p) => selected.has(p.id) && p.email,
  );
  const broadcastCount =
    selected.size > 0 ? selectedWithEmail.length : emailCount;

  const withBib = participants.filter((p) => p.bib_number !== null).length;
  const withLaps = participants.filter((p) => p.laps_count !== null).length;

  const allSelected =
    participants.length > 0 && participants.every((p) => selected.has(p.id));
  const someSelected = selected.size > 0 && !allSelected;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(participants.map((p) => p.id)));
    }
  }

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
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
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

  async function sendBroadcast() {
    if (!subject.trim() || !message.trim()) return;
    const targets =
      selected.size > 0
        ? participants
            .filter((p) => selected.has(p.id) && p.email)
            .map((p) => p.email!)
        : participants.filter((p) => p.email).map((p) => p.email!);

    if (
      !confirm(
        `Send this email to ${targets.length} participant${targets.length !== 1 ? "s" : ""}?`,
      )
    )
      return;

    setSending(true);
    setBroadcastResult(null);

    const res = await fetch("/api/email/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        race_id: race.id,
        subject,
        message,
        emails: selected.size > 0 ? targets : null, // null = send to all
      }),
    });

    const data = await res.json();
    if (data.error) {
      setError(data.error);
    } else {
      setBroadcastResult({ sent: data.sent, failed: data.failed });
      setSubject("");
      setMessage("");
      setBroadcastOpen(false);
    }
    setSending(false);
  }

  const CloseIcon = () => (
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
  );

  const DeleteIcon = () => (
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
  );

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-5xl mx-auto">
      <a
        href="/admin/dashboard"
        className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block"
      >
        ← Dashboard
      </a>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-medium">{race.name}</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {participants.length} participants · {withBib} bibs assigned ·{" "}
          {withLaps} distances set
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-4">
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
          <button
            onClick={() => {
              setBroadcastOpen(true);
              setBroadcastResult(null);
            }}
            disabled={broadcastCount === 0}
            className="inline-flex items-center gap-1.5 bg-black text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40"
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
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            {selected.size > 0
              ? `Email selected (${selectedWithEmail.length})`
              : `Email all (${emailCount})`}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {broadcastResult && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          Sent to {broadcastResult.sent} participant
          {broadcastResult.sent !== 1 ? "s" : ""}
          {broadcastResult.failed > 0 && ` · ${broadcastResult.failed} failed`}
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
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="pb-2 pr-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
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
                    className={`border-b border-gray-50 ${saving === p.id ? "opacity-50" : ""} ${selected.has(p.id) ? "bg-gray-50/50" : ""}`}
                  >
                    <td className="py-2.5 pr-3">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded"
                      />
                    </td>
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
                    <td className="py-2.5 pr-3 font-medium whitespace-nowrap">
                      {p.name}
                    </td>
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
                    <td className="py-2.5 pr-3 text-gray-500">
                      {p.gender ?? "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-gray-500">
                      {p.team ?? "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-gray-500">
                      {p.laps_count
                        ? `${((p.laps_count * race.lap_distance_m) / 1000).toFixed(0)} km`
                        : "—"}
                    </td>
                    <td className="py-2.5 pr-3">
                      <button
                        onClick={() =>
                          updateParticipant(p.id, { paid: !p.paid })
                        }
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${p.paid ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                      >
                        {p.paid ? "Paid" : "Unpaid"}
                      </button>
                    </td>
                    <td className="py-2.5 pr-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="py-2.5 pr-3">
                      {p.comments ? (
                        <button
                          onClick={() => setCommentSheet(p)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-700 hover:bg-gray-100 transition-colors"
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
                    <td className="py-2.5">
                      <button
                        onClick={() => deleteParticipant(p.id, p.name)}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <DeleteIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-3">
            {/* Select all */}
            <label className="flex items-center gap-2 text-sm text-gray-500 px-1">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={toggleAll}
                className="rounded"
              />
              Select all
            </label>

            {participants.map((p) => (
              <div
                key={p.id}
                className={`border rounded-xl p-4 transition-colors ${selected.has(p.id) ? "border-gray-400 bg-gray-50" : "border-gray-200"} ${saving === p.id ? "opacity-50" : ""}`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="rounded mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {p.gender ?? "—"} ·{" "}
                        {p.laps_count
                          ? `${((p.laps_count * race.lap_distance_m) / 1000).toFixed(0)} km`
                          : "no distance"}
                        {p.team ? ` · ${p.team}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateParticipant(p.id, { paid: !p.paid })}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${p.paid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {p.paid ? "Paid" : "Unpaid"}
                    </button>
                    <button
                      onClick={() => deleteParticipant(p.id, p.name)}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>

                {/* Card details */}
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Bib input */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">Bib</span>
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
                  </div>

                  {/* Email */}
                  {p.email && (
                    <button
                      onClick={() => copyEmail(p.email!)}
                      className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1"
                    >
                      {copiedEmail === p.email ? "Copied!" : p.email}
                    </button>
                  )}

                  {/* Comment */}
                  {p.comments && (
                    <button
                      onClick={() => setCommentSheet(p)}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Comment
                    </button>
                  )}

                  <span className="text-xs text-gray-300">
                    {new Date(p.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Comment sheet */}
      {commentSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setCommentSheet(null)}
          />
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
                <CloseIcon />
              </button>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-xl px-4 py-3">
              {commentSheet.comments}
            </p>
          </div>
        </>
      )}

      {/* Broadcast sheet */}
      {broadcastOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setBroadcastOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl p-6 max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-medium">Email participants</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selected.size > 0
                    ? `${selectedWithEmail.length} selected recipient${selectedWithEmail.length !== 1 ? "s" : ""}`
                    : `All ${emailCount} participants`}
                </p>
              </div>
              <button
                onClick={() => setBroadcastOpen(false)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={`Race day info — ${race.name}`}
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder="Hi everyone, just a reminder that the race starts at 10:00..."
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-gray-400 resize-none"
                />
              </div>
              <button
                onClick={sendBroadcast}
                disabled={sending || !subject.trim() || !message.trim()}
                className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40"
              >
                {sending
                  ? "Sending..."
                  : `Send to ${broadcastCount} participant${broadcastCount !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

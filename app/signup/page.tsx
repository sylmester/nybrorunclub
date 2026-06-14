"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const HALLWAYS = [
  "AB-lige",
  "AB-ulige",
  "CD-lige",
  "CD-ulige",
  "EF-lige",
  "EF-ulige",
  "GH-lige",
  "GH-ulige",
  "JK-lige",
  "JK-ulige",
  "LM-lige",
  "LM-ulige",
  "NO-lige",
  "NO-ulige",
  "PR-lige",
  "PR-ulige",
  "ST-lige",
  "ST-ulige",
];

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer not to say", label: "Prefer not to say" },
];

type Race = {
  id: string;
  name: string;
  date: string;
  lap_distance_m: number;
  available_laps: number[];
};

function SignupForm() {
  const searchParams = useSearchParams();
  const preselectedRaceId = searchParams.get("race");

  const [races, setRaces] = useState<Race[]>([]);
  const [racesLoading, setRacesLoading] = useState(true);

  const [raceId, setRaceId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [lapsCount, setLapsCount] = useState<number | null>(null);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [team, setTeam] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRaces() {
      const res = await fetch("/api/races/public");
      const data = await res.json();
      setRaces(data ?? []);

      if (
        preselectedRaceId &&
        data?.find((r: Race) => r.id === preselectedRaceId)
      ) {
        setRaceId(preselectedRaceId);
      } else if (data?.length > 0) {
        setRaceId(data[0].id);
      }

      setRacesLoading(false);
    }
    fetchRaces();
  }, [preselectedRaceId]);

  // Reset laps selection when race changes
  useEffect(() => {
    setLapsCount(null);
  }, [raceId]);

  const selectedRace = races.find((r) => r.id === raceId) ?? null;

  const distanceOptions = selectedRace?.available_laps?.length
    ? selectedRace.available_laps.map((laps, i) => ({
        key: `laps-${i}`,
        laps_count: laps,
        label: `${((laps * selectedRace.lap_distance_m) / 1000).toFixed(0)} km`,
      }))
    : [];

  async function handleSubmit() {
    if (
      !raceId ||
      !name ||
      !email ||
      !gender ||
      !lapsCount ||
      isMember === null
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        race_id: raceId,
        name,
        email,
        gender,
        birth_year: birthYear ? parseInt(birthYear) : null,
        laps_count: lapsCount,
        team: isMember ? team : null,
        is_member: isMember,
        comments: comments || null,
      }),
    });

    const data = await res.json();

    if (data.error) {
      setError(data.error);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-medium mb-3">You're signed up!</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          You're now registered! We look forward to seeing you on the start
          line.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium mb-2">Sign up</h1>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* Race */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Race <span className="text-red-400">*</span>
          </label>
          {racesLoading ? (
            <div className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-400">
              Loading...
            </div>
          ) : races.length === 0 ? (
            <div className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-400">
              No upcoming races available for sign-up.
            </div>
          ) : (
            <select
              value={raceId}
              onChange={(e) => setRaceId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-colors bg-white"
            >
              {races.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} —{" "}
                  {new Date(r.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Gender <span className="text-red-400">*</span>
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-colors bg-white"
          >
            <option value="">Select...</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        {/* Birth year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Birth year{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="number"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            placeholder="1995"
            min="1920"
            max={new Date().getFullYear()}
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Distance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Distance <span className="text-red-400">*</span>
          </label>
          {!selectedRace || distanceOptions.length === 0 ? (
            <div className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-400">
              Select a race first
            </div>
          ) : (
            <div className="flex gap-2">
              {distanceOptions.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setLapsCount(d.laps_count)}
                  className={`flex-1 py-2.5 text-sm rounded-lg border transition-colors ${
                    lapsCount === d.laps_count
                      ? "bg-black text-white border-black"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Member */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Do you live at Nybrogård? <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsMember(true);
                setTeam("");
              }}
              className={`flex-1 py-2.5 text-sm rounded-lg border transition-colors ${
                isMember === true
                  ? "bg-black text-white border-black"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMember(false);
                setTeam("");
              }}
              className={`flex-1 py-2.5 text-sm rounded-lg border transition-colors ${
                isMember === false
                  ? "bg-black text-white border-black"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              No
            </button>
          </div>
        </div>

        {/* Hallway — only shown if member */}
        {isMember === true && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Hallway{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-colors bg-white"
            >
              <option value="">Select hallway...</option>
              {HALLWAYS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Comments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Comments{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            placeholder="Anything else we should know..."
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-colors resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || races.length === 0}
          className="w-full py-3 bg-black text-white text-sm font-medium rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40 mt-2"
        >
          {submitting ? "Signing up..." : "Sign up"}
        </button>

        <p className="text-xs text-gray-400 text-center">
          By signing up you agree to your information being used for
          administration of the race.
        </p>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-lg mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-2xl font-medium mb-2">Sign up</h1>
          </div>
          <div className="text-sm text-gray-400">Loading...</div>
        </main>
      }
    >
      <SignupForm />
    </Suspense>
  );
}

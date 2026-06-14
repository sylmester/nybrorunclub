"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Race } from "@/types";

export default function EditRaceClient({ race }: { race: Race }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: race.name,
    date: race.date,
    lap_distance_m: race.lap_distance_m,
    description: race.description || "",
  });
  const [lapsInput, setLapsInput] = useState(
    (race.available_laps ?? []).join(", "),
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function parseLaps(): number[] {
    return [
      ...new Set(
        lapsInput
          .split(",")
          .map((s) => parseInt(s.trim()))
          .filter((n) => !isNaN(n) && n > 0),
      ),
    ].sort((a, b) => a - b);
  }

  function lapLabel(laps: number) {
    const km = (laps * Number(form.lap_distance_m)) / 1000;
    return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km (${laps} laps)`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const available_laps = parseLaps();
    if (available_laps.length === 0) return;

    setLoading(true);
    await fetch(`/api/races/${race.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        lap_distance_m: Number(form.lap_distance_m),
        laps_count: Math.max(...available_laps),
        available_laps,
      }),
    });
    router.push("/admin/dashboard");
  }

  const parsedLaps = parseLaps();

  return (
    <main className="min-h-screen p-8 max-w-lg mx-auto">
      <a
        href="/admin/dashboard"
        className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block"
      >
        ← Dashboard
      </a>
      <h1 className="text-3xl font-medium mb-8">Edit race</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm text-gray-500 mb-1 block">Race name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-gray-400"
          />
        </div>
        <div>
          <label className="text-sm text-gray-500 mb-1 block">Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-gray-400"
          />
        </div>
        <div>
          <label className="text-sm text-gray-500 mb-1 block">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Route goes around Bagsværd Sø..."
            className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-gray-400"
          />
        </div>
        <div>
          <label className="text-sm text-gray-500 mb-1 block">
            Lap distance (meters)
          </label>
          <input
            type="number"
            name="lap_distance_m"
            value={form.lap_distance_m}
            onChange={handleChange}
            min={1}
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-gray-400"
          />
        </div>

        {/* Available distances */}
        <div>
          <label className="text-sm text-gray-500 mb-1 block">
            Available distances{" "}
            <span className="text-gray-400">(lap counts, comma-separated)</span>
          </label>
          <input
            type="text"
            value={lapsInput}
            onChange={(e) => setLapsInput(e.target.value)}
            placeholder="14, 28, 42"
            className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-gray-400"
          />
          {parsedLaps.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {parsedLaps.map((l) => (
                <span
                  key={l}
                  className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs"
                >
                  {lapLabel(l)}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || parsedLaps.length === 0}
          className="bg-black text-white rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors disabled:opacity-50 mt-2"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </form>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewRacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    date: new Date().toISOString().split("T")[0],
    laps_count: 3,
    lap_distance_m: 1000,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/races", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        laps_count: Number(form.laps_count),
        lap_distance_m: Number(form.lap_distance_m),
      }),
    });
    const race = await res.json();
    router.push(`/admin/races/${race.id}/timer`);
  }

  return (
    <main className="min-h-screen p-8 max-w-lg mx-auto">
      <a
        href="/admin/dashboard"
        className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block"
      >
        ← Dashboard
      </a>
      <h1 className="text-3xl font-medium mb-8">New race</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm text-gray-500 mb-1 block">Race name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Summer 5K"
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
            Number of laps
          </label>
          <input
            type="number"
            name="laps_count"
            value={form.laps_count}
            onChange={handleChange}
            min={1}
            required
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
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors disabled:opacity-50 mt-2"
        >
          {loading ? "Creating..." : "Create race →"}
        </button>
      </form>
    </main>
  );
}

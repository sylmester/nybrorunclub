"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Race, RaceCategory } from "@/types";

export default function EditRaceClient({ race }: { race: Race }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: race.name,
    date: race.date,
    lap_distance_m: race.lap_distance_m,
  });
  const [categories, setCategories] = useState<RaceCategory[]>(
    race.categories ?? [],
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function updateCategory(
    index: number,
    field: keyof RaceCategory,
    value: string | number,
  ) {
    setCategories((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  }

  function addCategory() {
    setCategories((prev) => [...prev, { name: "", laps_count: 3 }]);
  }

  function removeCategory(index: number) {
    setCategories((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/races/${race.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        lap_distance_m: Number(form.lap_distance_m),
        laps_count: Math.max(...categories.map((c) => c.laps_count)),
        categories,
      }),
    });
    router.push("/admin/dashboard");
  }

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

        {/* Categories */}
        <div>
          <label className="text-sm text-gray-500 mb-2 block">Categories</label>
          <div className="flex flex-col gap-2">
            {categories.map((cat, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => updateCategory(i, "name", e.target.value)}
                  placeholder="Category name"
                  required
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
                />
                <input
                  type="number"
                  value={cat.laps_count}
                  onChange={(e) =>
                    updateCategory(i, "laps_count", Number(e.target.value))
                  }
                  min={1}
                  required
                  className="w-20 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
                />
                <span className="text-xs text-gray-400">laps</span>
                <button
                  type="button"
                  onClick={() => removeCategory(i)}
                  className="text-red-400 hover:text-red-600 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addCategory}
            className="mt-2 text-sm text-gray-500 hover:text-black"
          >
            + Add category
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || categories.length === 0}
          className="bg-black text-white rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors disabled:opacity-50 mt-2"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </form>
    </main>
  );
}

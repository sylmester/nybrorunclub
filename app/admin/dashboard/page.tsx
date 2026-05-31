import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Race } from "@/types";
import Link from "next/link";

export default async function DashboardPage() {
  const {
    data: races,
    error,
    count,
  } = await supabaseAdmin
    .from("races")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  console.log("count:", count);
  console.log("races:", JSON.stringify(races));
  console.log("error:", JSON.stringify(error));

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-medium">Dashboard ({count} races)</h1>
          <p className="text-gray-500 mt-1">Manage races</p>
        </div>
        <Link
          href="/admin/races/new"
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
        >
          + New race
        </Link>
      </div>

      {!races?.length && (
        <p className="text-gray-400">No races yet. Create your first one.</p>
      )}

      <div className="flex flex-col gap-3">
        {races?.map((race: Race) => (
          <div
            key={race.id}
            className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{race.name}</p>
              <p className="text-sm text-gray-500">
                {new Date(race.date).toLocaleDateString("da-DK")} ·{" "}
                {race.laps_count} laps · {race.lap_distance_m}m
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  race.status === "active"
                    ? "bg-green-100 text-green-700"
                    : race.status === "finished"
                      ? "bg-gray-100 text-gray-600"
                      : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {race.status}
              </span>
              <Link
                href={`/admin/races/${race.id}/timer`}
                className="text-sm text-gray-500 hover:text-black transition-colors"
              >
                Timer →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

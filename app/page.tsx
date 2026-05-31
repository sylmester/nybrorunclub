import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Race } from "@/types";

export default async function Home() {
  const { data: races } = await supabase
    .from("races")
    .select("*")
    .order("date", { ascending: false });

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-medium mb-1">Nybro Run Club</h1>
      <p className="text-gray-500 mb-8">Race results</p>

      {!races?.length && <p className="text-gray-400">No races yet.</p>}

      <div className="flex flex-col gap-3">
        {races?.map((race: Race) => (
          <Link
            key={race.id}
            href={`/races/${race.id}`}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{race.name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(race.date).toLocaleDateString("da-DK")} ·{" "}
                  {race.laps_count} laps · {race.lap_distance_m}m
                </p>
              </div>
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
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

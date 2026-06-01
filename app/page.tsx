import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Race } from "@/types";

export default async function Home() {
  const { data: races } = await supabaseAdmin
    .from("races")
    .select("*")
    .eq("status", "active")
    .order("date", { ascending: true })
    .limit(3);

  return (
    <main className="max-w-4xl mx-auto px-8 py-16">
      {/* Hero */}
      <div className="mb-16">
        <h1 className="text-5xl font-medium mb-4">Nybro Run Club</h1>
        <p className="text-xl text-gray-500 mb-8 max-w-lg">
          A friendly running community based on Nybrogård Kollegiet. Everyone is
          welcome — whether you're chasing a personal best or just enjoy a good
          run with good people.
        </p>
        <div className="flex gap-4">
          <Link
            href="/info"
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Join us
          </Link>
          <Link
            href="/races"
            className="border border-gray-200 px-6 py-3 rounded-lg hover:border-gray-400 transition-colors"
          >
            See races
          </Link>
        </div>
      </div>

      {/* Live races */}
      {races && races.length > 0 && (
        <div className="mb-16">
          <h2 className="text-sm text-gray-400 uppercase tracking-wide mb-4">
            Live now
          </h2>
          <div className="flex flex-col gap-3">
            {races.map((race: Race) => (
              <Link
                key={race.id}
                href={`/races/${race.id}`}
                className="border border-green-200 bg-green-50 rounded-lg p-4 flex justify-between items-center hover:border-green-400 transition-colors"
              >
                <div>
                  <p className="font-medium">{race.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(race.date).toLocaleDateString("da-DK")} ·{" "}
                    {race.lap_distance_m}m laps
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-green-600">Live</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/info"
          className="border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors"
        >
          <p className="font-medium mb-1">About the club</p>
          <p className="text-sm text-gray-500">
            When we run, where we meet, and how to join
          </p>
        </Link>
        <Link
          href="/races"
          className="border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors"
        >
          <p className="font-medium mb-1">Race results</p>
          <p className="text-sm text-gray-500">
            Live timing and past race results
          </p>
        </Link>
      </div>
    </main>
  );
}

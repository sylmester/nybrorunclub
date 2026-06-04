import { supabase } from "@/lib/supabase";
import { Race, Runner, Lap } from "@/types";
import LiveLeaderboard from "./LiveLeaderboard";
import { notFound } from "next/navigation";

export default async function RacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: race } = await supabase
    .from("races")
    .select("*")
    .eq("id", id)
    .single();

  if (!race || !race.is_visible) {
    notFound();
  }

  const { data: runners } = await supabase
    .from("runners")
    .select("*")
    .eq("race_id", id);

  const { data: laps } = await supabase
    .from("laps")
    .select("*")
    .eq("race_id", id)
    .order("recorded_at", { ascending: true });

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <a
        href="/races"
        className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block"
      >
        ← All races
      </a>

      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-3xl font-medium">{race.name}</h1>
        {race.status === "active" && (
          <span className="flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        )}
      </div>
      <p className="text-gray-500 mb-8">
        {new Date(race.date).toLocaleDateString("da-DK")} · {race.laps_count}{" "}
        laps · {race.lap_distance_m}m per lap
      </p>
      <LiveLeaderboard
        race={race as Race}
        initialRunners={(runners ?? []) as Runner[]}
        initialLaps={(laps ?? []) as Lap[]}
      />
    </main>
  );
}

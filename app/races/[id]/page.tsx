import { supabase } from "@/lib/supabase";
import { Race, Runner, Lap } from "@/types";
import LiveLeaderboard from "./LiveLeaderboard";
import { notFound } from "next/navigation";

export default async function RacePage({ params }: { params: { id: string } }) {
  const { data: race } = await supabase
    .from("races")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!race) notFound();

  const { data: runners } = await supabase
    .from("runners")
    .select("*")
    .eq("race_id", params.id);

  const { data: laps } = await supabase
    .from("laps")
    .select("*")
    .eq("race_id", params.id)
    .order("recorded_at", { ascending: true });

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <a
        href="/"
        className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block"
      >
        ← All races
      </a>
      <h1 className="text-3xl font-medium mb-1">{race.name}</h1>
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

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Race, Lap, Participant } from "@/types";
import LiveLeaderboard from "./LiveLeaderboard";
import { notFound } from "next/navigation";

export default async function RacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: race } = await supabaseAdmin
    .from("races")
    .select("*")
    .eq("id", id)
    .single();

  if (!race || !race.is_visible) {
    notFound();
  }

  const { data: participants } = await supabaseAdmin
    .from("participants")
    .select("id, name, gender, team, bib_number, laps_count, race_id")
    .eq("race_id", id)
    .order("created_at", { ascending: true });

  const { data: laps } = await supabaseAdmin
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

      {race.status === "pending" && (
        <div className="mb-6 flex items-center justify-between bg-gradient-to-r from-yellow-500 to-green-500 rounded-xl px-5 py-4">
          <div>
            <p className="text-white font-medium text-sm">
              Registration is open!
            </p>
            <p className="text-white/70 text-xs mt-0.5">
              Secure your spot for {race.name}
            </p>
          </div>
          <a
            href={`/signup?race=${race.id}`}
            className="shrink-0 text-sm font-medium bg-white text-green-500 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Sign up →
          </a>
        </div>
      )}

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
        initialParticipants={(participants ?? []) as Participant[]}
        initialLaps={(laps ?? []) as Lap[]}
      />
    </main>
  );
}

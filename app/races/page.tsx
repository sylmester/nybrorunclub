import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Race } from "@/types";
import Link from "next/link";

export default async function RacesPage() {
  const { data: races } = await supabaseAdmin
    .from("races")
    .select("*")
    .order("date", { ascending: false });

  const active = races?.filter((r) => r.status === "active") ?? [];
  const finished = races?.filter((r) => r.status === "finished") ?? [];
  const pending = races?.filter((r) => r.status === "pending") ?? [];

  return (
    <main className="max-w-4xl mx-auto px-8 py-16">
      <h1 className="text-3xl font-medium mb-2">Races</h1>
      <p className="text-gray-500 mb-10">Live results and past race times</p>

      {active.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm text-gray-400 uppercase tracking-wide mb-4">
            Live now
          </h2>
          <RaceList races={active} />
        </section>
      )}

      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm text-gray-400 uppercase tracking-wide mb-4">
            Upcoming
          </h2>
          <RaceList races={pending} />
        </section>
      )}

      {finished.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm text-gray-400 uppercase tracking-wide mb-4">
            Past races
          </h2>
          <RaceList races={finished} />
        </section>
      )}

      {!races?.length && <p className="text-gray-400">No races yet.</p>}
    </main>
  );
}

function RaceList({ races }: { races: Race[] }) {
  return (
    <div className="flex flex-col gap-3">
      {races.map((race: Race) => (
        <Link
          key={race.id}
          href={`/races/${race.id}`}
          className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:border-gray-400 transition-colors"
        >
          <div>
            <p className="font-medium">{race.name}</p>
            <p className="text-sm text-gray-500">
              {new Date(race.date).toLocaleDateString("da-DK")} ·{" "}
              {race.lap_distance_m}m laps
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
        </Link>
      ))}
    </div>
  );
}

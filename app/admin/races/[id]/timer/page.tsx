import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Race, Runner, Lap } from "@/types";
import TimerClient from "./TimerClient";

export default async function TimerPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: race } = await supabaseAdmin
    .from("races")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!race) notFound();

  const { data: runners } = await supabaseAdmin
    .from("runners")
    .select("*")
    .eq("race_id", params.id)
    .order("bib_number");

  const { data: laps } = await supabaseAdmin
    .from("laps")
    .select("*")
    .eq("race_id", params.id)
    .order("recorded_at", { ascending: true });

  return (
    <TimerClient
      race={race as Race}
      initialRunners={(runners ?? []) as Runner[]}
      initialLaps={(laps ?? []) as Lap[]}
    />
  );
}

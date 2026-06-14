import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notFound } from "next/navigation";
import { Race, Participant } from "@/types";
import ParticipantsClient from "./ParticipantsClient";

export default async function ParticipantsPage({
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

  if (!race) notFound();

  const { data: participants } = await supabaseAdmin
    .from("participants")
    .select("*")
    .eq("race_id", id)
    .order("created_at", { ascending: true });

  return (
    <ParticipantsClient
      race={race as Race}
      initialParticipants={(participants ?? []) as Participant[]}
    />
  );
}

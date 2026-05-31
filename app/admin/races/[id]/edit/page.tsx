import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notFound } from "next/navigation";
import EditRaceClient from "./EditRaceClient";

export default async function EditRacePage({
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

  return <EditRaceClient race={race} />;
}

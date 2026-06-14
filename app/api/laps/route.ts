import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { race_id, bib_number, elapsed_ms } = await req.json();

  // Find the participant by bib number
  const { data: participant } = await supabaseAdmin
    .from("participants")
    .select("*")
    .eq("race_id", race_id)
    .eq("bib_number", bib_number)
    .single();

  if (!participant)
    return NextResponse.json(
      { error: "Participant not found" },
      { status: 404 },
    );

  // Count existing laps to determine lap number
  const { count } = await supabaseAdmin
    .from("laps")
    .select("*", { count: "exact", head: true })
    .eq("participant_id", participant.id);

  const lap_number = (count ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from("laps")
    .insert({ race_id, participant_id: participant.id, lap_number, elapsed_ms })
    .select()
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ ...data, participant });
}

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { race_id, bib_number, elapsed_ms } = await req.json();

  // Find the runner by bib number
  const { data: runner } = await supabaseAdmin
    .from("runners")
    .select("*")
    .eq("race_id", race_id)
    .eq("bib_number", bib_number)
    .single();

  if (!runner)
    return NextResponse.json({ error: "Runner not found" }, { status: 404 });

  // Count existing laps to determine lap number
  const { count } = await supabaseAdmin
    .from("laps")
    .select("*", { count: "exact", head: true })
    .eq("runner_id", runner.id);

  const lap_number = (count ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from("laps")
    .insert({ race_id, runner_id: runner.id, lap_number, elapsed_ms })
    .select()
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ ...data, runner });
}

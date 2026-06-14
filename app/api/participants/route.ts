import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const body = await req.json();
  const {
    race_id,
    name,
    email,
    gender,
    laps_count,
    birth_year,
    team,
    is_member,
    comments,
  } = body;

  if (!name || !email || !gender || !laps_count) {
    return NextResponse.json(
      { error: "Please fill in all required fields." },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("participants")
    .insert({
      race_id: race_id || null,
      name,
      email,
      gender,
      birth_year: birth_year || null,
      laps_count: laps_count || null,
      team: team || null,
      is_member: is_member ?? true,
      comments: comments || null,
      paid: false,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("participants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

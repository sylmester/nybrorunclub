import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Resend } from "resend";
import { confirmationEmail } from "@/lib/confirmationEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  // Fetch race details for the email
  if (race_id) {
    const { data: race } = await supabaseAdmin
      .from("races")
      .select("name, date, lap_distance_m")
      .eq("id", race_id)
      .single();

    if (race) {
      const distanceKm = `${((laps_count * race.lap_distance_m) / 1000).toFixed(0)} km`;
      const raceDate = new Date(race.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      await resend.emails.send({
        from: "no-reply@updates.nybrorunclub.dk",
        to: email,
        subject: `You're signed up for ${race.name}!`,
        html: confirmationEmail({
          name,
          raceName: race.name,
          raceDate,
          distanceKm,
        }),
      });
    }
  }

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

import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from("runners")
    .insert({
      race_id: params.id,
      bib_number: body.bib_number,
      name: body.name ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { data } = await supabaseAdmin
    .from("runners")
    .select("*")
    .eq("race_id", params.id)
    .order("bib_number");
  return NextResponse.json(data ?? []);
}

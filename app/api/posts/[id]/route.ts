import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  // Fetch current post to preserve published_at
  const { data: existing } = await supabaseAdmin
    .from("posts")
    .select("published_at")
    .eq("id", id)
    .single();

  const is_visible = body.is_visible;
  const published_at =
    is_visible && !existing?.published_at
      ? new Date().toISOString()
      : (existing?.published_at ?? null);

  const { data, error } = await supabaseAdmin
    .from("posts")
    .update({ ...body, published_at, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { error } = await supabaseAdmin.from("posts").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

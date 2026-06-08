import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET all posts (admin, no visibility filter)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST create post
export async function POST(req: Request) {
  const body = await req.json();
  const { title, slug, summary, content, hero_image_url, is_visible } = body;

  const { data, error } = await supabaseAdmin
    .from("posts")
    .insert({
      title,
      slug,
      summary: summary || null,
      content,
      hero_image_url: hero_image_url || null,
      is_visible,
      published_at: is_visible ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

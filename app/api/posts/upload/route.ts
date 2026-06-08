import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file)
    return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (file.size > 1024 * 1024) {
    return NextResponse.json(
      { error: "File exceeds 1MB limit" },
      { status: 400 },
    );
  }

  const path = `blog/${Date.now()}-${file.name.toLowerCase().replace(/\s+/g, "-")}`;

  const { error } = await supabaseAdmin.storage
    .from("blog-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabaseAdmin.storage.from("blog-images").getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}

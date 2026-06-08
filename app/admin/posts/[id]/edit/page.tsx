import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notFound } from "next/navigation";
import PostForm from "../../PostForm";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (!post) notFound();

  return <PostForm initialData={post} />;
}

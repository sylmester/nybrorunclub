import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Link from "next/link";
import Image from "next/image";

async function getPosts() {
  const { data } = await supabaseAdmin
    .from("posts")
    .select("id, title, slug, summary, hero_image_url, published_at")
    .eq("is_visible", true)
    .order("published_at", { ascending: false });

  return data ?? [];
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-medium mb-2">Blog</h1>
      <p className="text-gray-500 mb-10">
        Nyheder og historier fra Nybrogård Løbeklub
      </p>

      {posts.length === 0 ? (
        <p className="text-gray-400">Ingen opslag endnu.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col sm:flex-row gap-5 border border-gray-100 rounded-xl p-4 hover:border-gray-300 transition-colors"
            >
              {post.hero_image_url && (
                <div className="relative w-full sm:w-40 h-36 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={post.hero_image_url}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="flex flex-col justify-center">
                <p className="text-xs text-gray-400 mb-1.5">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString("da-DK", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : ""}
                </p>
                <h2 className="font-medium text-gray-900 group-hover:text-black transition-colors mb-1.5">
                  {post.title}
                </h2>
                {post.summary && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {post.summary}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

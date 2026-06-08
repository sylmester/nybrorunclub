import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notFound } from "next/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

async function getPost(slug: string) {
  const { data } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_visible", true)
    .single();

  return data;
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      {/* Back */}
      <a
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-8"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Alle opslag
      </a>

      {/* Hero image */}
      {post.hero_image_url && (
        <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden mb-8 bg-gray-100">
          <Image
            src={post.hero_image_url}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-gray-400 mb-2">
          {post.published_at
            ? new Date(post.published_at).toLocaleDateString("da-DK", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : ""}
        </p>
        <h1 className="text-3xl font-medium text-gray-900 mb-3">
          {post.title}
        </h1>
        {post.summary && (
          <p className="text-lg text-gray-500">{post.summary}</p>
        )}
      </div>

      <hr className="border-gray-100 mb-8" />

      {/* Content */}
      <div className="prose prose-gray prose-sm sm:prose max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </div>
    </main>
  );
}

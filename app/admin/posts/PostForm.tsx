"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateSlug } from "@/lib/utils";
import MDEditor from "@uiw/react-md-editor";
import Image from "next/image";

type PostFormProps = {
  initialData?: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    content: string;
    hero_image_url: string | null;
    images: string[] | null;
    is_visible: boolean;
  };
};

export default function PostForm({ initialData }: PostFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [summary, setSummary] = useState(initialData?.summary ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(
    initialData?.hero_image_url ?? "",
  );
  const [images, setImages] = useState<string[]>(initialData?.images ?? []);
  const [isVisible, setIsVisible] = useState(initialData?.is_visible ?? false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(val));
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/posts/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (data.error) {
      setError(data.error);
    } else {
      setHeroImageUrl(data.url);
    }

    setUploading(false);
  }

  async function handleExtraImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingExtra(true);
    setError(null);

    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/posts/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        break;
      } else {
        uploaded.push(data.url);
      }
    }

    setImages((prev) => [...prev, ...uploaded]);
    setUploadingExtra(false);
    e.target.value = "";
  }

  function removeExtraImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  async function handleSubmit(publish: boolean) {
    setSaving(true);
    setError(null);

    const payload = {
      title,
      slug,
      summary: summary || null,
      content,
      hero_image_url: heroImageUrl || null,
      images,
      is_visible: publish,
    };

    const res = isEditing
      ? await fetch(`/api/posts/${initialData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    const data = await res.json();

    if (data.error) {
      setError(data.error);
      setSaving(false);
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="text-2xl font-medium">
          {isEditing ? "Edit post" : "New post"}
        </h1>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Race day at Fælledparken"
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Slug
          </label>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-black/10 focus-within:border-gray-400 transition-colors">
            <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 shrink-0">
              /blog/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugManuallyEdited(true);
              }}
              className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Summary{" "}
            <span className="text-gray-400 font-normal">
              (shown in post previews)
            </span>
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            placeholder="A short description of the post..."
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-colors resize-none"
          />
        </div>

        {/* Hero image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Hero image
          </label>
          {heroImageUrl ? (
            <div className="relative group">
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={heroImageUrl}
                  alt="Hero"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                />
              </div>
              <button
                onClick={() => setHeroImageUrl("")}
                className="absolute top-2 right-2 bg-white border border-gray-200 text-gray-500 hover:text-red-600 rounded-md px-2 py-1 text-xs font-medium shadow-sm transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors">
              {uploading ? (
                <span className="text-sm text-gray-400">Uploading...</span>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-300 mb-2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="text-sm text-gray-400">
                    Click to upload{" "}
                    <span className="text-gray-300">(max 1MB)</span>
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {/* Extra images / slideshow */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Slideshow images{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {images.map((url) => (
                <div key={url} className="relative group">
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, 224px"
                    />
                  </div>
                  <button
                    onClick={() => removeExtraImage(url)}
                    className="absolute top-1.5 right-1.5 bg-white border border-gray-200 text-gray-500 hover:text-red-600 rounded-md px-1.5 py-0.5 text-xs font-medium shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors">
            {uploadingExtra ? (
              <span className="text-sm text-gray-400">Uploading...</span>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-300 mb-1.5"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm text-gray-400">
                  Click to add images{" "}
                  <span className="text-gray-300">(select multiple)</span>
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleExtraImageUpload}
              disabled={uploadingExtra}
            />
          </label>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Content
          </label>
          <div data-color-mode="light">
            <MDEditor
              value={content}
              onChange={(val) => setContent(val ?? "")}
              height={400}
              preview="live"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSubmit(false)}
              disabled={saving || !title || !content}
              className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              Save draft
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={saving || !title || !content}
              className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              {isEditing && isVisible ? "Update" : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

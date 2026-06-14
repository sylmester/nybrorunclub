"use client";

import { useState } from "react";
import Image from "next/image";

export default function ImageSlideshow({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) return null;

  function prev() {
    setCurrent((i) => (i === 0 ? images.length - 1 : i - 1));
  }

  function next() {
    setCurrent((i) => (i === images.length - 1 ? 0 : i + 1));
  }

  return (
    <div className="mb-8">
      {/* Main image */}
      <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden bg-gray-100 group">
        <Image
          src={images[current]}
          alt={`Billede ${current + 1} af ${images.length}`}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, 672px"
        />

        {/* Prev / Next buttons — only shown if more than one image */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-sm transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Forrige billede"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-sm transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Næste billede"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Gå til billede ${i + 1}`}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === current ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip — only shown if more than 2 images */}
      {images.length > 2 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={url}
              onClick={() => setCurrent(i)}
              className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === current
                  ? "border-gray-900"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="128px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

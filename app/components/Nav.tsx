"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Nav() {
  const pathname = usePathname();

  // Don't show nav on admin pages or login
  if (pathname.startsWith("/admin") || pathname.startsWith("/login"))
    return null;

  return (
    <nav className="border-b border-gray-100 px-8 py-4">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Nybrogård Løbeklub"
            width={75}
            height={75}
          />
        </Link>
        <div className="flex gap-6">
          <Link
            href="/info"
            className={`text-sm transition-colors ${pathname === "/info" ? "text-black" : "text-gray-400 hover:text-black"}`}
          >
            Info
          </Link>
          <Link
            href="/races"
            className={`text-sm transition-colors ${pathname.startsWith("/races") ? "text-black" : "text-gray-400 hover:text-black"}`}
          >
            Races
          </Link>
          <Link
            href="/blog"
            className={`text-sm transition-colors ${pathname.startsWith("/blog") ? "text-black" : "text-gray-400 hover:text-black"}`}
          >
            Blog
          </Link>
        </div>
      </div>
    </nav>
  );
}

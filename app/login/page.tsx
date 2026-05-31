"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await signIn("credentials", {
      password,
      redirect: false,
    });
    if (result?.ok) {
      router.push("/admin/dashboard");
    } else {
      setError(true);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-medium mb-6">Admin login</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            required
            className="border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-gray-400"
          />
          {error && <p className="text-red-500 text-sm">Incorrect password</p>}
          <button
            type="submit"
            className="bg-black text-white rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors"
          >
            Log in
          </button>
        </form>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { ApiRequestError } from "../../lib/api";
import { createProfile, getMyProfile } from "../../lib/supplymatch-api";
import { initializeAuthTokenProvider } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

type Role = "client" | "supplier";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    try {
      /*
       * Ensure the API client can retrieve the newly-created
       * Supabase session token.
       */
      initializeAuthTokenProvider();

      try {
        /*
         * If the profile already exists, we're done.
         */
        await getMyProfile();
      } catch (profileError) {
        if (
          !(profileError instanceof ApiRequestError) ||
          profileError.status !== 404
        ) {
          throw profileError;
        }

        /*
         * Email confirmation may have happened after the
         * original signup. In that case the Auth user exists,
         * but the application profile may not exist yet.
         *
         * Recover the original profile information from the
         * Supabase Auth metadata and create the application
         * profile through FastAPI.
         */
        const metadata = data.user.user_metadata ?? {};

        const name =
          typeof metadata.name === "string"
            ? metadata.name.trim()
            : "";

        const company =
          typeof metadata.company === "string"
            ? metadata.company.trim()
            : "";

        const role: Role =
          metadata.role === "supplier"
            ? "supplier"
            : "client";

        if (!name) {
          throw new Error(
            "Your account is missing profile information. Please contact support.",
          );
        }

        await createProfile({
          role,
          name,
          company: company || null,
        });
      }

      window.location.href = "/dashboard";
    } catch (profileError) {
      await supabase.auth.signOut();

      setError(
        profileError instanceof Error
          ? profileError.message
          : "Login succeeded, but profile setup failed.",
      );

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <p className="text-sm font-semibold text-blue-600">
              SupplyMatch
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Sign in to continue to SupplyMatch.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
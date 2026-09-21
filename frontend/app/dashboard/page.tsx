"use client";

import { useEffect, useState } from "react";

import { getMyProfile } from "../../lib/supplymatch-api";
import { supabase } from "../../lib/supabase";
import type { Profile } from "../../types/api";

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      try {
        const currentProfile = await getMyProfile();
        setProfile(currentProfile);
      } catch (dashboardError) {
        setError(
          dashboardError instanceof Error
            ? dashboardError.message
            : "Unable to load your profile.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-sm text-slate-600">
            Loading your dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-semibold text-red-900">
              Unable to load dashboard
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error || "Your profile could not be loaded."}
            </p>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    );
  }

  const isClient = profile.role === "client";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              SupplyMatch
            </p>

            <h1 className="text-xl font-bold text-slate-900">
              Dashboard
            </h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            {isClient ? "Client account" : "Supplier account"}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Welcome, {profile.name}
          </h2>

          {profile.company && (
            <p className="mt-2 text-slate-600">
              {profile.company}
            </p>
          )}
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-500">
              Account type
            </p>

            <p className="mt-2 text-xl font-semibold capitalize text-slate-900">
              {profile.role}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-500">
              Platform status
            </p>

            <p className="mt-2 text-xl font-semibold text-green-600">
              Connected
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8">
          <h2 className="text-xl font-semibold text-slate-900">
            {isClient
              ? "Post a requirement"
              : "Add your offering"}
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {isClient
              ? "Your procurement workspace will appear here."
              : "Your supplier workspace will appear here."}
          </p>
        </section>
      </div>
    </main>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getMyProfile, getOfferings } from "../../lib/supplymatch-api";
import { supabase } from "../../lib/supabase";
import type { Offering, Profile } from "../../types/api";

export default function OfferingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOfferings() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      try {
        const currentProfile = await getMyProfile();

        if (currentProfile.role !== "supplier") {
          window.location.href = "/dashboard";
          return;
        }

        const currentOfferings = await getOfferings();

        setProfile(currentProfile);
        setOfferings(currentOfferings);
      } catch (offeringsError) {
        setError(
          offeringsError instanceof Error
            ? offeringsError.message
            : "Unable to load your offerings.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadOfferings();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-sm text-slate-600">
            Loading your offerings...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              SupplyMatch
            </p>
            <h1 className="text-xl font-bold text-slate-900">
              My Offerings
            </h1>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Dashboard
            </Link>

            <Link
              href="/offerings/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add Offering
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Supplier workspace
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Your offerings
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Manage the products and services you offer to buyers.
          </p>

          {profile?.company && (
            <p className="mt-2 text-sm text-slate-500">
              {profile.company}
            </p>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!error && offerings.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              No offerings yet
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Add your first offering so SupplyMatch can identify relevant
              buyer requirements.
            </p>

            <Link
              href="/offerings/new"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add Your First Offering
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-5">
          {offerings.map((offering) => (
            <article
              key={offering.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {offering.product}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Offering ID: {offering.id}
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  Active
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Category
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {offering.category_id}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Quantity
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {offering.quantity}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Price
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {offering.price}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Location
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {offering.location}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Delivery
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {offering.delivery}
                  </p>
                </div>
              </div>

              {offering.notes && (
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Notes
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {offering.notes}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getRequirements } from "../../lib/supplymatch-api";
import { supabase } from "../../lib/supabase";
import type { Requirement } from "../../types/api";

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRequirements() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      try {
        const data = await getRequirements();
        setRequirements(data);
      } catch (requirementsError) {
        setError(
          requirementsError instanceof Error
            ? requirementsError.message
            : "Unable to load your requirements.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadRequirements();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-sm text-slate-600">
            Loading your requirements...
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
            <p className="text-sm font-semibold text-blue-600">SupplyMatch</p>
            <h1 className="text-xl font-bold text-slate-900">
              My Requirements
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
              href="/requirements/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              New Requirement
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Procurement workspace
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Your requirements
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Review the requirements you have submitted and find matching
            suppliers.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!error && requirements.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              No requirements yet
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Create your first requirement to start finding suppliers.
            </p>

            <Link
              href="/requirements/new"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Post a Requirement
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-5">
          {requirements.map((requirement) => (
            <article
              key={requirement.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {requirement.product}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Requirement ID: {requirement.id}
                  </p>
                </div>

                <Link
                  href={`/requirements/${requirement.id}/matches`}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Find Matches
                </Link>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Category
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {requirement.category_id}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Quantity
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {requirement.quantity}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Budget
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {requirement.budget}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Location
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {requirement.location}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Timeline
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {requirement.timeline}
                  </p>
                </div>
              </div>

              {requirement.notes && (
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Notes
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {requirement.notes}
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
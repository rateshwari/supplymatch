"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getSupplierMatches } from "@/lib/supplymatch-api";
import type { SupplierMatch } from "@/types/api";

function formatScore(score: number): string {
  return `${Math.round(score)}%`;
}

function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium text-slate-700">
          {Math.round(value)}%
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function RequirementCard({
  match,
}: {
  match: SupplierMatch;
}) {
  const { requirement } = match;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Buyer requirement
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              {requirement.product}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Buyer request matched to your offering
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
              {match.status}
            </span>

            <div className="rounded-xl bg-slate-950 px-4 py-2 text-right text-white">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                Match
              </p>
              <p className="text-xl font-semibold">
                {formatScore(match.score)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem label="Quantity" value={requirement.quantity} />
          <InfoItem label="Budget" value={requirement.budget} />
          <InfoItem label="Location" value={requirement.location} />
          <InfoItem label="Timeline" value={requirement.timeline} />
        </div>

        {requirement.notes && (
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Buyer notes
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {requirement.notes}
            </p>
          </div>
        )}

        <div className="grid gap-6 border-t border-slate-100 pt-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Why this matches
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {match.explanation}
            </p>

            {match.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {match.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Match breakdown
            </p>

            <ScoreBar
              label="Semantic similarity"
              value={match.breakdown.semantic_similarity * 100}
            />

            <ScoreBar
              label="Category"
              value={match.breakdown.category * 100}
            />

            <ScoreBar
              label="Location"
              value={match.breakdown.location * 100}
            />

            <ScoreBar
              label="Quantity"
              value={match.breakdown.quantity * 100}
            />

            <ScoreBar
              label="Budget"
              value={match.breakdown.budget * 100}
            />

            <ScoreBar
              label="Delivery"
              value={match.breakdown.delivery * 100}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export default function SupplierMatchesPage() {
  const router = useRouter();

  const [matches, setMatches] = useState<SupplierMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMatches() {
      try {
        setLoading(true);
        setError("");

        const data = await getSupplierMatches();

        if (active) {
          setMatches(data);
        }
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load matched requirements.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMatches();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-8 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        >
          ← Back to dashboard
        </button>

        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Supplier workspace
          </p>

          <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Matched requirements
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Buyer requirements that SupplyMatch has identified as relevant
                to your offerings.
              </p>
            </div>

            {!loading && (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs text-slate-400">Active matches</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">
                  {matches.length}
                </p>
              </div>
            )}
          </div>
        </header>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm text-slate-500">
              Loading matched requirements...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              No matched requirements yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Add an offering that matches what buyers are looking for. New
              relevant requirements will appear here when matches are
              generated.
            </p>

            <button
              type="button"
              onClick={() => router.push("/offerings/new")}
              className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add an offering
            </button>
          </div>
        )}

        {!loading && !error && matches.length > 0 && (
          <div className="space-y-5">
            {matches.map((match) => (
              <RequirementCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
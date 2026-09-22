"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  generateMatches,
  getRequirementMatches,
  getRequirements,
} from "../../../../lib/supplymatch-api";
import { supabase } from "../../../../lib/supabase";
import type { Match, Requirement } from "../../../../types/api";

type MatchesPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function matchScorePercentage(score: number): string {
  return `${Math.round(score)}%`;
}

function componentPercentage(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export default function MatchesPage({ params }: MatchesPageProps) {
  const [requirementId, setRequirementId] = useState("");
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPage() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      const resolvedParams = await params;
      const id = resolvedParams.id;

      setRequirementId(id);

      try {
        const [requirements, existingMatches] = await Promise.all([
          getRequirements(),
          getRequirementMatches(id),
        ]);

        const currentRequirement = requirements.find(
          (item) => item.id === id,
        );

        if (!currentRequirement) {
          setError("Requirement not found.");
          return;
        }

        setRequirement(currentRequirement);
        setMatches(existingMatches);
      } catch (matchesError) {
        setError(
          matchesError instanceof Error
            ? matchesError.message
            : "Unable to load matches.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [params]);

  async function handleGenerateMatches() {
    if (!requirementId) {
      return;
    }

    setGenerating(true);
    setError("");
    setMessage("");

    try {
      const generatedMatches = await generateMatches(requirementId);
      setMatches(generatedMatches);

      setMessage(
        generatedMatches.length > 0
          ? `${generatedMatches.length} supplier matches found.`
          : "No matching suppliers were found.",
      );
    } catch (matchesError) {
      setError(
        matchesError instanceof Error
          ? matchesError.message
          : "Unable to generate matches.",
      );
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-sm text-slate-600">
            Loading supplier matches...
          </p>
        </div>
      </main>
    );
  }

  if (error && !requirement) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-semibold text-red-900">
              Unable to load matches
            </h1>

            <p className="mt-2 text-sm text-red-700">{error}</p>

            <Link
              href="/requirements"
              className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Back to Requirements
            </Link>
          </div>
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
              AI Supplier Matches
            </h1>
          </div>

          <Link
            href="/requirements"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            My Requirements
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {requirement && (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">
                  Your requirement
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  {requirement.product}
                </h2>

                <div className="mt-3 flex flex-wrap gap-2">
                  <RequirementBadge>
                    {requirement.quantity}
                  </RequirementBadge>

                  <RequirementBadge>
                    {requirement.location}
                  </RequirementBadge>

                  <RequirementBadge>
                    Delivery: {requirement.timeline}
                  </RequirementBadge>

                  <RequirementBadge>
                    Budget: {requirement.budget}
                  </RequirementBadge>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateMatches}
                disabled={generating}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating
                  ? "Finding Suppliers..."
                  : "Generate AI Matches"}
              </button>
            </div>
          </section>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-700">{message}</p>
          </div>
        )}

        {matches.length === 0 && !error && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              No matches yet
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Generate AI matches to find suppliers for this requirement.
            </p>
          </div>
        )}

        {matches.length > 0 && (
          <div className="mt-8">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">
                  AI-ranked suppliers
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Recommended matches
                </h2>
              </div>

              <p className="text-sm text-slate-500">
                {matches.length}{" "}
                {matches.length === 1 ? "supplier" : "suppliers"} found
              </p>
            </div>

            <div className="space-y-5">
              {matches.map((match, index) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function MatchCard({
  match,
  index,
}: {
  match: Match;
  index: number;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Match #{index + 1}
              </span>

              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold capitalize text-green-700">
                {match.status}
              </span>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Supplier
              </p>

              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                {match.supplier.name}
              </h3>

              {match.supplier.company && (
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {match.supplier.company}
                </p>
              )}
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Offering
              </p>

              <h4 className="mt-1 text-lg font-semibold text-slate-900">
                {match.offering.product}
              </h4>

              {match.offering.notes && (
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  {match.offering.notes}
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 rounded-2xl border border-blue-100 bg-blue-50 px-7 py-5 text-center lg:min-w-36">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Match Score
            </p>

            <p className="mt-1 text-4xl font-bold tracking-tight text-blue-700">
              {matchScorePercentage(match.score)}
            </p>

            <p className="mt-1 text-xs text-blue-600">
              AI compatibility
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-3 border-y border-slate-100 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <OfferingDetail
            label="Price"
            value={match.offering.price}
          />

          <OfferingDetail
            label="Quantity"
            value={match.offering.quantity}
          />

          <OfferingDetail
            label="Location"
            value={match.offering.location}
          />

          <OfferingDetail
            label="Delivery"
            value={match.offering.delivery}
          />
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />

            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Why this supplier matched
            </p>

            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            {match.explanation}
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Score
            label="Semantic Similarity"
            value={match.breakdown.semantic_similarity}
          />

          <Score
            label="Category"
            value={match.breakdown.category}
          />

          <Score
            label="Location"
            value={match.breakdown.location}
          />

          <Score
            label="Quantity"
            value={match.breakdown.quantity}
          />

          <Score
            label="Budget"
            value={match.breakdown.budget}
          />

          <Score
            label="Delivery"
            value={match.breakdown.delivery}
          />
        </div>

        {match.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {match.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function RequirementBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

function OfferingDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Score({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{label}</p>

        <p className="text-sm font-bold text-slate-900">
          {componentPercentage(value)}
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{
            width: `${Math.min(Math.max(value * 100, 0), 100)}%`,
          }}
        />
      </div>
    </div>
  );
}
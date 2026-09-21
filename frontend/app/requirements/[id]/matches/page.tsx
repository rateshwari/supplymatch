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
            <p className="text-sm font-semibold text-blue-600">SupplyMatch</p>
            <h1 className="text-xl font-bold text-slate-900">
              AI Supplier Matches
            </h1>
          </div>

          <Link
            href="/requirements"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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

                <p className="mt-2 text-sm text-slate-600">
                  {requirement.quantity} · {requirement.location} ·{" "}
                  {requirement.timeline}
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateMatches}
                disabled={generating}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating ? "Finding Suppliers..." : "Generate AI Matches"}
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

        <div className="mt-8 space-y-5">
          {matches.map((match, index) => (
            <article
              key={match.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      Match #{index + 1}
                    </span>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {match.status}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold text-slate-900">
                    Supplier Match
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Offering ID: {match.offering_id}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 px-6 py-4 text-center">
                  <p className="text-xs font-semibold uppercase text-blue-600">
                    Match Score
                  </p>
                  <p className="mt-1 text-3xl font-bold text-blue-700">
                    {matchScorePercentage(match.score)}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-900">
                  Why this supplier matched
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {match.explanation}
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
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
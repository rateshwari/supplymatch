"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AppShell from "@/components/app-shell";

import {
  generateMatches,
  getRequirementMatches,
  getRequirements,
} from "@/lib/supplymatch-api";

import { supabase } from "@/lib/supabase";

import type { Match, Requirement } from "@/types/api";

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

      try {
        const resolvedParams = await params;
        const id = resolvedParams.id;

        setRequirementId(id);

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
      <AppShell title="Matching Engine">
        <div className="flex min-h-[calc(100vh-78px)] items-center justify-center bg-[#f4f0e5]">
          <div className="text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#7b857e]">
              SupplyMatch // Matching Engine
            </p>

            <p className="mt-4 font-serif text-2xl text-[#1d2823]">
              Loading supplier matches...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error && !requirement) {
    return (
      <AppShell title="Matching Engine">
        <div className="bg-[#f4f0e5] px-8 py-12 lg:px-12">
          <div className="mx-auto max-w-[1200px] border border-[#b9c0b9] bg-[#f7f3e9] p-8">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#b94a2d]">
              ERROR // MATCHING ENGINE
            </p>

            <h1 className="mt-4 font-serif text-4xl text-[#1d2823]">
              Unable to load matches
            </h1>

            <p className="mt-4 text-sm leading-7 text-[#68716b]">
              {error}
            </p>

            <Link
              href="/requirements"
              className="mt-7 inline-flex bg-[#c65332] px-6 py-3 font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-white transition hover:bg-[#ad4328]"
            >
              Back to Requirements
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Matching Engine">
      <div className="bg-[#f4f0e5] px-6 py-10 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1320px]">
          {/* PAGE HEADER */}
          <section className="border-b-2 border-[#27332d] pb-7">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-[#758079]">
                  02 // MATCHING REGISTRY
                </p>

                <h1 className="mt-3 font-serif text-[46px] leading-none tracking-[-0.035em] text-[#1c2722] md:text-[58px]">
                  Supplier matches
                </h1>

                <p className="mt-4 max-w-2xl font-serif text-[17px] leading-7 text-[#707871]">
                  Review suppliers ranked by the SupplyMatch semantic and
                  structured matching engine.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href="/requirements"
                  className="border border-[#aeb7af] px-5 py-3 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#38453e] transition hover:bg-[#e9ede7]"
                >
                  My Requirements
                </Link>

                <button
                  type="button"
                  onClick={handleGenerateMatches}
                  disabled={generating}
                  className="bg-[#c65332] px-6 py-3 font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-white transition hover:bg-[#ad4328] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generating ? "Matching..." : "Run Matching Engine →"}
                </button>
              </div>
            </div>
          </section>

          {/* REQUIREMENT RECORD */}
          {requirement && (
            <section className="mt-7 border border-[#b8c0b9] bg-[#f7f3e9]">
              <div className="border-b border-[#cbd0c9] px-6 py-5 lg:px-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#7a847d]">
                      Requirement Record
                    </p>

                    <h2 className="mt-2 font-serif text-3xl tracking-[-0.02em] text-[#1d2823]">
                      {requirement.product}
                    </h2>

                    <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#8a928c]">
                      REF // {requirement.id}
                    </p>
                  </div>

                  <div className="border border-[#bfc7c0] bg-[#edf0eb] px-4 py-3">
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#7b857e]">
                      MATCHING STATUS
                    </p>

                    <p className="mt-1 font-serif text-base text-[#26332c]">
                      {matches.length > 0
                        ? `${matches.length} matches generated`
                        : "No matches generated"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid border-b border-[#cbd0c9] sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                <RequirementDetail
                  label="Quantity"
                  value={requirement.quantity}
                />

                <RequirementDetail
                  label="Budget"
                  value={requirement.budget}
                />

                <RequirementDetail
                  label="Location"
                  value={requirement.location}
                />

                <RequirementDetail
                  label="Timeline"
                  value={requirement.timeline}
                />

                <RequirementDetail
                  label="Category"
                  value={String(requirement.category_id)}
                />
              </div>

              {requirement.notes && (
                <div className="px-6 py-5 lg:px-7">
                  <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#7b857e]">
                    Requirement Notes
                  </p>

                  <p className="mt-2 max-w-4xl font-serif text-[15px] leading-7 text-[#657069]">
                    {requirement.notes}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* FEEDBACK */}
          {error && (
            <div className="mt-5 border border-[#c96b53] bg-[#f6e9e3] px-5 py-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#a63e27]">
                {error}
              </p>
            </div>
          )}

          {message && (
            <div className="mt-5 border border-[#b7c2b8] bg-[#e9eee8] px-5 py-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#52645a]">
                {message}
              </p>
            </div>
          )}

          {/* MATCHES */}
          <section className="mt-10">
            <div className="flex items-end justify-between border-b border-[#aeb6af] pb-4">
              <div>
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[#7a847d]">
                  Ranked Supplier Results
                </p>

                <h2 className="mt-2 font-serif text-3xl text-[#1d2823]">
                  Matching suppliers
                </h2>
              </div>

              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#7d867f]">
                {matches.length}{" "}
                {matches.length === 1 ? "RECORD" : "RECORDS"}
              </p>
            </div>

            {matches.length === 0 && !error && (
              <div className="mt-5 border border-dashed border-[#b9c1ba] bg-[#f7f3e9] px-8 py-16 text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#7a847d]">
                  MATCHING ENGINE // IDLE
                </p>

                <h3 className="mt-4 font-serif text-2xl text-[#1d2823]">
                  No matches generated yet
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#747d76]">
                  Run the matching engine to identify suppliers that align
                  with this requirement.
                </p>

                <button
                  type="button"
                  onClick={handleGenerateMatches}
                  disabled={generating}
                  className="mt-6 bg-[#17231d] px-6 py-3 font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-[#f4f0e5] transition hover:bg-[#27352e] disabled:opacity-60"
                >
                  {generating
                    ? "Finding Suppliers..."
                    : "Find Suppliers →"}
                </button>
              </div>
            )}

            {matches.length > 0 && (
              <div className="mt-5 space-y-5">
                {matches.map((match, index) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    index={index}
                  />
                ))}
              </div>
            )}
          </section>

          {/* FOOTER */}
          <footer className="mt-12 border-t-2 border-[#27332d] py-6">
            <div className="flex flex-col gap-3 font-mono text-[8px] uppercase tracking-[0.15em] text-[#858e87] sm:flex-row sm:items-center sm:justify-between">
              <span>
                ARCHIVE REF // SUPPLYMATCH / MATCHING ENGINE
              </span>

              <span>
                AUTHENTICATED SESSION // SEMANTIC + STRUCTURED MATCHING
              </span>
            </div>
          </footer>
        </div>
      </div>
    </AppShell>
  );
}

function RequirementDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-r border-[#cbd0c9] px-5 py-5 last:border-r-0">
      <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#858e87]">
        {label}
      </p>

      <p className="mt-2 font-serif text-[16px] text-[#26332c]">
        {value}
      </p>
    </div>
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
    <article className="border border-[#b7c0b8] bg-[#f7f3e9]">
      {/* MATCH HEADER */}
      <div className="border-b border-[#cbd0c9] px-6 py-6 lg:px-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#aeb8b0] font-mono text-[10px] font-semibold text-[#546159]">
              {String(index + 1).padStart(2, "0")}
            </div>

            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#7c867f]">
                SUPPLIER MATCH
              </p>

              <h3 className="mt-1 font-serif text-2xl tracking-[-0.02em] text-[#1d2823]">
                {match.supplier.name}
              </h3>

              {match.supplier.company && (
                <p className="mt-1 text-sm text-[#747d76]">
                  {match.supplier.company}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="border border-[#b8c1b9] bg-[#e9eee8] px-3 py-2 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#526259]">
              {match.status}
            </span>

            <div className="border border-[#25322c] bg-[#1b2721] px-5 py-3 text-center">
              <p className="font-mono text-[7px] uppercase tracking-[0.18em] text-[#aeb8b0]">
                MATCH SCORE
              </p>

              <p className="mt-1 font-serif text-3xl text-[#f4f0e5]">
                {matchScorePercentage(match.score)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* OFFERING */}
      <div className="grid lg:grid-cols-[1.4fr_1fr]">
        <div className="border-b border-[#cbd0c9] px-6 py-6 lg:border-b-0 lg:border-r lg:px-7">
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#7b857e]">
            Supplier Offering
          </p>

          <h4 className="mt-2 font-serif text-xl text-[#27342d]">
            {match.offering.product}
          </h4>

          {match.offering.notes && (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d766f]">
              {match.offering.notes}
            </p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-px border border-[#cbd0c9] bg-[#cbd0c9] md:grid-cols-4">
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
        </div>

        {/* EXPLANATION */}
        <div className="bg-[#edf0eb] px-6 py-6 lg:px-7">
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#718078]">
            Match Explanation
          </p>

          <p className="mt-3 font-serif text-[15px] leading-7 text-[#536159]">
            {match.explanation}
          </p>
        </div>
      </div>

      {/* BREAKDOWN */}
      <div className="border-t border-[#cbd0c9] px-6 py-6 lg:px-7">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.18em] text-[#78827b]">
            Matching Breakdown
          </p>

          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#909790]">
            SEMANTIC + STRUCTURED
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                className="border border-[#bdc5be] bg-[#edf0eb] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#68736c]"
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

function OfferingDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#f4f0e5] px-4 py-4">
      <p className="font-mono text-[7px] uppercase tracking-[0.17em] text-[#858e87]">
        {label}
      </p>

      <p className="mt-1 truncate font-serif text-[14px] text-[#2d3932]">
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
  const percentage = Math.min(
    Math.max(value * 100, 0),
    100,
  );

  return (
    <div className="border border-[#c4ccc5] bg-[#f7f3e9] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#5d6861]">{label}</p>

        <p className="font-mono text-[10px] font-semibold text-[#29362f]">
          {componentPercentage(value)}
        </p>
      </div>

      <div className="mt-3 h-[3px] bg-[#dce1db]">
        <div
          className="h-full bg-[#c65332]"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}
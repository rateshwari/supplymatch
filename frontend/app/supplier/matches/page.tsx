"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "@/components/app-shell";
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
  const percentage = Math.min(Math.max(value, 0), 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#7c827b]">
          {label}
        </span>

        <span className="font-mono text-[9px] font-semibold text-[#26312c]">
          {Math.round(value)}%
        </span>
      </div>

      <div className="h-[3px] w-full bg-[#dfe2dc]">
        <div
          className="h-full bg-[#26312c] transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
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
    <div className="border-r border-[#d0d3cc] px-5 py-4 first:pl-0 last:border-r-0">
      <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#858b84]">
        {label}
      </p>

      <p className="mt-2 font-serif text-[15px] text-[#26312c]">
        {value}
      </p>
    </div>
  );
}

function RequirementCard({
  match,
  index,
}: {
  match: SupplierMatch;
  index: number;
}) {
  const { requirement } = match;

  return (
    <article className="border border-[#aeb4ad] bg-[#f8f5ec]">
      {/* CARD HEADER */}
      <div className="flex flex-col gap-5 border-b border-[#d0d3cc] px-6 py-6 lg:flex-row lg:items-start lg:justify-between">

        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#aeb4ad] font-mono text-[9px] font-semibold text-[#536059]">
            {String(index + 1).padStart(2, "0")}
          </div>

          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#7c827b]">
              Buyer requirement
            </p>

            <h2 className="mt-2 font-serif text-[25px] leading-tight text-[#18221e]">
              {requirement.product}
            </h2>

            <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#8a9089]">
              Requirement ref // {match.requirement_id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 lg:pt-1">
          <span className="border border-[#c0c5be] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[#68716a]">
            {match.status}
          </span>

          <div className="min-w-[105px] border border-[#26312c] bg-[#26312c] px-4 py-3 text-right text-[#f4f0e5]">
            <p className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#aeb9b1]">
              Match score
            </p>

            <p className="mt-1 font-serif text-[24px] leading-none">
              {formatScore(match.score)}
            </p>
          </div>
        </div>
      </div>

      {/* REQUIREMENT DETAILS */}
      <div className="grid border-b border-[#d0d3cc] sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem
          label="Quantity"
          value={requirement.quantity}
        />

        <InfoItem
          label="Budget"
          value={requirement.budget}
        />

        <InfoItem
          label="Location"
          value={requirement.location}
        />

        <InfoItem
          label="Timeline"
          value={requirement.timeline}
        />
      </div>

      {/* NOTES */}
      {requirement.notes && (
        <div className="border-b border-[#d0d3cc] px-6 py-5">
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#858b84]">
            Buyer notes
          </p>

          <p className="mt-2 max-w-4xl font-serif text-[14px] leading-6 text-[#59625c]">
            {requirement.notes}
          </p>
        </div>
      )}

      {/* MATCH ANALYSIS */}
      <div className="grid lg:grid-cols-[1.15fr_0.85fr]">

        {/* EXPLANATION */}
        <div className="border-b border-[#d0d3cc] px-6 py-6 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.18em] text-[#69726b]">
              Match analysis
            </p>

            <span className="font-mono text-[7px] uppercase tracking-[0.15em] text-[#90958f]">
              Explainable result
            </span>
          </div>

          <h3 className="mt-3 font-serif text-[20px] text-[#26312c]">
            Why this matches
          </h3>

          <p className="mt-3 max-w-2xl font-serif text-[14px] leading-7 text-[#606861]">
            {match.explanation}
          </p>

          {match.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {match.tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-[#c5cac3] bg-[#eef0ea] px-3 py-1.5 font-mono text-[7px] uppercase tracking-[0.12em] text-[#5d6760]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* BREAKDOWN */}
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.18em] text-[#69726b]">
              Match breakdown
            </p>

            <span className="font-mono text-[7px] uppercase tracking-[0.15em] text-[#90958f]">
              Weighted score
            </span>
          </div>

          <div className="mt-5 space-y-4">
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

      {/* FOOTER */}
      <div className="flex flex-col gap-2 border-t border-[#d0d3cc] bg-[#eef0ea] px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono text-[7px] uppercase tracking-[0.15em] text-[#858b84]">
          SupplyMatch / Matching Engine
        </span>

        <span className="font-mono text-[7px] uppercase tracking-[0.15em] text-[#858b84]">
          Match record // {match.id}
        </span>
      </div>
    </article>
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
    <AppShell title="Matched Requirements">
      <main className="min-h-[calc(100vh-78px)] bg-[#f4f0e5] px-6 py-8 lg:px-10 lg:py-10">

        <div className="mx-auto max-w-[1400px]">

          {/* PAGE HEADER */}
          <section className="border-b-2 border-[#26312c] pb-7">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">

              <div>
                <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.2em] text-[#7b827b]">
                  02 // Matching Registry
                </p>

                <h1 className="mt-3 font-serif text-[42px] leading-none tracking-[-0.025em] text-[#18221e] lg:text-[50px]">
                  Matched requirements
                </h1>

                <p className="mt-4 max-w-2xl font-serif text-[15px] leading-7 text-[#68716a]">
                  Buyer requirements identified by the SupplyMatch engine as
                  relevant to your supplier offerings.
                </p>
              </div>

              {!loading && !error && (
                <div className="flex shrink-0 items-stretch">
                  <div className="border border-[#aeb4ad] px-5 py-4">
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#858b84]">
                      Active matches
                    </p>

                    <p className="mt-2 font-serif text-[27px] leading-none text-[#26312c]">
                      {matches.length}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/offerings/new")}
                    className="bg-[#bd4f2d] px-6 py-4 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#fffaf0] transition hover:bg-[#a94426]"
                  >
                    Add offering →
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* REGISTRY META */}
          <div className="flex flex-col justify-between gap-3 border-b border-[#c5cac3] py-4 sm:flex-row">
            <p className="font-mono text-[8px] uppercase tracking-[0.17em] text-[#858b84]">
              SupplyMatch / Supplier Match Registry
            </p>

            <p className="font-mono text-[8px] uppercase tracking-[0.17em] text-[#858b84]">
              Registry status:{" "}
              <span className="text-[#26312c]">Authenticated</span>
            </p>
          </div>

          {/* LOADING */}
          {loading && (
            <section className="mt-8 border border-[#aeb4ad] bg-[#f8f5ec] px-8 py-14 text-center">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#69726b]">
                Loading matching registry...
              </p>
            </section>
          )}

          {/* ERROR */}
          {!loading && error && (
            <section className="mt-8 border border-[#bd4f2d] bg-[#f8eee8] px-6 py-6">
              <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.17em] text-[#9d4127]">
                Matching engine error
              </p>

              <p className="mt-2 font-serif text-[15px] leading-6 text-[#733522]">
                {error}
              </p>
            </section>
          )}

          {/* EMPTY STATE */}
          {!loading && !error && matches.length === 0 && (
            <section className="mt-8 border border-[#aeb4ad] bg-[#f8f5ec]">

              <div className="border-b border-[#d0d3cc] px-6 py-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#7c827b]">
                  Matching registry
                </p>

                <h2 className="mt-2 font-serif text-[23px] text-[#26312c]">
                  No matched requirements
                </h2>
              </div>

              <div className="px-6 py-12 text-center">
                <p className="font-serif text-[16px] text-[#59625c]">
                  Your supplier offerings have not generated any buyer matches
                  yet.
                </p>

                <p className="mx-auto mt-3 max-w-lg font-serif text-[14px] leading-6 text-[#858b84]">
                  Add an offering to give the matching engine more supplier
                  inventory to compare against active buyer requirements.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/offerings/new")}
                  className="mt-7 bg-[#26312c] px-6 py-3 font-mono text-[8px] font-bold uppercase tracking-[0.17em] text-[#f4f0e5] transition hover:bg-[#18221e]"
                >
                  Add an offering →
                </button>
              </div>
            </section>
          )}

          {/* MATCH LIST */}
          {!loading && !error && matches.length > 0 && (
            <section className="mt-8">

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#7c827b]">
                    Active sourcing records
                  </p>

                  <h2 className="mt-2 font-serif text-[25px] text-[#26312c]">
                    Requirement matches
                  </h2>
                </div>

                <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#858b84]">
                  {matches.length} records
                </p>
              </div>

              <div className="space-y-6">
                {matches.map((match, index) => (
                  <RequirementCard
                    key={match.id}
                    match={match}
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}

          {/* FOOTER */}
          <footer className="mt-10 border-t-2 border-[#26312c] py-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row">
              <p className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#858b84]">
                Archive ref // SupplyMatch / Matching Registry
              </p>

              <p className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#858b84]">
                Matching records // Authenticated session
              </p>
            </div>
          </footer>
        </div>
      </main>
    </AppShell>
  );
}
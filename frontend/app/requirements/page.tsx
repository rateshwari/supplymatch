"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getRequirements, generateMatches } from "../../lib/supplymatch-api";
import { supabase } from "../../lib/supabase";

import type { Requirement } from "../../types/api";
import AppShell from "../../components/app-shell";

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function RequirementsPage() {
  const router = useRouter();

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const [matchMessage, setMatchMessage] = useState("");

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

  async function handleFindMatches(requirementId: string) {
  setMatchingId(requirementId);
  setMatchMessage("");

  try {
    await generateMatches(requirementId);

    router.push(`/requirements/${requirementId}/matches`);
  } catch (matchError) {
    setMatchMessage(
      matchError instanceof Error
        ? matchError.message
        : "Unable to generate supplier matches.",
    );

    setMatchingId(null);
  }
}

  if (loading) {
    return (
      <AppShell title="My Requirements">
        <main className="min-h-screen bg-[#f4f0e5] px-6 py-10 lg:px-10">
          <div className="mx-auto max-w-[1400px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#7c8179]">
              Loading requirement registry...
            </p>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell title="My Requirements">
      <main className="min-h-screen bg-[#f4f0e5]">
        <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
          {/* PAGE HEADER */}
          <section className="border-b-2 border-[#26312c] pb-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7a817b]">
                  01 // Procurement Registry
                </p>

                <h1 className="mt-3 font-serif text-4xl font-medium tracking-[-0.03em] text-[#18221e] sm:text-5xl">
                  My requirements
                </h1>

                <p className="mt-3 max-w-2xl font-serif text-base leading-7 text-[#6f756e]">
                  Review active sourcing requirements and identify suppliers
                  through the SupplyMatch matching engine.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="border border-[#aeb4ad] px-4 py-2.5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#858a83]">
                    Active records
                  </p>

                  <p className="mt-1 font-mono text-sm font-semibold text-[#1d2924]">
                    {requirements.length.toString().padStart(2, "0")}
                  </p>
                </div>

                <Link
                  href="/requirements/new"
                  className="border border-[#bd4f2d] bg-[#bd4f2d] px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-white transition hover:bg-[#a94326]"
                >
                  New requirement →
                </Link>
              </div>
            </div>
          </section>

          {/* REGISTRY META */}
          <section className="border-b border-[#bfc4bd] py-5">
            <div className="flex flex-col gap-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[#7d837c] sm:flex-row sm:items-center sm:justify-between">
              <span>SupplyMatch / Requirement Ledger</span>

              <span>
                Registry status:{" "}
                <span className="text-[#33443b]">Authenticated</span>
              </span>
            </div>
          </section>

          {/* ERROR */}
          {error && (
            <section className="mt-7 border border-[#a9472b] bg-[#f7e9e3] p-5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#923b25]">
                Registry error
              </p>

              <p className="mt-2 font-serif text-sm text-[#713322]">
                {error}
              </p>
            </section>
          )}

          {/* MATCH MESSAGE */}
          {matchMessage && (
            <section className="mt-7 border border-[#9ba79e] bg-[#e8ece7] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#34443c]">
                Matching engine
              </p>

              <p className="mt-1 font-serif text-sm text-[#26312c]">
                {matchMessage}
              </p>
            </section>
          )}

          {/* EMPTY STATE */}
          {!error && requirements.length === 0 && (
            <section className="mt-8 border border-[#8e958d] bg-[#f7f4eb]">
              <div className="border-b border-[#c4c8c1] px-6 py-5">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7c827b]">
                  Requirement registry
                </p>

                <h2 className="mt-2 font-serif text-2xl text-[#1b2721]">
                  No requirements recorded
                </h2>
              </div>

              <div className="px-6 py-8">
                <p className="max-w-xl font-serif text-base leading-7 text-[#70766f]">
                  Create your first procurement requirement to begin matching
                  against available supplier offerings.
                </p>

                <Link
                  href="/requirements/new"
                  className="mt-6 inline-flex border border-[#bd4f2d] bg-[#bd4f2d] px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#a94326]"
                >
                  Post a requirement →
                </Link>
              </div>
            </section>
          )}

          {/* REQUIREMENT REGISTRY */}
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7c827b]">
                  Active sourcing records
                </p>

                <h2 className="mt-1 font-serif text-2xl text-[#1b2721]">
                  Requirement ledger
                </h2>
              </div>

              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#858a83]">
                {requirements.length} records
              </span>
            </div>

            <div className="space-y-5">
              {requirements.map((requirement, index) => (
                <article
                  key={requirement.id}
                  className="border border-[#8e958d] bg-[#f8f5ec]"
                >
                  {/* RECORD HEADER */}
                  <div className="border-b border-[#c4c8c1] px-5 py-5 lg:px-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#aab0a8] font-mono text-[10px] font-bold text-[#4f5952]">
                          {(index + 1).toString().padStart(2, "0")}
                        </div>

                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#80867f]">
                            Requirement record
                          </p>

                          <h3 className="mt-1 font-serif text-2xl text-[#19231f]">
                            {requirement.product}
                          </h3>

                          <p className="mt-1 font-mono text-[9px] tracking-[0.08em] text-[#858a83]">
                            REF // {requirement.id}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleFindMatches(requirement.id)}
                        disabled={matchingId === requirement.id}
                        className="shrink-0 border border-[#26312c] bg-[#26312c] px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#18221e] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {matchingId === requirement.id
                          ? "Matching..."
                          : "Find suppliers →"}
                      </button>
                    </div>
                  </div>

                  {/* RECORD DETAILS */}
                  <div className="grid divide-y divide-[#c4c8c1] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
                    <div className="px-5 py-5 lg:px-6">
                      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#858a83]">
                        Category
                      </p>

                      <p className="mt-2 font-serif text-base text-[#253029]">
                        {requirement.category_id}
                      </p>
                    </div>

                    <div className="px-5 py-5 lg:px-6">
                      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#858a83]">
                        Quantity
                      </p>

                      <p className="mt-2 font-serif text-base text-[#253029]">
                        {requirement.quantity}
                      </p>
                    </div>

                    <div className="px-5 py-5 lg:px-6">
                      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#858a83]">
                        Budget
                      </p>

                      <p className="mt-2 font-serif text-base text-[#253029]">
                        {requirement.budget}
                      </p>
                    </div>

                    <div className="px-5 py-5 lg:px-6">
                      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#858a83]">
                        Location
                      </p>

                      <p className="mt-2 font-serif text-base text-[#253029]">
                        {requirement.location}
                      </p>
                    </div>

                    <div className="px-5 py-5 lg:px-6">
                      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#858a83]">
                        Timeline
                      </p>

                      <p className="mt-2 font-serif text-base text-[#253029]">
                        {requirement.timeline}
                      </p>
                    </div>
                  </div>

                  {/* NOTES */}
                  {requirement.notes && (
                    <div className="border-t border-[#c4c8c1] px-5 py-5 lg:px-7">
                      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#858a83]">
                        Requirement notes
                      </p>

                      <p className="mt-2 max-w-4xl font-serif text-sm leading-6 text-[#626a63]">
                        {requirement.notes}
                      </p>
                    </div>
                  )}

                  {/* RECORD FOOTER */}
                  <div className="flex flex-col gap-2 border-t border-[#c4c8c1] px-5 py-3 font-mono text-[8px] uppercase tracking-[0.14em] text-[#92978f] sm:flex-row sm:items-center sm:justify-between lg:px-7">
                    <span>Created // {formatDate(requirement.created_at)}</span>

                    <span>SupplyMatch / Active procurement record</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* FOOTER */}
          <footer className="mt-12 border-t-2 border-[#26312c] py-5">
            <div className="flex flex-col gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[#8b9089] sm:flex-row sm:items-center sm:justify-between">
              <span>Archive ref // SupplyMatch / Requirement Registry</span>

              <span>Authenticated procurement workspace</span>
            </div>
          </footer>
        </div>
      </main>
    </AppShell>
  );
}
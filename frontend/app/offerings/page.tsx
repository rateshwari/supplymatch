"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getMyProfile, getOfferings } from "../../lib/supplymatch-api";
import { supabase } from "../../lib/supabase";
import type { Offering, Profile } from "../../types/api";
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
      <AppShell title="My Offerings">
        <main className="min-h-screen bg-[#f4f0e5]">
          <div className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#7c827b]">
              Loading supplier registry...
            </p>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell title="My Offerings">
      <main className="min-h-screen bg-[#f4f0e5]">
        <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">

          {/* PAGE HEADER */}
          <section className="border-b-2 border-[#26312c] pb-7">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7b817a]">
                  02 // Supplier Registry
                </p>

                <h1 className="mt-3 font-serif text-4xl font-medium tracking-[-0.035em] text-[#18221e] sm:text-5xl">
                  My offerings
                </h1>

                <p className="mt-3 max-w-2xl font-serif text-base leading-7 text-[#6c736d]">
                  Manage the products and services you make available to
                  buyers through the SupplyMatch matching network.
                </p>

                {profile?.company && (
                  <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[#858a83]">
                    Supplier // {profile.company}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="border border-[#b8bdb6] px-4 py-3">
                  <p className="font-mono text-[8px] uppercase tracking-[0.17em] text-[#858a83]">
                    Active records
                  </p>

                  <p className="mt-1 font-mono text-sm font-semibold text-[#202a25]">
                    {offerings.length.toString().padStart(2, "0")}
                  </p>
                </div>

                <Link
                  href="/offerings/new"
                  className="border border-[#bd4f2d] bg-[#bd4f2d] px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#a84327]"
                >
                  New offering →
                </Link>
              </div>
            </div>
          </section>

          {/* REGISTRY META */}
          <section className="border-b border-[#c2c6bf] py-5">
            <div className="flex flex-col gap-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[#7d837c] sm:flex-row sm:items-center sm:justify-between">
              <span>SupplyMatch / Offering Ledger</span>

              <span>
                Registry status:{" "}
                <span className="text-[#34453c]">Authenticated</span>
              </span>
            </div>
          </section>

          {/* ERROR */}
          {error && (
            <section className="mt-7 border border-[#a9472b] bg-[#f7e8e1] p-5">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#963d26]">
                Registry error
              </p>

              <p className="mt-2 font-serif text-sm leading-6 text-[#713424]">
                {error}
              </p>
            </section>
          )}

          {/* EMPTY STATE */}
          {!error && offerings.length === 0 && (
            <section className="mt-8 border border-[#aeb4ad] bg-[#f8f5ec]">
              <div className="border-b border-[#c7cbc4] px-6 py-5">
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7c827b]">
                  Supplier registry
                </p>

                <h2 className="mt-2 font-serif text-2xl text-[#1c2822]">
                  No offerings recorded
                </h2>
              </div>

              <div className="px-6 py-8">
                <p className="max-w-xl font-serif text-base leading-7 text-[#6c736d]">
                  Add your first product or service so SupplyMatch can
                  identify buyer requirements that align with your offering.
                </p>

                <Link
                  href="/offerings/new"
                  className="mt-6 inline-flex border border-[#bd4f2d] bg-[#bd4f2d] px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#a84327]"
                >
                  Register offering →
                </Link>
              </div>
            </section>
          )}

          {/* OFFERING LEDGER */}
          {!error && offerings.length > 0 && (
            <section className="mt-8">

              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7c827b]">
                    Active supplier records
                  </p>

                  <h2 className="mt-1 font-serif text-2xl text-[#1b2721]">
                    Offering ledger
                  </h2>
                </div>

                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#858a83]">
                  {offerings.length} records
                </span>
              </div>

              <div className="space-y-5">
                {offerings.map((offering, index) => (
                  <article
                    key={offering.id}
                    className="border border-[#9da49c] bg-[#f8f5ec]"
                  >
                    {/* RECORD HEADER */}
                    <div className="border-b border-[#c7cbc4] px-5 py-5 lg:px-7">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex gap-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#aeb4ad] font-mono text-[9px] font-bold text-[#566059]">
                            {(index + 1).toString().padStart(2, "0")}
                          </div>

                          <div>
                            <p className="font-mono text-[9px] uppercase tracking-[0.17em] text-[#81877f]">
                              Supplier offering
                            </p>

                            <h3 className="mt-1 font-serif text-2xl tracking-[-0.02em] text-[#19231f]">
                              {offering.product}
                            </h3>

                            <p className="mt-1 font-mono text-[8px] tracking-[0.08em] text-[#8a9089]">
                              REF // {offering.id}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="border border-[#aeb8af] bg-[#e9eee8] px-3 py-2 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#43554b]">
                            Active
                          </span>

                          <Link
                            href="/supplier/matches"
                            className="border border-[#26312c] bg-[#26312c] px-5 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#18221e]"
                          >
                            View matches →
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* DETAILS */}
                    <div className="grid divide-y divide-[#c7cbc4] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
                      <div className="px-5 py-5 lg:px-6">
                        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#858a83]">
                          Category
                        </p>

                        <p className="mt-2 font-serif text-base text-[#26322c]">
                          {offering.category_id}
                        </p>
                      </div>

                      <div className="px-5 py-5 lg:px-6">
                        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#858a83]">
                          Quantity
                        </p>

                        <p className="mt-2 font-serif text-base text-[#26322c]">
                          {offering.quantity}
                        </p>
                      </div>

                      <div className="px-5 py-5 lg:px-6">
                        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#858a83]">
                          Price
                        </p>

                        <p className="mt-2 font-serif text-base text-[#26322c]">
                          {offering.price}
                        </p>
                      </div>

                      <div className="px-5 py-5 lg:px-6">
                        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#858a83]">
                          Location
                        </p>

                        <p className="mt-2 font-serif text-base text-[#26322c]">
                          {offering.location}
                        </p>
                      </div>

                      <div className="px-5 py-5 lg:px-6">
                        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#858a83]">
                          Delivery
                        </p>

                        <p className="mt-2 font-serif text-base text-[#26322c]">
                          {offering.delivery}
                        </p>
                      </div>
                    </div>

                    {/* NOTES */}
                    {offering.notes && (
                      <div className="border-t border-[#c7cbc4] px-5 py-5 lg:px-7">
                        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#858a83]">
                          Offering notes
                        </p>

                        <p className="mt-2 max-w-4xl font-serif text-sm leading-6 text-[#656d66]">
                          {offering.notes}
                        </p>
                      </div>
                    )}

                    {/* FOOTER */}
                    <div className="flex flex-col gap-2 border-t border-[#c7cbc4] px-5 py-3 font-mono text-[8px] uppercase tracking-[0.13em] text-[#92978f] sm:flex-row sm:items-center sm:justify-between lg:px-7">
                      <span>
                        Registered // {formatDate(offering.created_at)}
                      </span>

                      <span>
                        SupplyMatch / Active supplier record
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* PAGE FOOTER */}
          <footer className="mt-12 border-t-2 border-[#26312c] py-5">
            <div className="flex flex-col gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[#8b9089] sm:flex-row sm:items-center sm:justify-between">
              <span>
                SupplyMatch // Supplier Workspace
              </span>

              <span>
                Procurement intelligence / Authenticated
              </span>
            </div>
          </footer>
        </div>
      </main>
    </AppShell>
  );
}
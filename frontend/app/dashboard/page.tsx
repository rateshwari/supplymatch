"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getMyProfile } from "@/lib/supplymatch-api";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/api";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
};

function NavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "group flex items-center justify-between border px-3 py-3 text-sm transition",
        active
          ? "border-[#17211d] bg-[#17211d] text-[#f1f3ee]"
          : "border-transparent text-[#39423e] hover:border-[#c6cbc5] hover:bg-[#e9ece7]",
      ].join(" ")}
    >
      <span className="flex items-center gap-3">
        <span
          className={[
            "flex h-7 w-7 items-center justify-center border text-[11px] font-semibold",
            active
              ? "border-[#5e8069] text-[#d9e4da]"
              : "border-[#aeb6af] text-[#5d6761]",
          ].join(" ")}
        >
          {label.slice(0, 1)}
        </span>

        <span>{label}</span>
      </span>

      {active && (
        <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#b8c9bb]">
          Active
        </span>
      )}
    </Link>
  );
}

export default function AppShell({
  children,
  title = "SupplyMatch",
}: AppShellProps) {
  const pathname = usePathname();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
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
      } catch {
        await supabase.auth.signOut();
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading || !profile) {
    return (
      <main className="min-h-screen bg-[#f1f3ee] px-6 py-12 text-[#17211d]">
        <div className="mx-auto max-w-7xl border border-[#c6cbc5] bg-[#f5f0e5] p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#69736c]">
            SupplyMatch // Loading workspace
          </p>

          <p className="mt-4 font-serif text-2xl">
            Loading workspace...
          </p>
        </div>
      </main>
    );
  }

  const isClient = profile.role === "client";

  const isOverview = pathname === "/dashboard";

  const isRequirements =
    pathname === "/requirements" ||
    pathname.startsWith("/requirements/");

  const isOfferings =
    pathname === "/offerings" ||
    pathname.startsWith("/offerings/");

  const isSupplierMatches = pathname.startsWith("/supplier/matches");

  const isNotifications = pathname.startsWith("/notifications");

  return (
    <main className="min-h-screen bg-[#f1f3ee] text-[#17211d]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* SIDEBAR */}
        <aside className="w-full shrink-0 border-b border-[#aeb6af] bg-[#eef1ec] lg:w-[286px] lg:border-b-0 lg:border-r">
          <div className="flex min-h-screen flex-col">
            {/* BRAND */}
            <div className="border-b border-[#aeb6af] px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-serif text-[20px] font-bold tracking-[-0.02em]">
                    SUPPLYMATCH
                  </p>

                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[#69736c]">
                    [B2B / LEDGER /{" "}
                    {isClient ? "CLIENT" : "SUPPLIER"} NODE]
                  </p>
                </div>

                <span className="border border-[#8e9690] px-2 py-1 font-mono text-[8px] tracking-[0.12em] text-[#59635d]">
                  VER. 1.0
                </span>
              </div>
            </div>

            {/* NAVIGATION */}
            <nav className="flex-1 px-4 py-7">
              <div className="mb-3 px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#737b75]">
                01 // Workspace
              </div>

              <div className="space-y-1">
                <NavItem
                  href="/dashboard"
                  label="Overview"
                  active={isOverview}
                />

                {isClient ? (
                  <>
                    <NavItem
                      href="/requirements"
                      label="My Requirements"
                      active={isRequirements}
                    />

                    <NavItem
                      href="/requirements"
                      label="Matches"
                      active={false}
                    />
                  </>
                ) : (
                  <>
                    <NavItem
                      href="/offerings"
                      label="My Offerings"
                      active={isOfferings}
                    />

                    <NavItem
                      href="/supplier/matches"
                      label="Matched Requirements"
                      active={isSupplierMatches}
                    />
                  </>
                )}
              </div>

              <div className="mb-3 mt-9 px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#737b75]">
                02 // Discover
              </div>

              <div className="space-y-1">
                {isClient ? (
                  <NavItem
                    href="/requirements/new"
                    label="Post Requirement"
                    active={pathname === "/requirements/new"}
                  />
                ) : (
                  <NavItem
                    href="/offerings/new"
                    label="Add Offering"
                    active={pathname === "/offerings/new"}
                  />
                )}

                <div className="flex items-center justify-between px-3 py-3 text-sm text-[#59635d]">
                  <span className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center border border-[#aeb6af] text-[11px]">
                      C
                    </span>

                    <span>Categories</span>
                  </span>

                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#7a837d]">
                    SEC
                  </span>
                </div>
              </div>

              <div className="mb-3 mt-9 px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#737b75]">
                03 // Activity
              </div>

              <div className="space-y-1">
                <NavItem
                  href="/notifications"
                  label="Notifications"
                  active={isNotifications}
                />
              </div>
            </nav>

            {/* ACCOUNT */}
            <div className="border-t border-[#aeb6af] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#17211d] font-serif text-sm text-[#f1f3ee]">
                  {profile.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-serif text-sm font-semibold">
                    {profile.name}
                  </p>

                  <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[#69736c]">
                    Verified {isClient ? "Client" : "Supplier"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-5 w-full border border-[#aeb6af] px-3 py-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#4e5852] transition hover:border-[#17211d] hover:bg-[#e5e9e4]"
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="min-w-0 flex-1 bg-[#f5f0e5]">
          <header className="border-b border-[#aeb6af] bg-[#f1f3ee]">
            <div className="flex min-h-[64px] items-center justify-between px-6 py-4 lg:px-10">
              <div className="flex items-center gap-7">
                <span className="font-serif text-lg font-bold">
                  {title}
                </span>

                <div className="hidden items-center gap-6 font-mono text-[9px] uppercase tracking-[0.15em] text-[#59635d] md:flex">
                  <Link
                    href="/dashboard"
                    className={
                      isOverview
                        ? "border-b border-[#17211d] pb-1 text-[#17211d]"
                        : "hover:text-[#17211d]"
                    }
                  >
                    Dashboard
                  </Link>

                  <span>Procurement</span>

                  <span>Matching Engine</span>

                  <span>Audit Registry</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#39423e] underline decoration-[#8e9690] underline-offset-4 transition hover:text-[#b94f2d]"
              >
                Sign out
              </button>
            </div>
          </header>

          {children}
        </section>
      </div>
    </main>
  );
}
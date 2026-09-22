"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getMyProfile } from "@/lib/supplymatch-api";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/api";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
};

export default function AppShell({
  children,
  title = "SupplyMatch",
}: AppShellProps) {
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
        // Keep the shell usable even if profile loading fails.
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

  const isSupplier = profile?.role === "supplier";

  return (
    <div className="min-h-screen bg-[#f4f0e5] text-[#1d2823]">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="sticky top-0 flex h-screen w-[286px] shrink-0 flex-col border-r border-[#cbd0c9] bg-[#eef1ec]">
          {/* BRAND */}
          <div className="border-b border-[#cbd0c9] px-6 py-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link
                  href="/dashboard"
                  className="font-serif text-[24px] font-bold tracking-[-0.03em] text-[#18231e]"
                >
                  SUPPLYMATCH
                </Link>

                <p className="mt-2 max-w-[150px] font-mono text-[8px] uppercase leading-[1.5] tracking-[0.18em] text-[#69736d]">
                  [B2B / LEDGER / CLIENT NODE]
                </p>
              </div>

              <div className="border border-[#bfc6bf] px-2.5 py-2 text-center font-mono text-[8px] uppercase leading-[1.35] tracking-[0.14em] text-[#69736d]">
                VER.
                <br />
                1.0
              </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 overflow-y-auto px-4 py-7">
            {/* WORKSPACE */}
            <NavSection label="01 // WORKSPACE">
              <SidebarLink
                href="/dashboard"
                label="Overview"
                code="O"
              />

              {isSupplier ? (
                <SidebarLink
                  href="/offerings"
                  label="My Offerings"
                  code="M"
                />
              ) : (
                <SidebarLink
                  href="/requirements"
                  label="My Requirements"
                  code="M"
                />
              )}
            </NavSection>

            {/* DISCOVER */}
            <NavSection label="02 // DISCOVER">
              {isSupplier ? (
                <>
                  <SidebarLink
                    href="/offerings/new"
                    label="Add Offering"
                    code="P"
                  />

                  <SidebarLink
                    href="/supplier/matches"
                    label="Matched Requirements"
                    code="M"
                  />
                </>
              ) : (
                <>
                  <SidebarLink
                    href="/requirements/new"
                    label="Post Requirement"
                    code="P"
                  />

                  
                </>
              )}
            </NavSection>

            {/* ACTIVITY */}
            <NavSection label="03 // ACTIVITY">
              <SidebarLink
                href="/notifications"
                label="Notifications"
                code="N"
                suffix="ACTIVITY"
              />
            </NavSection>
          </nav>

          {/* ACCOUNT */}
          <div className="border-t border-[#cbd0c9] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#18231e] font-serif text-[17px] text-[#f4f0e5]">
                {profile?.name?.charAt(0).toUpperCase() || "U"}
              </div>

              <div className="min-w-0">
                <p className="truncate font-serif text-[15px] font-bold text-[#1d2823]">
                  {loading ? "Loading..." : profile?.name || "User"}
                </p>

                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.15em] text-[#727b75]">
                  {profile?.role === "supplier"
                    ? "VERIFIED SUPPLIER"
                    : "VERIFIED CLIENT"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-5 w-full border border-[#c5cbc4] px-4 py-3 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#4e5852] transition hover:border-[#1d2823] hover:bg-[#e6eae4]"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* MAIN APPLICATION AREA */}
        <div className="min-w-0 flex-1">
          {/* TOP BAR */}
          <header className="sticky top-0 z-20 flex h-[78px] items-center justify-between border-b border-[#cbd0c9] bg-[#f4f0e5]/95 px-8 backdrop-blur">
            <div className="flex items-center gap-8">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#7a837d]">
                {title}
              </span>

              <div className="hidden h-4 w-px bg-[#c5cbc4] md:block" />

              <div className="hidden items-center gap-7 md:flex">
                <Link
                  href="/dashboard"
                  className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#69736d] transition hover:text-[#18231e]"
                >
                  Dashboard
                </Link>

                <Link
                  href={
                    isSupplier ? "/offerings" : "/requirements"
                  }
                  className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#69736d] transition hover:text-[#18231e]"
                >

                </Link>

                <Link
                  href={
                    isSupplier
                      ? "/supplier/matches"
                      : "/requirements"
                  }
                  className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#69736d] transition hover:text-[#18231e]"
                >

                </Link>

                <Link
                  href="/notifications"
                  className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#69736d] transition hover:text-[#18231e]"
                >
            
                </Link>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#3d4842] underline decoration-[#aeb6af] underline-offset-4 transition hover:text-[#18231e]"
            >
              Sign Out
            </button>
          </header>

          {/* PAGE CONTENT */}
          <main className="min-h-[calc(100vh-78px)]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function NavSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <p className="px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[#7c857f]">
        {label}
      </p>

      <div className="mt-4 space-y-1">{children}</div>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  code,
  suffix,
}: {
  href: string;
  label: string;
  code: string;
  suffix?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 border border-transparent px-3 py-3.5 text-[#53605a] transition hover:border-[#c8cec7] hover:bg-[#e7ebe6] hover:text-[#18231e]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#c7cdc6] font-mono text-[10px] text-[#68736c] transition group-hover:border-[#7f8982]">
        {code}
      </span>

      <span className="flex-1 text-[15px]">{label}</span>

      {suffix && (
        <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#8a928c]">
          {suffix}
        </span>
      )}
    </Link>
  );
}
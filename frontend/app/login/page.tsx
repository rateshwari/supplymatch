"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { ApiRequestError } from "../../lib/api";
import { createProfile, getMyProfile } from "../../lib/supplymatch-api";
import { initializeAuthTokenProvider } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

type Role = "client" | "supplier";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    try {
      initializeAuthTokenProvider();

      try {
        await getMyProfile();
      } catch (profileError) {
        if (
          !(profileError instanceof ApiRequestError) ||
          profileError.status !== 404
        ) {
          throw profileError;
        }

        const metadata = data.user.user_metadata ?? {};

        const name =
          typeof metadata.name === "string"
            ? metadata.name.trim()
            : "";

        const company =
          typeof metadata.company === "string"
            ? metadata.company.trim()
            : "";

        const role: Role =
          metadata.role === "supplier"
            ? "supplier"
            : "client";

        if (!name) {
          throw new Error(
            "Your account is missing profile information. Please contact support.",
          );
        }

        await createProfile({
          role,
          name,
          company: company || null,
        });
      }

      window.location.href = "/dashboard";
    } catch (profileError) {
      await supabase.auth.signOut();

      setError(
        profileError instanceof Error
          ? profileError.message
          : "Login succeeded, but profile setup failed.",
      );

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f1f3ee] text-[#17211d]">
      <div className="relative min-h-screen px-4 py-6 sm:px-8 sm:py-10">


        <div className="min-h-screen bg-[#f1f3ee]">
          <header className="border-b border-[#cbd1cc] bg-[#eef2ee]">
            <div className="flex items-center justify-between px-5 py-4 sm:px-7">
              <Link href="/login" className="group">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-[#315f8f]" />

                  <span className="font-serif text-sm font-semibold tracking-wide text-[#17211d]">
                    SUPPLYMATCH
                  </span>

                  <span className="border border-[#b9c1bb] px-1.5 py-0.5 font-mono text-[7px] tracking-[0.12em] text-slate-500">
                    B2B / PROCUREMENT
                  </span>
                </div>

                <p className="mt-1 pl-4 font-mono text-[7px] uppercase tracking-[0.14em] text-slate-500">
                  PROCUREMENT INTELLIGENCE // AUTH GATEWAY
                </p>
              </Link>

              <div className="hidden items-center gap-5 sm:flex">
                <Link
                  href="/dashboard"
                  className="font-mono text-[8px] uppercase tracking-[0.12em] text-slate-500 hover:text-[#17211d]"
                >
                  Platform
                </Link>

                <Link
                  href="/signup"
                  className="border border-[#b9c1bb] bg-[#f8faf7] px-3 py-2 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-[#17211d] hover:bg-white"
                >
                  Get started
                </Link>

                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#17211d] text-[10px] text-white">
                  +
                </span>
              </div>
            </div>
          </header>

          <div className="grid flex-1 lg:grid-cols-[1.08fr_0.92fr]">
            <section className="relative border-b border-[#cbd1cc] bg-[#eef2ee] px-6 py-10 sm:px-10 lg:border-b-0 lg:border-r lg:px-12 lg:py-14">
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(49,95,143,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(49,95,143,0.10) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />

              <div className="relative">
                <div className="mb-7 flex items-center justify-between border-b border-[#cbd1cc] pb-2">
                  <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.15em] text-[#315f8f]">
                    SupplyMatch // Access Gateway
                  </p>

                  <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-slate-500">
                    SECURE SESSION
                  </span>
                </div>

                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-[#315f8f]">
                  B2B PROCUREMENT NETWORK
                </p>

                <h1 className="mt-4 max-w-xl font-serif text-4xl leading-[0.98] tracking-tight text-[#17211d] sm:text-5xl lg:text-6xl">
                  Procurement,
                  <br />
                  without the
                  <br />
                  back-and-forth.
                </h1>

                <p className="mt-6 max-w-lg text-sm leading-6 text-slate-600">
                  SupplyMatch connects structured buyer requirements with
                  relevant supplier offerings using semantic similarity and
                  procurement-specific matching criteria.
                </p>

                <div className="mt-9 max-w-xl border border-[#cbd1cc] bg-[#e4e9e5] p-5">
                  <div className="flex items-center justify-between border-b border-[#cbd1cc] pb-3">
                    <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#17211d]">
                      LIVE MATCHING WORKFLOW
                    </p>

                    <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#315f8f]">
                      ENGINE READY
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <div className="border border-[#315f8f] bg-[#f1f4f1] p-4">
                      <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-[#315f8f]">
                        BUYER REQUIREMENT
                      </p>

                      <p className="mt-3 font-serif text-xl text-[#17211d]">
                        Industrial Safety Gloves
                      </p>

                      <div className="mt-4 space-y-1 font-mono text-[7px] uppercase tracking-[0.08em] text-slate-500">
                        <p>Quantity: 10,000 units</p>
                        <p>Location: Mumbai</p>
                        <p>Timeline: 14 days</p>
                      </div>
                    </div>

                    <div className="hidden text-center sm:block">
                      <span className="font-mono text-lg text-[#315f8f]">
                        →
                      </span>

                      <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.08em] text-slate-500">
                        MATCH
                      </p>
                    </div>

                    <div className="space-y-2">
                      {[
                        ["01", "Supplier Alpha", "94%"],
                        ["02", "Supplier Beta", "91%"],
                        ["03", "Supplier Gamma", "87%"],
                      ].map(([number, name, score]) => (
                        <div
                          key={number}
                          className="flex items-center justify-between border border-[#cbd1cc] bg-[#f1f4f1] px-3 py-2"
                        >
                          <div>
                            <span className="font-mono text-[7px] text-slate-400">
                              {number}
                            </span>

                            <span className="ml-2 font-mono text-[8px] uppercase tracking-[0.06em] text-[#17211d]">
                              {name}
                            </span>
                          </div>

                          <span className="font-mono text-[8px] font-semibold text-[#315f8f]">
                            {score} MATCH
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 border-t border-[#cbd1cc] pt-3">
                    <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-slate-500">
                      Semantic similarity // category // location // quantity
                      // budget // delivery
                    </p>
                  </div>
                </div>

                <div className="mt-9 flex flex-wrap gap-x-7 gap-y-2 border-t border-[#cbd1cc] pt-4">
                  {[
                    "STRUCTURED REQUIREMENTS",
                    "SEMANTIC MATCHING",
                    "EXPLAINABLE SCORES",
                  ].map((item) => (
                    <span
                      key={item}
                      className="font-mono text-[7px] uppercase tracking-[0.11em] text-slate-500"
                    >
                      ● {item}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="flex items-center bg-[#f1f4f1] px-6 py-10 sm:px-10 lg:px-12">
              <div className="w-full">
                <div className="border-2 border-[#17211d] bg-[#f8faf7] shadow-[4px_4px_0_#17211d]">
                  <div className="border-b border-[#cbd1cc] px-6 py-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-slate-500">
                          [ ACCESS POINT ]
                        </p>

                        <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.1em] text-slate-400">
                          PROTOCOL: SUPPLYMATCH AUTH
                        </p>
                      </div>

                      <span className="h-2 w-2 rounded-full bg-[#315f8f]" />
                    </div>

                    <h2 className="mt-7 font-serif text-3xl tracking-tight text-[#17211d]">
                      Welcome back
                    </h2>

                    <p className="mt-2 text-sm leading-5 text-slate-500">
                      Sign in to continue to your SupplyMatch workspace.
                    </p>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-5 px-6 py-6"
                  >
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-[#17211d]"
                      >
                        Work email
                      </label>

                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        autoComplete="email"
                        placeholder="procurement@company.com"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label
                          htmlFor="password"
                          className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-[#17211d]"
                        >
                          Password
                        </label>

                        <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-slate-400">
                          AUTHENTICATED
                        </span>
                      </div>

                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        className={inputClass}
                      />
                    </div>

                    {error && (
                      <div className="border border-red-300 bg-red-50 px-4 py-3">
                        <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-red-700">
                          {error}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#b94f2d] px-4 py-3.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#9f4326] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading
                        ? "Authenticating..."
                        : "Sign in to SupplyMatch →"}
                    </button>
                  </form>

                  <div className="border-t border-[#cbd1cc] px-6 py-5 text-center">
                    <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-slate-500">
                      New to SupplyMatch?
                    </p>

                    <Link
                      href="/signup"
                      className="mt-2 inline-block font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[#b94f2d] hover:underline"
                    >
                      Create your account →
                    </Link>
                  </div>

                  <div className="border-t border-[#cbd1cc] bg-[#eef2ee] px-6 py-4">
                    <p className="font-mono text-[7px] leading-4 uppercase tracking-[0.08em] text-slate-500">
                      Authentication is handled through your SupplyMatch
                      account session. Your workspace is protected by
                      authenticated API access.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <footer className="border-t border-[#cbd1cc] bg-[#eef2ee] px-5 py-4 sm:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-slate-500">
                SUPPLYMATCH // PROCUREMENT INTELLIGENCE
              </p>

              <div className="flex gap-5 font-mono text-[7px] uppercase tracking-[0.1em] text-slate-400">
                <span>CLIENT WORKSPACE</span>
                <span>SUPPLIER WORKSPACE</span>
                <span>SECURE AUTH</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}

const inputClass =
  "w-full border border-[#9fa8a2] bg-[#eef2ee] px-4 py-3 text-sm text-[#17211d] outline-none transition placeholder:text-slate-400 focus:border-[#315f8f] focus:bg-white focus:ring-1 focus:ring-[#315f8f]";

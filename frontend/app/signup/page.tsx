"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { createProfile } from "../../lib/supplymatch-api";
import { supabase } from "../../lib/supabase";

type Role = "client" | "supplier";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("client");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          company: company || null,
          role,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setMessage(
        "Registration received. Check your email to confirm your account before signing in.",
      );
      setLoading(false);
      return;
    }

    try {
      await createProfile({
        role,
        name,
        company: company || null,
      });

      window.location.href = "/dashboard";
    } catch (profileError) {
      setError(
        profileError instanceof Error
          ? profileError.message
          : "Account created, but profile setup failed.",
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f1f3ee] text-[#17211d]">
      <div className="relative min-h-screen px-4 py-6 sm:px-8 sm:py-10">

        <div className="min-h-screen bg-[#f1f3ee]">
          <header className="border-b border-[#cbd1cc] bg-[#f1f3ee]">
            <div className="flex items-center justify-between px-5 py-4 sm:px-7">
              <Link href="/signup">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-[#315f8f]" />

                  <span className="font-serif text-sm font-semibold tracking-wide">
                    SUPPLYMATCH
                  </span>

                  <span className="border border-[#b9c1bb] px-1.5 py-0.5 font-mono text-[7px] tracking-[0.12em] text-slate-500">
                    B2B / PROCUREMENT
                  </span>
                </div>

                <p className="mt-1 pl-4 font-mono text-[7px] uppercase tracking-[0.14em] text-slate-500">
                  REGISTRATION // WORKSPACE CREATION
                </p>
              </Link>

              <Link
                href="/login"
                className="font-mono text-[8px] uppercase tracking-[0.12em] text-slate-500 transition hover:text-[#17211d]"
              >
                Already registered? Sign in →
              </Link>
            </div>
          </header>

          <div className="grid min-h-[680px] lg:grid-cols-[0.95fr_1.35fr]">
            <section className="relative hidden border-r border-[#cbd1cc] bg-[#f1f3ee] lg:block">


              <div className="relative flex h-full flex-col justify-between p-10 text-[#17211d]">
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#315f8f]">
                    SUPPLYMATCH // NETWORK ACCESS
                  </p>

                  <h1 className="mt-7 font-serif text-5xl leading-[0.95] tracking-tight">
                    Join the
                    <br />
                    procurement
                    <br />
                    network.
                  </h1>

                  <p className="mt-7 max-w-sm text-sm leading-6 text-slate-600">
                    Create a workspace to post procurement requirements or
                    publish supplier offerings and connect with relevant
                    businesses.
                  </p>
                </div>

                <div>
                  <div className="border border-[#b9c1bb] bg-[#ebece7] p-5">
                    <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#9eb4ca]">
                      NETWORK PROTOCOL
                    </p>

                    <div className="mt-5 space-y-4">
                      <NetworkRow
                        number="01"
                        title="CLIENT"
                        description="Post structured requirements"
                      />

                      <NetworkRow
                        number="02"
                        title="MATCH"
                        description="Semantic + structured ranking"
                      />

                      <NetworkRow
                        number="03"
                        title="SUPPLIER"
                        description="Publish relevant offerings"
                      />
                    </div>
                  </div>

                  <p className="mt-5 font-mono text-[7px] uppercase tracking-[0.1em] text-slate-400">
                    SUPPLYMATCH // PROCUREMENT INTELLIGENCE
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-[#f1f3ee] px-5 py-8 sm:px-10 sm:py-12 lg:px-16">
              <div className="mx-auto max-w-xl">
                <div className="mb-7 flex items-center justify-between border-b border-[#cbd1cc] pb-2">
                  <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#315f8f]">
                    REGISTRATION FORM
                  </p>

                  <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-slate-400">
                    DOC. REF. SM-REG-01
                  </p>
                </div>

                <div className="border border-[#17211d] bg-[#f5f0e5] p-6 sm:p-8">
                  <div className="border-b-2 border-[#17211d] pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-slate-500">
                          ORIGINAL
                        </p>

                        <h2 className="mt-2 font-serif text-3xl tracking-tight">
                          SUPPLYMATCH
                        </h2>
                      </div>

                      <span className="border border-[#b9c1bb] px-2 py-1 font-mono text-[7px] uppercase tracking-[0.1em] text-slate-500">
                        NEW ACCOUNT
                      </span>
                    </div>

                    <p className="mt-3 font-serif text-sm italic text-slate-500">
                      Registration form — complete all required fields.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-7 space-y-6">
                    <PaperField
                      label="Full name"
                      htmlFor="name"
                    >
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                        maxLength={255}
                        autoComplete="name"
                        placeholder="Enter your full name"
                        className={paperInput}
                      />
                    </PaperField>

                    <PaperField
                      label="Company"
                      htmlFor="company"
                      optional
                    >
                      <input
                        id="company"
                        type="text"
                        value={company}
                        onChange={(event) =>
                          setCompany(event.target.value)
                        }
                        maxLength={255}
                        autoComplete="organization"
                        placeholder="Company or organization"
                        className={paperInput}
                      />
                    </PaperField>

                    <PaperField
                      label="Email"
                      htmlFor="email"
                    >
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        autoComplete="email"
                        placeholder="you@company.com"
                        className={paperInput}
                      />
                    </PaperField>

                    <PaperField
                      label="Password"
                      htmlFor="password"
                    >
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        required
                        minLength={6}
                        autoComplete="new-password"
                        placeholder="Create a secure password"
                        className={paperInput}
                      />

                      <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.08em] text-slate-400">
                        Minimum 6 characters
                      </p>
                    </PaperField>

                    <div>
                      <div className="mb-3 flex items-end justify-between">
                        <p className={paperLabel}>Account type</p>

                        <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-slate-400">
                          SELECT ONE
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRole("client")}
                          className={`border px-4 py-4 text-left transition ${
                            role === "client"
                              ? "border-[#17211d] bg-[#e2e7e2] shadow-[2px_2px_0_#17211d]"
                              : "border-[#b9b5aa] bg-transparent hover:bg-[#ebe6db]"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em]">
                              Buyer / Client
                            </span>

                            <span className="font-mono text-xs">
                              {role === "client" ? "×" : "□"}
                            </span>
                          </div>

                          <p className="mt-2 font-serif text-sm text-slate-600">
                            Post requirements and discover suppliers.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRole("supplier")}
                          className={`border px-4 py-4 text-left transition ${
                            role === "supplier"
                              ? "border-[#17211d] bg-[#e2e7e2] shadow-[2px_2px_0_#17211d]"
                              : "border-[#b9b5aa] bg-transparent hover:bg-[#ebe6db]"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em]">
                              Supplier
                            </span>

                            <span className="font-mono text-xs">
                              {role === "supplier" ? "×" : "□"}
                            </span>
                          </div>

                          <p className="mt-2 font-serif text-sm text-slate-600">
                            Publish offerings and receive matches.
                          </p>
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="border border-red-300 bg-red-50 px-4 py-3">
                        <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-red-700">
                          {error}
                        </p>
                      </div>
                    )}

                    {message && (
                      <div className="border border-[#7c9a80] bg-[#e8eee8] px-4 py-3">
                        <p className="font-mono text-[9px] uppercase tracking-[0.06em] text-[#315f8f]">
                          {message}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full border-2 border-[#b94f2d] bg-transparent px-4 py-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b94f2d] transition hover:bg-[#b94f2d] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? "Registering..." : "Register →"}
                    </button>
                  </form>

                  <div className="mt-7 border-t border-dashed border-[#c5bfb1] pt-5">
                    <p className="font-serif text-xs text-slate-500">
                      Already registered?{" "}
                      <Link
                        href="/login"
                        className="font-semibold text-[#315f8f] underline underline-offset-2"
                      >
                        Sign in
                      </Link>
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-[#d3ccbd] pt-4">
                    <p className="font-mono text-[7px] uppercase tracking-[0.08em] text-slate-400">
                      ARCHIVE REF: SM-REG // REVISION 1
                    </p>

                    <p className="font-mono text-[7px] uppercase tracking-[0.08em] text-slate-400">
                      SUPPLYMATCH NETWORK
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex justify-between font-mono text-[7px] uppercase tracking-[0.1em] text-slate-400">
                  <span>ACCOUNT CREATION</span>
                  <span>SECURE AUTHENTICATION</span>
                </div>
              </div>
            </section>
          </div>

          <footer className="border-t border-[#cbd1cc] bg-[#f1f3ee] px-5 py-4 sm:px-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-slate-500">
                SUPPLYMATCH // B2B PROCUREMENT NETWORK
              </p>

              <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-slate-400">
                CLIENT + SUPPLIER WORKSPACES
              </p>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}

function PaperField({
  label,
  htmlFor,
  optional = false,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <label
          htmlFor={htmlFor}
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-600"
        >
          {label}
        </label>

        {optional && (
          <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-slate-400">
            Optional
          </span>
        )}
      </div>

      {children}
    </div>
  );
}

function NetworkRow({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-[#cbd1cc] pb-3 last:border-b-0 last:pb-0">
      <span className="font-mono text-[8px] text-[#315f8f]">{number}</span>

      <div>
        <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em]">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-600">{description}</p>
      </div>
    </div>
  );
}

const paperInput =
  "w-full border-0 border-b border-[#aaa394] bg-transparent px-0 py-2.5 font-serif text-[15px] text-[#17211d] outline-none transition placeholder:text-[#aaa394] focus:border-[#315f8f]";

const paperLabel =
  "font-mono text-[9px] uppercase tracking-[0.14em] text-slate-600";

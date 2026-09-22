"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  createRequirement,
  generateMatches,
  getMyProfile,
} from "../../../lib/supplymatch-api";
import { supabase } from "../../../lib/supabase";

type Step = 1 | 2 | 3 | 4;

interface FormData {
  product: string;
  categoryId: string;
  quantity: string;
  budget: string;
  location: string;
  timeline: string;
  notes: string;
}

const STEPS = [
  {
    number: 1,
    eyebrow: "01 INTAKE",
    title: "REQUIREMENT",
    description: "What are you sourcing?",
  },
  {
    number: 2,
    eyebrow: "02 SCALE",
    title: "PROCUREMENT",
    description: "How much do you need?",
  },
  {
    number: 3,
    eyebrow: "03 TRANSIT",
    title: "DELIVERY",
    description: "Where and when?",
  },
  {
    number: 4,
    eyebrow: "04 AUDIT",
    title: "REVIEW",
    description: "Verify your requirement",
  },
] as const;

const initialForm: FormData = {
  product: "",
  categoryId: "",
  quantity: "",
  budget: "",
  location: "",
  timeline: "",
  notes: "",
};

export default function NewRequirementPage() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(initialForm);

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkClientAccess() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      try {
        const profile = await getMyProfile();

        if (profile.role !== "client") {
          window.location.href = "/dashboard";
          return;
        }
      } catch (profileError) {
        setError(
          profileError instanceof Error
            ? profileError.message
            : "Unable to verify your account.",
        );
      } finally {
        setCheckingProfile(false);
      }
    }

    checkClientAccess();
  }, []);

  function updateField(field: keyof FormData, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  function validateStep(currentStep: Step) {
    if (currentStep === 1) {
      if (!form.product.trim()) {
        setError("Enter the product or service you need.");
        return false;
      }

      if (!form.categoryId || Number(form.categoryId) <= 0) {
        setError("Enter a valid category ID.");
        return false;
      }
    }

    if (currentStep === 2) {
      if (!form.quantity.trim()) {
        setError("Enter the quantity you require.");
        return false;
      }

      if (!form.budget.trim()) {
        setError("Enter your target budget.");
        return false;
      }
    }

    if (currentStep === 3) {
      if (!form.location.trim()) {
        setError("Enter the delivery location.");
        return false;
      }

      if (!form.timeline.trim()) {
        setError("Enter the required delivery timeline.");
        return false;
      }
    }

    setError("");
    return true;
  }

  function nextStep() {
    if (!validateStep(step)) {
      return;
    }

    setStep((current) => Math.min(4, current + 1) as Step);
  }

  function previousStep() {
    setError("");
    setStep((current) => Math.max(1, current - 1) as Step);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const requirement = await createRequirement({
        product: form.product.trim(),
        category_id: Number(form.categoryId),
        quantity: form.quantity.trim(),
        budget: form.budget.trim(),
        location: form.location.trim(),
        timeline: form.timeline.trim(),
        notes: form.notes.trim() || null,
      });

      await generateMatches(requirement.id);

      window.location.href = `/requirements/${requirement.id}/matches`;
    } catch (requirementError) {
      setError(
        requirementError instanceof Error
          ? requirementError.message
          : "Unable to create your requirement.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const unitTarget = useMemo(() => {
    const quantity = Number(form.quantity.replace(/[^0-9.]/g, ""));
    const budget = Number(form.budget.replace(/[^0-9.]/g, ""));

    if (!quantity || !budget || quantity <= 0 || budget <= 0) {
      return null;
    }

    return budget / quantity;
  }, [form.quantity, form.budget]);

  if (checkingProfile) {
    return (
      <main className="min-h-screen bg-[#f3f5f2] px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
            SupplyMatch // Access Verification
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#17211d]">
      <header className="border-b border-[#cbd1cc] bg-[#f3f5f2]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold tracking-tight text-[#17211d]"
            >
              SupplyMatch
            </Link>

            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
              B2B PROCUREMENT NETWORK // REQUISITION INTAKE
            </p>
          </div>

          <Link
            href="/requirements"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600 transition hover:text-[#17211d]"
          >
            ← Back to requirements
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-end justify-between border-b border-[#cbd1cc] pb-5">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#315f8f]">
              Procurement requisition
            </p>

            <h1 className="mt-2 font-serif text-4xl tracking-tight text-[#17211d] sm:text-5xl">
              New requirement
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Tell us what you need to source. SupplyMatch will use your
              procurement parameters to identify compatible supplier offerings.
            </p>
          </div>

          <div className="hidden text-right sm:block">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">
              Workflow
            </p>
            <p className="mt-1 font-mono text-xs text-slate-700">
              STEP {step} OF 4
            </p>
          </div>
        </div>

        <nav
          aria-label="Requirement creation steps"
          className="mt-6 border border-[#cbd1cc] bg-[#e9ede9]"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {STEPS.map((item) => {
              const active = step === item.number;
              const completed = step > item.number;

              return (
                <button
                  key={item.number}
                  type="button"
                  onClick={() => {
                    if (item.number < step) {
                      setError("");
                      setStep(item.number as Step);
                    }
                  }}
                  disabled={item.number > step}
                  className={[
                    "min-h-[76px] border-b border-[#cbd1cc] px-4 py-3 text-left transition sm:border-b-0 sm:border-r last:border-r-0",
                    active
                      ? "bg-[#f8faf7] text-[#17211d]"
                      : completed
                        ? "bg-[#eef2ee] text-[#315f8f]"
                        : "text-slate-500",
                    item.number > step
                      ? "cursor-default"
                      : "cursor-pointer hover:bg-[#f8faf7]",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em]">
                        {item.eyebrow}
                      </p>

                      <p className="mt-1 text-xs font-semibold tracking-[0.08em]">
                        {item.title}
                      </p>
                    </div>

                    <span className="font-mono text-xs">
                      {completed ? "✓" : active ? "•" : "○"}
                    </span>
                  </div>

                  <p className="mt-1 hidden text-[10px] text-slate-500 sm:block">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </nav>

        <form
          onSubmit={handleSubmit}
          className="mt-6 border border-[#cbd1cc] bg-[#f8faf7]"
        >
          {step === 1 && (
            <section className="min-h-[520px] p-6 sm:p-8">
              <SectionHeading
                eyebrow="SECTION A // REQUIREMENT INTAKE"
                title="What are you sourcing?"
                status="INTAKE ACTIVE"
              />

              <div className="mt-8 space-y-7">
                <FieldLabel
                  label="Product or material"
                  meta="PRIMARY REQUIREMENT"
                />

                <input
                  id="product"
                  value={form.product}
                  onChange={(event) =>
                    updateField("product", event.target.value)
                  }
                  placeholder="e.g. Industrial Safety Gloves"
                  maxLength={1000}
                  autoFocus
                  className={inputClass}
                />

                <p className="mt-[-20px] font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">
                  Describe the product, material, or service you need.
                </p>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <FieldLabel
                      label="Sector category"
                      meta="REQUIRED"
                    />

                    <input
                      id="categoryId"
                      type="number"
                      min="1"
                      value={form.categoryId}
                      onChange={(event) =>
                        updateField("categoryId", event.target.value)
                      }
                      placeholder="Category ID"
                      className={inputClass}
                    />

                    <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-slate-500">
                      Category selector will use your registered category
                      taxonomy.
                    </p>
                  </div>

                  <div className="border border-[#cbd1cc] bg-[#eef2ee] p-4">
                    <div className="flex items-start justify-between">
                      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#315f8f]">
                        SupplyMatch semantic classifier
                      </p>

                      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#315f8f]">
                        ENGINE READY
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-600">
                      Your product description will be compared against
                      supplier offerings using semantic similarity and
                      structured procurement criteria.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Semantic", "Category", "Location", "Budget"].map(
                        (tag) => (
                          <span
                            key={tag}
                            className="border border-[#cbd1cc] bg-[#f8faf7] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-slate-600"
                          >
                            {tag}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="min-h-[520px] p-6 sm:p-8">
              <SectionHeading
                eyebrow="SECTION B // PROCUREMENT SCALE"
                title="Scale & capital parameters"
                status="RATE PARAMETERS"
              />

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <FieldLabel
                    label="Required quantity"
                    meta="PROCUREMENT VOLUME"
                  />

                  <input
                    id="quantity"
                    value={form.quantity}
                    onChange={(event) =>
                      updateField("quantity", event.target.value)
                    }
                    placeholder="e.g. 10,000 units"
                    className={inputClassLarge}
                    autoFocus
                  />

                  <p className={helperClass}>
                    Include the unit when relevant: pieces, kg, tonnes, boxes,
                    etc.
                  </p>
                </div>

                <div>
                  <FieldLabel
                    label="Target budget"
                    meta="CAPITAL LIMIT"
                  />

                  <input
                    id="budget"
                    value={form.budget}
                    onChange={(event) =>
                      updateField("budget", event.target.value)
                    }
                    placeholder="e.g. ₹6,00,000"
                    className={inputClassLarge}
                  />

                  <p className={helperClass}>
                    Enter the total budget available for this requirement.
                  </p>
                </div>
              </div>

              <div className="mt-8 border border-[#cbd1cc] bg-[#eef2ee] p-5">
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#315f8f]">
                  Procurement summary
                </p>

                <div className="mt-5 grid gap-5 sm:grid-cols-3">
                  <SummaryMetric
                    label="Requirement"
                    value={form.product || "Not specified"}
                  />

                  <SummaryMetric
                    label="Volume"
                    value={form.quantity || "Not specified"}
                  />

                  <SummaryMetric
                    label="Budget"
                    value={form.budget || "Not specified"}
                  />
                </div>

                {unitTarget !== null && (
                  <div className="mt-5 border-t border-[#cbd1cc] pt-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500">
                      Derived target unit rate
                    </p>

                    <p className="mt-1 font-serif text-2xl text-[#315f8f]">
                      ₹
                      {unitTarget.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                      <span className="ml-1 font-sans text-xs text-slate-500">
                        / unit
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="min-h-[520px] p-6 sm:p-8">
              <SectionHeading
                eyebrow="SECTION C // LOGISTICS & DELIVERY"
                title="Logistics corridor & technical notes"
                status="ROUTING PARAMETERS"
              />

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <FieldLabel
                    label="Delivery location"
                    meta="RECEIVING LOCATION"
                  />

                  <input
                    id="location"
                    value={form.location}
                    onChange={(event) =>
                      updateField("location", event.target.value)
                    }
                    placeholder="e.g. Mumbai"
                    maxLength={255}
                    className={inputClass}
                    autoFocus
                  />

                  <p className={helperClass}>
                    City, region, or delivery destination.
                  </p>
                </div>

                <div>
                  <FieldLabel
                    label="Required timeline"
                    meta="LEAD TIME"
                  />

                  <input
                    id="timeline"
                    value={form.timeline}
                    onChange={(event) =>
                      updateField("timeline", event.target.value)
                    }
                    placeholder="e.g. Within 14 days"
                    maxLength={255}
                    className={inputClass}
                  />

                  <p className={helperClass}>
                    Specify your required delivery window.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <FieldLabel
                  label="Technical notes & specifications"
                  meta="OPTIONAL"
                />

                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(event) =>
                    updateField("notes", event.target.value)
                  }
                  rows={8}
                  maxLength={2000}
                  placeholder="Add specifications, quality requirements, preferred brands, certifications, packaging requirements, or other information suppliers should know."
                  className={`${inputClass} resize-none`}
                  autoFocus
                />

                <div className="mt-2 flex justify-between">
                  <p className={helperClass}>
                    More context helps the matching engine understand your
                    requirement.
                  </p>

                  <p className="font-mono text-[9px] text-slate-400">
                    {form.notes.length}/2000
                  </p>
                </div>
              </div>

              <div className="mt-8 border border-[#cbd1cc] bg-[#eef2ee] p-4">
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#315f8f]">
                  Matching context
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Location, delivery timeline, quantity, budget, category, and
                  semantic similarity will all contribute to supplier matching.
                </p>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="min-h-[520px] p-6 sm:p-8">
              <SectionHeading
                eyebrow="SECTION D // REQUIREMENT REVIEW"
                title="Requisition manifest review"
                status="READY TO MATCH"
              />

              <div className="mt-8 border-2 border-[#17211d]">
                <ReviewRow
                  label="Product / material"
                  value={form.product}
                  full
                />

                <ReviewRow
                  label="Category"
                  value={`Category ${form.categoryId}`}
                />

                <ReviewRow
                  label="Required quantity"
                  value={form.quantity}
                />

                <ReviewRow
                  label="Target budget"
                  value={form.budget}
                />

                <ReviewRow
                  label="Delivery location"
                  value={form.location}
                />

                <ReviewRow
                  label="Required timeline"
                  value={form.timeline}
                />

                <ReviewRow
                  label="Technical notes"
                  value={form.notes || "No additional notes provided."}
                  full
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="border border-[#cbd1cc] bg-[#eef2ee] px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#315f8f]">
                    ● Requirement complete
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    All required procurement parameters have been provided.
                  </p>
                </div>

                <div className="border border-[#cbd1cc] bg-[#eef2ee] px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#315f8f]">
                    ● Matching engine ready
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Supplier offerings will be ranked using semantic and
                    structured matching.
                  </p>
                </div>
              </div>
            </section>
          )}

          {error && (
            <div className="mx-6 mb-6 border border-red-300 bg-red-50 px-4 py-3 sm:mx-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-red-700">
                {error}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4 border-t border-[#cbd1cc] bg-[#eef2ee] px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={previousStep}
                disabled={step === 1 || submitting}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500 transition hover:text-[#17211d] disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Previous step
              </button>

              <span className="hidden h-4 w-px bg-[#cbd1cc] sm:block" />

              <Link
                href="/requirements"
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500 transition hover:text-[#17211d]"
              >
                Save & exit
              </Link>
            </div>

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="bg-[#b94f2d] px-6 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#9f4326]"
              >
                {step === 1 && "Continue to scale & budget →"}
                {step === 2 && "Continue to logistics & transit →"}
                {step === 3 && "Continue to manifest review →"}
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#b94f2d] px-7 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#9f4326] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Analyzing supplier network..."
                  : "Find my suppliers →"}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  status,
}: {
  eyebrow: string;
  title: string;
  status: string;
}) {
  return (
    <div className="border-b border-[#cbd1cc] pb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#315f8f]">
            {eyebrow}
          </p>

          <h2 className="mt-2 font-serif text-3xl tracking-tight text-[#17211d] sm:text-4xl">
            {title}
          </h2>
        </div>

        <span className="hidden border border-[#cbd1cc] bg-[#eef2ee] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-slate-600 sm:block">
          [{status}]
        </span>
      </div>
    </div>
  );
}

function FieldLabel({
  label,
  meta,
}: {
  label: string;
  meta: string;
}) {
  return (
    <div className="mb-2 flex items-end justify-between gap-4">
      <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#17211d]">
        {label}
      </label>

      <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-slate-400">
        [{meta}]
      </span>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-[#17211d]">
        {value}
      </p>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div
      className={[
        "border-b border-[#cbd1cc] px-4 py-4 last:border-b-0",
        full ? "" : "sm:flex sm:items-center sm:justify-between sm:gap-8",
      ].join(" ")}
    >
      <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p
        className={[
          "mt-1 text-sm text-[#17211d]",
          full ? "leading-6" : "sm:mt-0 sm:text-right",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

const inputClass =
  "w-full border border-[#9fa8a2] bg-[#f1f4f1] px-4 py-3 text-sm text-[#17211d] outline-none transition placeholder:text-slate-400 focus:border-[#315f8f] focus:bg-white focus:ring-1 focus:ring-[#315f8f]";

const inputClassLarge =
  "w-full border-2 border-[#9fa8a2] bg-[#f1f4f1] px-4 py-4 text-lg font-semibold text-[#17211d] outline-none transition placeholder:text-slate-400 focus:border-[#315f8f] focus:bg-white focus:ring-1 focus:ring-[#315f8f]";

const helperClass =
  "mt-2 font-mono text-[9px] leading-4 uppercase tracking-[0.08em] text-slate-500";

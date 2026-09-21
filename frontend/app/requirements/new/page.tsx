"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { ApiRequestError } from "../../../lib/api";
import { createRequirement } from "../../../lib/supplymatch-api";

export default function NewRequirementPage() {
  const [product, setProduct] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [timeline, setTimeline] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await createRequirement({
        product: product.trim(),
        category_id: Number(categoryId),
        quantity: quantity.trim(),
        budget: budget.trim(),
        location: location.trim(),
        timeline: timeline.trim(),
        notes: notes.trim() || null,
      });

      setSuccess("Requirement created successfully.");

      setProduct("");
      setCategoryId("");
      setQuantity("");
      setBudget("");
      setLocation("");
      setTimeline("");
      setNotes("");
    } catch (requestError) {
      if (requestError instanceof ApiRequestError) {
        setError(requestError.message);
      } else if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("Unable to create requirement.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-blue-600"
            >
              SupplyMatch
            </Link>

            <h1 className="mt-1 text-xl font-bold text-slate-900">
              New Requirement
            </h1>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Procurement
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Tell us what you need
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Provide your procurement requirements and SupplyMatch will use
              them to find suitable suppliers.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label
                htmlFor="product"
                className="block text-sm font-medium text-slate-700"
              >
                Product requirement
              </label>

              <textarea
                id="product"
                value={product}
                onChange={(event) => setProduct(event.target.value)}
                placeholder="Example: 500 custom printed cotton T-shirts"
                required
                rows={4}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="categoryId"
                  className="block text-sm font-medium text-slate-700"
                >
                  Category ID
                </label>

                <input
                  id="categoryId"
                  type="number"
                  min="1"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  placeholder="Example: 1"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1 text-xs text-slate-500">
                  We will replace this with a category selector next.
                </p>
              </div>

              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-slate-700"
                >
                  Quantity required
                </label>

                <input
                  id="quantity"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="Example: 500 units"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="budget"
                  className="block text-sm font-medium text-slate-700"
                >
                  Budget
                </label>

                <input
                  id="budget"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  placeholder="Example: ₹1,00,000"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-slate-700"
                >
                  Location
                </label>

                <input
                  id="location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Example: Mumbai, Maharashtra"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="timeline"
                className="block text-sm font-medium text-slate-700"
              >
                Delivery timeline
              </label>

              <input
                id="timeline"
                value={timeline}
                onChange={(event) => setTimeline(event.target.value)}
                placeholder="Example: Within 15 days"
                required
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-slate-700"
              >
                Additional notes
              </label>

              <textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add specifications, quality requirements, certifications, packaging details, etc."
                rows={5}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Requirement"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
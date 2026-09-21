"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { createOffering, getMyProfile } from "../../../lib/supplymatch-api";
import { supabase } from "../../../lib/supabase";

export default function NewOfferingPage() {
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [product, setProduct] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [delivery, setDelivery] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function checkSupplierAccess() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      try {
        const profile = await getMyProfile();

        if (profile.role !== "supplier") {
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

    checkSupplierAccess();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!product.trim()) {
      setError("Please enter the product you offer.");
      return;
    }

    if (!categoryId || Number(categoryId) <= 0) {
      setError("Please enter a valid category ID.");
      return;
    }

    if (!quantity.trim()) {
      setError("Please enter the available quantity.");
      return;
    }

    if (!price.trim()) {
      setError("Please enter your price.");
      return;
    }

    if (!location.trim()) {
      setError("Please enter your location.");
      return;
    }

    if (!delivery.trim()) {
      setError("Please enter your delivery timeline.");
      return;
    }

    setSubmitting(true);

    try {
      await createOffering({
        product: product.trim(),
        category_id: Number(categoryId),
        quantity: quantity.trim(),
        price: price.trim(),
        location: location.trim(),
        delivery: delivery.trim(),
        notes: notes.trim() || null,
      });

      setSuccess(
        "Your offering has been created successfully. SupplyMatch can now use it for buyer matching.",
      );

      setProduct("");
      setCategoryId("");
      setQuantity("");
      setPrice("");
      setLocation("");
      setDelivery("");
      setNotes("");
    } catch (offeringError) {
      setError(
        offeringError instanceof Error
          ? offeringError.message
          : "Unable to create your offering.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingProfile) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-sm text-slate-600">
            Checking supplier access...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              SupplyMatch
            </p>

            <h1 className="text-xl font-bold text-slate-900">
              Add Offering
            </h1>
          </div>

          <Link
            href="/offerings"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            My Offerings
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Supplier workspace
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Add a product offering
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Tell buyers what you offer so SupplyMatch can identify relevant
            procurement opportunities.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <section>
            <h3 className="text-lg font-semibold text-slate-900">
              Product details
            </h3>

            <div className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="product"
                  className="block text-sm font-medium text-slate-700"
                >
                  Product offered
                </label>

                <input
                  id="product"
                  type="text"
                  value={product}
                  onChange={(event) => setProduct(event.target.value)}
                  placeholder="e.g. Industrial Safety Gloves"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

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
                  placeholder="e.g. 1"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Category selector will be added during UI refinement.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-8 border-t border-slate-100 pt-8">
            <h3 className="text-lg font-semibold text-slate-900">
              Availability and pricing
            </h3>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-slate-700"
                >
                  Available quantity
                </label>

                <input
                  id="quantity"
                  type="text"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="e.g. 1000 units"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-slate-700"
                >
                  Price
                </label>

                <input
                  id="price"
                  type="text"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="e.g. ₹72/unit"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </section>

          <section className="mt-8 border-t border-slate-100 pt-8">
            <h3 className="text-lg font-semibold text-slate-900">
              Delivery
            </h3>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-slate-700"
                >
                  Location
                </label>

                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="e.g. Mumbai"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="delivery"
                  className="block text-sm font-medium text-slate-700"
                >
                  Delivery timeline
                </label>

                <input
                  id="delivery"
                  type="text"
                  value={delivery}
                  onChange={(event) => setDelivery(event.target.value)}
                  placeholder="e.g. 7 days"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </section>

          <section className="mt-8 border-t border-slate-100 pt-8">
            <h3 className="text-lg font-semibold text-slate-900">
              Additional information
            </h3>

            <div className="mt-5">
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-slate-700"
              >
                Notes
              </label>

              <textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={5}
                placeholder="Add product specifications, certifications, packaging details, or other useful information."
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </section>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700">{success}</p>

              <Link
                href="/offerings"
                className="mt-3 inline-flex text-sm font-semibold text-green-800 underline"
              >
                View my offerings
              </Link>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/offerings"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating Offering..." : "Create Offering"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
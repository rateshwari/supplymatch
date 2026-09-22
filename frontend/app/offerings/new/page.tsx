"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { createOffering, getMyProfile } from "../../../lib/supplymatch-api";
import { supabase } from "../../../lib/supabase";
import AppShell from "../../../components/app-shell";

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
      <AppShell title="Add Offering">
        <main className="min-h-screen bg-[#f4f0e5]">
          <div className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#7c827b]">
              Verifying supplier access...
            </p>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell title="Add Offering">
      <main className="min-h-screen bg-[#f4f0e5]">
        <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">

          {/* PAGE HEADER */}
          <section className="border-b-2 border-[#26312c] pb-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7b817a]">
                  02 // Supplier Registry
                </p>

                <h1 className="mt-3 font-serif text-4xl font-medium tracking-[-0.035em] text-[#18221e] sm:text-5xl">
                  New offering
                </h1>

                <p className="mt-3 max-w-2xl font-serif text-base leading-7 text-[#6c736d]">
                  Register a product or service in the SupplyMatch supplier
                  network so relevant buyer requirements can be identified.
                </p>
              </div>

              <Link
                href="/offerings"
                className="inline-flex w-fit border border-[#8f9790] px-5 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#26312c] transition hover:bg-[#e7e4da]"
              >
                ← Offering ledger
              </Link>
            </div>
          </section>

          {/* REGISTRY META */}
          <section className="border-b border-[#c2c6bf] py-5">
            <div className="flex flex-col gap-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[#7d837c] sm:flex-row sm:items-center sm:justify-between">
              <span>
                SupplyMatch / Supplier Intake Record
              </span>

              <span>
                Registry status:{" "}
                <span className="text-[#34453c]">
                  Authenticated
                </span>
              </span>
            </div>
          </section>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="mt-8 border border-[#9da49c] bg-[#f8f5ec]"
          >
            {/* FORM TITLE */}
            <div className="border-b border-[#c7cbc4] px-6 py-6 lg:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7c827b]">
                    Offering record
                  </p>

                  <h2 className="mt-2 font-serif text-2xl text-[#1b2721]">
                    Supplier product specification
                  </h2>

                  <p className="mt-2 max-w-2xl font-serif text-sm leading-6 text-[#6c736d]">
                    Provide the commercial and logistical information buyers
                    need to evaluate your offering.
                  </p>
                </div>

                <div className="border border-[#b8bdb6] px-4 py-3">
                  <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#858a83]">
                    Record type
                  </p>

                  <p className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-[#34453c]">
                    Supplier offering
                  </p>
                </div>
              </div>
            </div>

            {/* PRODUCT DETAILS */}
            <section className="border-b border-[#c7cbc4]">
              <div className="border-b border-[#d0d3cd] bg-[#eef0e9] px-6 py-4 lg:px-8">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#46544d]">
                  01 // Product identification
                </p>
              </div>

              <div className="grid gap-6 px-6 py-7 lg:grid-cols-2 lg:px-8">
                <div className="lg:col-span-2">
                  <label
                    htmlFor="product"
                    className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#59635d]"
                  >
                    Product offered
                  </label>

                  <input
                    id="product"
                    type="text"
                    value={product}
                    onChange={(event) => setProduct(event.target.value)}
                    placeholder="e.g. Industrial Safety Gloves"
                    className="mt-2 w-full border border-[#aeb4ad] bg-[#f5f3eb] px-4 py-3 font-serif text-base text-[#202a25] outline-none transition placeholder:text-[#9da29c] focus:border-[#26312c] focus:bg-[#fbfaf5]"
                  />

                  <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.1em] text-[#92978f]">
                    Primary product or material description
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="categoryId"
                    className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#59635d]"
                  >
                    Category ID
                  </label>

                  <input
                    id="categoryId"
                    type="number"
                    min="1"
                    value={categoryId}
                    onChange={(event) =>
                      setCategoryId(event.target.value)
                    }
                    placeholder="e.g. 1"
                    className="mt-2 w-full border border-[#aeb4ad] bg-[#f5f3eb] px-4 py-3 font-serif text-base text-[#202a25] outline-none transition placeholder:text-[#9da29c] focus:border-[#26312c] focus:bg-[#fbfaf5]"
                  />

                  <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.1em] text-[#92978f]">
                    Category selector will be refined in the procurement UI
                  </p>
                </div>
              </div>
            </section>

            {/* AVAILABILITY AND PRICING */}
            <section className="border-b border-[#c7cbc4]">
              <div className="border-b border-[#d0d3cd] bg-[#eef0e9] px-6 py-4 lg:px-8">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#46544d]">
                  02 // Commercial parameters
                </p>
              </div>

              <div className="grid gap-6 px-6 py-7 sm:grid-cols-2 lg:px-8">
                <div>
                  <label
                    htmlFor="quantity"
                    className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#59635d]"
                  >
                    Available quantity
                  </label>

                  <input
                    id="quantity"
                    type="text"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(event.target.value)
                    }
                    placeholder="e.g. 1000 units"
                    className="mt-2 w-full border border-[#aeb4ad] bg-[#f5f3eb] px-4 py-3 font-serif text-base text-[#202a25] outline-none transition placeholder:text-[#9da29c] focus:border-[#26312c] focus:bg-[#fbfaf5]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#59635d]"
                  >
                    Price
                  </label>

                  <input
                    id="price"
                    type="text"
                    value={price}
                    onChange={(event) =>
                      setPrice(event.target.value)
                    }
                    placeholder="e.g. ₹72/unit"
                    className="mt-2 w-full border border-[#aeb4ad] bg-[#f5f3eb] px-4 py-3 font-serif text-base text-[#202a25] outline-none transition placeholder:text-[#9da29c] focus:border-[#26312c] focus:bg-[#fbfaf5]"
                  />
                </div>
              </div>
            </section>

            {/* DELIVERY */}
            <section className="border-b border-[#c7cbc4]">
              <div className="border-b border-[#d0d3cd] bg-[#eef0e9] px-6 py-4 lg:px-8">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#46544d]">
                  03 // Fulfillment & logistics
                </p>
              </div>

              <div className="grid gap-6 px-6 py-7 sm:grid-cols-2 lg:px-8">
                <div>
                  <label
                    htmlFor="location"
                    className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#59635d]"
                  >
                    Supply location
                  </label>

                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(event) =>
                      setLocation(event.target.value)
                    }
                    placeholder="e.g. Mumbai"
                    className="mt-2 w-full border border-[#aeb4ad] bg-[#f5f3eb] px-4 py-3 font-serif text-base text-[#202a25] outline-none transition placeholder:text-[#9da29c] focus:border-[#26312c] focus:bg-[#fbfaf5]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="delivery"
                    className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#59635d]"
                  >
                    Delivery timeline
                  </label>

                  <input
                    id="delivery"
                    type="text"
                    value={delivery}
                    onChange={(event) =>
                      setDelivery(event.target.value)
                    }
                    placeholder="e.g. 7 days"
                    className="mt-2 w-full border border-[#aeb4ad] bg-[#f5f3eb] px-4 py-3 font-serif text-base text-[#202a25] outline-none transition placeholder:text-[#9da29c] focus:border-[#26312c] focus:bg-[#fbfaf5]"
                  />
                </div>
              </div>
            </section>

            {/* NOTES */}
            <section>
              <div className="border-b border-[#d0d3cd] bg-[#eef0e9] px-6 py-4 lg:px-8">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#46544d]">
                  04 // Technical notes
                </p>
              </div>

              <div className="px-6 py-7 lg:px-8">
                <label
                  htmlFor="notes"
                  className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#59635d]"
                >
                  Additional information
                </label>

                <textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={6}
                  placeholder="Add product specifications, certifications, packaging details, minimum order quantities, or other useful information."
                  className="mt-2 w-full resize-none border border-[#aeb4ad] bg-[#f5f3eb] px-4 py-3 font-serif text-base leading-6 text-[#202a25] outline-none transition placeholder:text-[#9da29c] focus:border-[#26312c] focus:bg-[#fbfaf5]"
                />

                <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.1em] text-[#92978f]">
                  Optional supplier specifications
                </p>
              </div>
            </section>

            {/* ERROR */}
            {error && (
              <div className="mx-6 mb-6 border border-[#a9472b] bg-[#f7e8e1] p-4 lg:mx-8">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#963d26]">
                  Submission error
                </p>

                <p className="mt-2 font-serif text-sm leading-6 text-[#713424]">
                  {error}
                </p>
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="mx-6 mb-6 border border-[#8fa096] bg-[#e8eee8] p-4 lg:mx-8">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#40564a]">
                  Registry update confirmed
                </p>

                <p className="mt-2 font-serif text-sm leading-6 text-[#44554c]">
                  {success}
                </p>

                <Link
                  href="/offerings"
                  className="mt-3 inline-flex font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#34483e] underline underline-offset-4"
                >
                  View offering ledger →
                </Link>
              </div>
            )}

            {/* ACTION BAR */}
            <div className="flex flex-col-reverse gap-3 border-t-2 border-[#26312c] bg-[#f1eee4] px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-[#8b9089]">
                  SupplyMatch // Supplier Intake
                </p>

                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[#a0a49e]">
                  All required fields must be completed
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Link
                  href="/offerings"
                  className="inline-flex items-center justify-center border border-[#9ca39c] px-5 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-[#48524d] transition hover:bg-[#e6e3d9]"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center border border-[#bd4f2d] bg-[#bd4f2d] px-6 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#a84327] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Registering offering..."
                    : "Register offering →"}
                </button>
              </div>
            </div>
          </form>

          {/* FOOTER */}
          <footer className="mt-10 border-t-2 border-[#26312c] py-5">
            <div className="flex flex-col gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[#8b9089] sm:flex-row sm:items-center sm:justify-between">
              <span>
                SupplyMatch // Supplier Workspace
              </span>

              <span>
                Procurement intelligence / Authenticated session
              </span>
            </div>
          </footer>
        </div>
      </main>
    </AppShell>
  );
}
"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle, Crown, Lock, Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";

type MembershipCheckoutProps = {
  isActive: boolean;
  expiresAtLabel: string | null;
  amountInr: number;
  userName: string | null;
  userEmail: string | null;
};

type AppliedCoupon = {
  code: string;
  description: string | null;
  discountType: "flat" | "percent";
  discountValue: number;
};

type PricingPreview = {
  originalAmountInr: number;
  discountAmountInr: number;
  finalAmountInr: number;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function MembershipCheckout({
  isActive,
  expiresAtLabel,
  amountInr,
  userName,
  userEmail,
}: MembershipCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [showCheckoutPopup, setShowCheckoutPopup] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [pricingPreview, setPricingPreview] = useState<PricingPreview>({
    originalAmountInr: amountInr,
    discountAmountInr: 0,
    finalAmountInr: amountInr,
  });
  const router = useRouter();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const resetPricing = () => {
    setPricingPreview({
      originalAmountInr: amountInr,
      discountAmountInr: 0,
      finalAmountInr: amountInr,
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Enter a coupon code.");
      return;
    }

    setCouponLoading(true);
    setCouponError(null);
    try {
      const response = await fetch("/api/membership/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to apply coupon.");
      }

      setAppliedCoupon(result.coupon);
      setPricingPreview(result.pricing);
      setCouponCode(result.coupon.code);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to apply coupon.";
      setAppliedCoupon(null);
      resetPricing();
      setCouponError(message);
    } finally {
      setCouponLoading(false);
    }
  };

  const clearCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponError(null);
    resetPricing();
  };

  const openCheckoutPopup = () => {
    if (isActive || loading) return;
    setCouponError(null);
    setShowCheckoutPopup(true);
  };

  const closeCheckoutPopup = () => {
    if (loading) return;
    setShowCheckoutPopup(false);
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const orderResponse = await fetch("/api/membership/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: appliedCoupon?.code || "" }),
      });
      const order = await orderResponse.json();

      if (!orderResponse.ok || !order.id) {
        throw new Error(order.error || "Unable to create membership order.");
      }

      const rzp = new window.Razorpay!({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_jOXWfiSjhOX7IX",
        amount: order.amount,
        currency: order.currency,
        name: "LXD Guild",
        description: appliedCoupon ? `Annual Member Access (${appliedCoupon.code})` : "Annual Member Access",
        order_id: order.id,
        prefill: {
          name: userName || "",
          email: userEmail || "",
        },
        theme: { color: "#23b61f" },
        handler: async (response: Record<string, string>) => {
          const verifyResponse = await fetch("/api/membership/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const result = await verifyResponse.json();
          if (!verifyResponse.ok) {
            throw new Error(result.error || "Unable to verify membership payment.");
          }
          router.push("/dashboard/resources?activated=1");
          router.refresh();
          setShowCheckoutPopup(false);
        },
      });

      rzp.open();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start payment.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <section className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="marketing-kicker">
            <Sparkles className="h-3.5 w-3.5" />
            Annual Membership
          </div>
          <div>
            <h1 className="marketing-title max-w-2xl text-5xl sm:text-6xl">Upgrade into the full Guild ecosystem.</h1>
            <p className="marketing-copy mt-4 max-w-2xl text-base leading-8">
              Unlock the complete LXD Guild resource library across instructional design, facilitation, coaching, sales
              enablement, and applied technology.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <button onClick={openCheckoutPopup} disabled={isActive || loading} className="marketing-primary disabled:cursor-not-allowed disabled:opacity-60">
              {isActive ? "Membership Active" : loading ? "Opening checkout..." : "Get Member Access"}
              {!isActive && !loading && <ArrowRight className="h-4 w-4" />}
            </button>
            <a href="/dashboard/resources" className="marketing-secondary">
              Browse library
            </a>
          </div>
        </div>

        <div className="marketing-panel p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="marketing-soft-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Plan</p>
              <p className="mt-3 text-4xl font-bold text-[#17a21c]">1 Year</p>
              <div className="mt-3 h-1.5 rounded-full bg-[#e2ecd8]">
                <div className="h-1.5 w-[88%] rounded-full bg-[#23b61f]" />
              </div>
            </div>
            <div className="marketing-soft-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Status</p>
              <p className="mt-3 text-4xl font-bold text-[#111827]">{isActive ? "Active" : "Upgrade"}</p>
              <p className="mt-4 text-xs text-[#1da326]">
                {isActive ? `Valid until ${expiresAtLabel || "your expiry date"}` : "Unlock premium resources today"}
              </p>
            </div>
          </div>
          <div className="marketing-soft-card mt-4 p-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#111827] shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <Star className="h-4 w-4 text-[#23b61f]" />
              Premium support across candidate and employer journeys
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Feature icon={<CheckCircle className="h-5 w-5" />} accent="bg-[#e9fde2] text-[#15911b]" title="Premium resources" copy="Unlock the full toolkit of member-only downloads and practical assets." />
        <Feature icon={<Crown className="h-5 w-5" />} accent="bg-[#f3f4ff] text-[#7281d0]" title="Role-safe upgrade" copy="Membership adds depth to candidate and employer journeys without replacing them." />
        <Feature icon={<Star className="h-5 w-5" />} accent="bg-[#ffe9ee] text-[#cc5c82]" title="Long-term value" copy="One clean annual plan designed to support sustained progress across the platform." />
      </section>

      <section className="space-y-6">
        <div className="text-center">
          <h2 className="marketing-title text-4xl">Experience the fluid flow</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="marketing-grid-card p-6">
            <p className="text-sm font-semibold text-[#111827]">Plan visibility</p>
            <div className="mt-5 grid grid-cols-4 gap-3">
              {[34, 46, 62, 50].map((height, index) => (
                <div key={index} className={`${index === 2 ? "bg-[#35d421]" : "bg-[#dff5d8]"} rounded-t-xl`} style={{ height: `${height}px` }} />
              ))}
            </div>
          </div>
          <div className="marketing-grid-card p-6">
            <p className="text-sm font-semibold text-[#111827]">What unlocks</p>
            <p className="mt-3 text-sm leading-7 text-[#5b6757]">Member-only guides, templates, premium downloads, and a fuller support system.</p>
          </div>
          <div className="marketing-grid-card p-6">
            <p className="text-sm font-semibold text-[#111827]">Who it supports</p>
            <p className="mt-3 text-sm leading-7 text-[#5b6757]">Candidates and employers both keep their core role while adding premium access.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="marketing-grid-card p-8">
          <h2 className="text-3xl font-bold text-[#111827]">What membership adds</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              "Access all member-only templates and guides",
              "Download free resources immediately",
              "Keep access active for one full year",
              "Return and renew only when needed",
            ].map((item) => (
              <div key={item} className="marketing-soft-card px-4 py-4 text-sm font-medium text-[#334155]">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  {item}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.75rem] bg-[#f7faf4] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
              <Star className="h-4 w-4 text-[#23b61f]" />
              Why this feels premium
            </div>
            <p className="mt-3 text-sm leading-7 text-[#5b6757]">
              Membership is a high-value layer across the candidate and employer journeys, not just a plain payment box.
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-[2rem] border border-[#101827] bg-[#0b1020] p-8 text-white shadow-[0_24px_60px_rgba(9,23,55,0.18)]">
            <div className="inline-flex rounded-full bg-[#17381b] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#91f28c]">
              Membership Ready
            </div>
            <h3 className="mt-5 text-4xl font-bold">Guild Membership</h3>
            <p className="mt-4 text-sm leading-7 text-white/74">
              A premium layer built for deeper learning, stronger hiring systems, and full access to the Guild ecosystem.
            </p>
            <div className="mt-6 space-y-2 text-sm text-white/84">
              <p>Premium templates and guides</p>
              <p>Candidate and employer support</p>
              <p>Annual access to the full library</p>
            </div>
          </div>
        </div>
      </section>

      {showCheckoutPopup && !isActive && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(8,16,22,0.58)] p-4 pt-20 sm:items-start sm:pt-24">
          <div className="w-full max-w-xl rounded-[2rem] border border-[#dbe6d6] bg-white p-5 shadow-[0_28px_80px_rgba(7,19,31,0.28)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Membership checkout</p>
                <h3 className="mt-2 text-2xl font-bold text-[#111827]">Apply coupon before payment</h3>
                <p className="mt-2 text-sm leading-6 text-[#5b6757]">
                  Add an early-user coupon here if you have one, then continue to Razorpay checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCheckoutPopup}
                className="rounded-full border border-[#dbe6d6] px-3 py-1.5 text-sm font-semibold text-[#5b6757] transition hover:border-[#23b61f] hover:text-[#15803d]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 rounded-[1.6rem] border border-[#dbe6d6] bg-[#f8fbf5] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Early user coupon</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  value={couponCode}
                  onChange={(event) => {
                    setCouponCode(event.target.value.toUpperCase());
                    setCouponError(null);
                  }}
                  placeholder="Enter coupon code"
                  className="min-w-0 flex-1 rounded-2xl border border-[#dbe6d6] bg-white px-4 py-3 text-sm font-medium uppercase tracking-[0.12em] text-[#111827] outline-none transition focus:border-[#23b61f]"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || loading}
                  className="rounded-2xl border border-[#beddaf] bg-white px-5 py-3 text-sm font-semibold text-[#111827] transition hover:border-[#23b61f] hover:text-[#15803d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {couponLoading ? "Applying..." : "Apply"}
                </button>
              </div>

              {appliedCoupon && (
                <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-[#eafbe4] px-4 py-3 text-sm text-[#166534] sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{appliedCoupon.code} applied</p>
                    <p className="mt-1 text-xs text-[#3d6c45]">
                      {appliedCoupon.description ||
                        (appliedCoupon.discountType === "percent"
                          ? `${appliedCoupon.discountValue}% off membership`
                          : `Rs ${appliedCoupon.discountValue} off membership`)}
                    </p>
                  </div>
                  <button type="button" onClick={clearCoupon} className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#15803d]">
                    Remove
                  </button>
                </div>
              )}

              {couponError && <p className="mt-3 text-sm font-medium text-[#b42318]">{couponError}</p>}
            </div>

            <div className="mt-4 rounded-[1.6rem] border border-[#dbe6d6] bg-white p-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-[#5b6757]">Membership price</span>
                <span className={`font-semibold ${pricingPreview.discountAmountInr > 0 ? "line-through text-[#7a8773]" : "text-[#111827]"}`}>
                  Rs {pricingPreview.originalAmountInr}
                </span>
              </div>
              {pricingPreview.discountAmountInr > 0 && (
                <>
                  <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-[#15803d]">Coupon discount</span>
                    <span className="font-semibold text-[#15803d]">- Rs {pricingPreview.discountAmountInr}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4 border-t border-[#e7eee1] pt-3">
                    <span className="text-base font-semibold text-[#111827]">Final payable</span>
                    <span className="text-2xl font-extrabold text-[#111827]">Rs {pricingPreview.finalAmountInr}</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handlePurchase}
                disabled={loading}
                className="marketing-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Opening checkout..." : "Continue to Payment"}
              </button>
              <button
                type="button"
                onClick={closeCheckoutPopup}
                disabled={loading}
                className="marketing-secondary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Feature({
  icon,
  accent,
  title,
  copy,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  copy: string;
}) {
  return (
    <article className="marketing-grid-card p-8">
      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>{icon}</div>
      <h2 className="text-2xl font-bold text-[#111827]">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[#5b6757]">{copy}</p>
    </article>
  );
}

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

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const orderResponse = await fetch("/api/membership/order", { method: "POST" });
      const order = await orderResponse.json();

      if (!orderResponse.ok || !order.id) {
        throw new Error(order.error || "Unable to create membership order.");
      }

      const rzp = new window.Razorpay!({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_jOXWfiSjhOX7IX",
        amount: order.amount,
        currency: order.currency,
        name: "LXD Guild",
        description: "Annual Member Access",
        order_id: order.id,
        prefill: {
          name: userName || "",
          email: userEmail || "",
        },
        theme: {
          color: "#0f766e",
        },
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
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="premium-hero p-8 sm:p-10">
        <div className="premium-badge">
          <Sparkles className="h-3.5 w-3.5" />
          Annual membership
        </div>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">Tools &amp; resources membership</h1>
        <p className="premium-copy mt-3 max-w-2xl text-sm leading-7">
          Unlock the full LXD Guild resource library across instructional design, facilitation, sales enablement,
          coaching, technology application, and more. Candidates and employers can both subscribe.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            "Access all member-only templates and guides",
            "Download free resources immediately",
            "Keep access active for one full year",
            "Return and renew after expiry when needed",
          ].map((item) => (
            <div key={item} className="premium-metric text-sm font-medium text-white">
              <span className="inline-flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#34cd2f]" />
                {item}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[1.75rem] border border-white/12 bg-white/6 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Star className="h-4 w-4 text-[#5fd5ff]" />
            Why this feels premium
          </div>
          <p className="premium-copy mt-3 text-sm leading-7">
            Membership now reads as a high-value product layer across the candidate and employer journeys instead of a
            plain payment box.
          </p>
        </div>
      </div>

      <div className="premium-card-light p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">Member plan</p>
            <p className="text-xl font-bold text-zinc-950">1 year access</p>
          </div>
        </div>

        <div className="mt-6 flex items-baseline gap-2">
          <span className="text-5xl font-extrabold tracking-tight text-zinc-950">Rs {amountInr}</span>
          <span className="text-sm text-zinc-500">/ year</span>
        </div>

        {isActive ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
            <p className="font-semibold">Membership active</p>
            <p className="mt-1">Your pay button stays disabled until {expiresAtLabel || "your membership expires"}.</p>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <p className="font-semibold">Purchase required for locked resources</p>
            <p className="mt-1">Free resources remain downloadable without membership.</p>
          </div>
        )}

        <button
          onClick={handlePurchase}
          disabled={isActive || loading}
          className="premium-button premium-button-dark mt-6 flex w-full disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isActive ? <Lock className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
          {isActive ? "Membership Active" : loading ? "Opening checkout..." : "Pay Now"}
          {!isActive && !loading && <ArrowRight className="h-4 w-4" />}
        </button>

        <a
          href="/dashboard/resources"
          className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-zinc-200 px-5 py-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Browse resources
        </a>
      </div>
    </div>
  );
}

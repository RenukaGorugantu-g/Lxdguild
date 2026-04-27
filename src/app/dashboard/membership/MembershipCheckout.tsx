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
            <button onClick={handlePurchase} disabled={isActive || loading} className="marketing-primary disabled:cursor-not-allowed disabled:opacity-60">
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
              <p>• Premium templates and guides</p>
              <p>• Candidate and employer support</p>
              <p>• Annual access to the full library</p>
            </div>
          </div>

          <div className="marketing-grid-card p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6d7d68]">Member Plan</p>
                <p className="text-xl font-bold text-[#111827]">1 year access</p>
              </div>
            </div>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold tracking-tight text-[#111827]">Rs {amountInr}</span>
              <span className="text-sm text-[#6d7d68]">/ year</span>
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

            <button onClick={handlePurchase} disabled={isActive || loading} className="marketing-primary mt-6 flex w-full justify-center disabled:cursor-not-allowed disabled:opacity-60">
              {isActive ? <Lock className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
              {isActive ? "Membership Active" : loading ? "Opening checkout..." : "Get Started"}
            </button>

            <a href="/dashboard/resources" className="marketing-secondary mt-3 flex w-full justify-center">
              Continue to Library
            </a>
          </div>
        </div>
      </section>
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

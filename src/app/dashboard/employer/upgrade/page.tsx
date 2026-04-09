"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Dynamically load Razorpay SDK
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleUpgrade = async (plan: string, amount: number) => {
    setLoading(true);

    try {
      // 1. Create Order
      const res = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const order = await res.json();

      if (!order.id) throw new Error("Order creation failed");

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_jOXWfiSjhOX7IX", 
        amount: order.amount,
        currency: order.currency,
        name: "LXD Guild",
        description: `Upgrade to ${plan}`,
        order_id: order.id,
        handler: async function (response: any) {
           // Payment successful, update Supabase user role
           const { data: { user } } = await supabase.auth.getUser();
           if (user) {
              const newRole = plan === "Pro Plan" ? "employer_pro" : "employer_premium";
              await supabase.from("profiles").update({ role: newRole }).eq("id", user.id);
           }
           alert(`Payment successful! Welcome to the ${plan}.`);
           router.push("/dashboard/employer");
           router.refresh();
        },
        theme: {
          color: "#3b82f6",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
       console.error("Payment Error:", error);
       alert("Something went wrong opening the checkout gateway.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-28 pb-16 px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Upgrade Your Access</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">Unlock the world's most rigorously vetted directory of Instructional Designers and LXDs.</p>
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        
        {/* Pro Plan */}
        <div className="bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border rounded-3xl p-8 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">Pro Plan</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold">₹4,999</span>
              <span className="text-zinc-500">/mo</span>
            </div>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-brand-500 shrink-0" />
              <span>Full access to all MVP Candidate profiles</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-brand-500 shrink-0" />
              <span>View Exam Scorecards & detailed assessments</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-brand-500 shrink-0" />
              <span>Contact candidates directly</span>
            </li>
          </ul>
          <button 
            disabled={loading}
            onClick={() => handleUpgrade("Pro Plan", 4999)}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition"
          >
            Upgrade to Pro
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-gradient-to-b border border-brand-500 from-brand-600 to-accent-700 dark:from-brand-900 dark:to-accent-900 rounded-3xl p-8 shadow-lg text-white flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-white/20 px-4 py-1 rounded-bl-xl text-sm font-bold tracking-widest uppercase">Popular</div>
          <div className="mb-6 relative z-10">
            <h3 className="text-2xl font-bold mb-2">Premium Plan</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold">₹9,999</span>
              <span className="opacity-80">/mo</span>
            </div>
          </div>
          <ul className="space-y-4 mb-8 flex-1 relative z-10">
            <li className="flex items-center gap-3">
               <CheckCircle className="w-5 h-5 text-white shrink-0" />
               <span>Everything in Pro</span>
            </li>
            <li className="flex items-center gap-3">
               <CheckCircle className="w-5 h-5 text-white shrink-0" />
               <span>Post unlimited Jobs</span>
            </li>
            <li className="flex items-center gap-3">
               <CheckCircle className="w-5 h-5 text-white shrink-0" />
               <span>Featured employer branding</span>
            </li>
            <li className="flex items-center gap-3">
               <CheckCircle className="w-5 h-5 text-white shrink-0" />
               <span>Dedicated hiring concierge</span>
            </li>
          </ul>
          <button 
            disabled={loading}
            onClick={() => handleUpgrade("Premium Plan", 9999)}
            className="w-full py-3 bg-white text-brand-700 hover:bg-zinc-50 rounded-xl font-semibold transition relative z-10"
          >
            Upgrade to Premium
          </button>
        </div>

      </div>
    </div>
  );
}


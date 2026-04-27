"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { AuthLogo, DividerLabel, SocialButton } from "@/components/auth/AuthShared";
import { ArrowRight, BarChart3, BriefcaseBusiness, Eye, EyeOff, LockKeyhole, Mail, Users } from "lucide-react";

const featureCards = [
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Real-time market insights.",
    tint: "bg-[#82f468]",
    iconColor: "text-[#0f4f13]",
  },
  {
    icon: Users,
    title: "Direct Connect",
    description: "Peer-to-peer verification.",
    tint: "bg-[#d8defc]",
    iconColor: "text-[#4c5678]",
  },
];

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [supabase] = useState(() => createClient());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, keepSignedIn }),
    });

    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error || "Unable to sign in.");
      setLoading(false);
      return;
    }

    await supabase.auth.getSession();
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(173,255,142,0.68),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(198,248,137,0.32),transparent_26%),linear-gradient(135deg,#f8faef_0%,#f7faed_46%,#f0f7e8_100%)] text-[#1c232f]">
      <main className="mx-auto flex w-full max-w-[1320px] items-center px-5 py-24 md:px-8 lg:px-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <section className="relative overflow-hidden rounded-[34px] px-1 py-2 md:px-4 lg:py-4">
            <div className="max-w-[560px]">
              <AuthLogo />
              <h1 className="mt-6 max-w-[560px] text-[1.75rem] font-semibold leading-[1.08] tracking-[-0.05em] text-[#1d222a] sm:text-[2.2rem]">
                Elevate your professional journey with{" "}
                <span className="bg-[linear-gradient(90deg,#1f9c1f_0%,#1f7f25_40%,#7780a5_100%)] bg-clip-text text-transparent">
                  transparency and intent.
                </span>
              </h1>
              <p className="mt-5 max-w-[560px] text-[0.98rem] leading-7 text-[#56606f]">
                Join a high-trust ecosystem designed for modern careers. Whether you&apos;re hiring top talent or seeking your next milestone,
                we provide the tools for fluidic growth.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {featureCards.map(({ icon: Icon, title, description, tint, iconColor }) => (
                  <div
                    key={title}
                    className="flex items-center gap-4 rounded-[24px] border border-white/70 bg-white/88 px-5 py-4 shadow-[0_18px_44px_rgba(99,116,64,0.12)] backdrop-blur"
                  >
                    <span className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${tint} ${iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[1.02rem] font-medium text-[#3d4653]">{title}</p>
                      <p className="mt-0.5 text-sm text-[#7a8593]">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 hidden lg:block">
              <div className="relative h-[185px] w-[220px] rotate-2 overflow-hidden rounded-[26px] border-[10px] border-white bg-[linear-gradient(180deg,#d9d9d9,#8e8e8e)] shadow-[0_20px_50px_rgba(44,58,31,0.16)]">
                <div className="absolute inset-x-0 top-0 h-[58px] bg-[radial-gradient(circle_at_10%_50%,rgba(255,255,255,0.7),transparent_8%),radial-gradient(circle_at_36%_50%,rgba(255,255,255,0.7),transparent_8%),radial-gradient(circle_at_62%_50%,rgba(255,255,255,0.7),transparent_8%),rgba(32,32,32,0.3)]" />
                <div className="absolute inset-x-[18px] bottom-[18px] top-[74px] rounded-[20px] bg-[radial-gradient(circle_at_50%_34%,rgba(255,255,255,0.96),rgba(255,255,255,0.18)_20%,transparent_22%),linear-gradient(180deg,#7b7b7b_0%,#c7c7c7_54%,#737373_100%)]" />
                <div className="absolute bottom-[-8px] right-[-8px] flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#eef5e3] bg-[#2f8335] text-white shadow-[0_10px_18px_rgba(35,94,39,0.2)]">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[500px] rounded-[34px] border border-white/70 bg-white/92 px-6 py-7 shadow-[0_28px_80px_rgba(100,116,68,0.16)] backdrop-blur md:px-8 md:py-8">
            <div className="text-center">
              <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-[#1f242d] md:text-[2.4rem]">Welcome back</h2>
              <p className="mt-2 text-[0.96rem] text-[#67707e]">Sign in to your professional workspace</p>
            </div>

            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-[13px] font-bold uppercase tracking-[0.08em] text-[#434a57]">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c8591]" />
                  <input
                    id="email"
                    type="email"
                    required
                    className="h-[58px] w-full rounded-[14px] border border-[#d2d8cb] bg-white pl-12 pr-4 text-[1rem] text-[#1f242d] outline-none transition-all placeholder:text-[#9aa2ad] focus:border-[#2f8632] focus:shadow-[0_0_0_4px_rgba(51,140,49,0.12)]"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="block text-[13px] font-bold uppercase tracking-[0.08em] text-[#434a57]">
                    Password
                  </label>
                  <Link href="#" className="text-[13px] font-semibold text-[#3a7f32] transition-colors hover:text-[#215820]">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c8591]" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="h-[58px] w-full rounded-[14px] border border-[#d2d8cb] bg-white pl-12 pr-12 text-[1rem] text-[#1f242d] outline-none transition-all placeholder:text-[#9aa2ad] focus:border-[#2f8632] focus:shadow-[0_0_0_4px_rgba(51,140,49,0.12)]"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#6d7581] transition-colors hover:bg-[#f0f3eb] hover:text-[#27303b]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-3 text-[14px] text-[#5f6976]">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="h-4 w-4 rounded-[4px] border-[#c8d0bf] text-[#16781f] focus:ring-[#16781f]"
                />
                Keep me signed in for 30 days
              </label>

              {error ? <div className="rounded-[16px] border border-[#f2c6c2] bg-[#fff2f0] px-4 py-3 text-sm text-[#bf4b42]">{error}</div> : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-[60px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#066c12] px-6 text-[1.05rem] font-semibold text-white shadow-[0_14px_26px_rgba(6,108,18,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#045b0e] disabled:translate-y-0 disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In to Dashboard"}
                {!loading ? <ArrowRight className="h-4.5 w-4.5" /> : null}
              </button>
            </form>

            <div className="mt-8 space-y-6">
              <DividerLabel label="Or Continue With" />
              <div className="grid gap-3 sm:grid-cols-2">
                <SocialButton icon={Mail} label="Google" />
                <SocialButton icon={BriefcaseBusiness} label="SSO" />
              </div>
            </div>

            <p className="mt-8 text-center text-[15px] text-[#606a77]">
              New to the ecosystem?{" "}
              <Link href="/register" className="font-semibold text-[#2d7a2f] transition-colors hover:text-[#1f5821]">
                Create an account
              </Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

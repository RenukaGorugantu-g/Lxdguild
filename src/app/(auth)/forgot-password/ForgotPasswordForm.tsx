"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const CANONICAL_AUTH_REDIRECT_BASE =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://lxdmarketplace.lxdguild.com";

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState(searchParams.get("email")?.trim() || "");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = useMemo(
    () => `${CANONICAL_AUTH_REDIRECT_BASE.replace(/\/$/, "")}/auth/confirm?next=${encodeURIComponent("/reset-password")}`,
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (resetError) {
      setError(resetError.message || "We couldn't send the reset email just now.");
      setLoading(false);
      return;
    }

    setStatus("Password reset email sent. Check your inbox and spam folder for the reset link.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faef_0%,#eef6e4_100%)] text-[#202733]">
      <main className="mx-auto flex min-h-screen w-full max-w-[760px] items-center px-5 py-16 md:px-8">
        <div className="w-full rounded-[34px] border border-white/80 bg-white/92 p-6 shadow-[0_28px_70px_rgba(86,106,58,0.14)] md:p-10">
          <div className="max-w-[520px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#66715d]">Password recovery</p>
            <h1 className="mt-4 text-[2.2rem] font-semibold tracking-[-0.05em] text-[#20252f]">Reset your password</h1>
            <p className="mt-4 text-[1rem] leading-8 text-[#5f6876]">
              Enter the email tied to your account and we&apos;ll send you a secure link to set a new password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 max-w-[520px] space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-[13px] font-bold uppercase tracking-[0.08em] text-[#434a57]">
                Email
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
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            {error ? <div className="rounded-[16px] border border-[#f2c6c2] bg-[#fff2f0] px-4 py-3 text-sm text-[#bf4b42]">{error}</div> : null}
            {status ? <div className="rounded-[16px] border border-[#dbe4d1] bg-[#f8fbf4] px-4 py-3 text-sm text-[#44514e]">{status}</div> : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-[60px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#066c12] px-6 text-[1.05rem] font-semibold text-white shadow-[0_14px_26px_rgba(6,108,18,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#045b0e] disabled:translate-y-0 disabled:opacity-60"
            >
              {loading ? "Sending reset link..." : "Send password reset email"}
              {!loading ? <ArrowRight className="h-4.5 w-4.5" /> : null}
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={email ? `/login?email=${encodeURIComponent(email)}` : "/login"}
              className="inline-flex h-[54px] items-center justify-center gap-2 rounded-[14px] border border-[#d7e2cf] bg-white px-6 text-[0.98rem] font-semibold text-[#25303a] transition-colors hover:bg-[#f3f7ef]"
            >
              Back to sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-[54px] items-center justify-center rounded-[14px] px-6 text-[0.98rem] font-semibold text-[#2f6d2d] transition-colors hover:text-[#194e17]"
            >
              Create a different account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

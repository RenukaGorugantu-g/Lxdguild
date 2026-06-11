"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArrowRight, MailCheck, RefreshCw } from "lucide-react";

const CANONICAL_AUTH_REDIRECT_BASE =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://lxdmarketplace.lxdguild.com";

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() || "";
  const role = searchParams.get("role")?.trim() || "candidate_onhold";
  const [supabase] = useState(() => createClient());
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const verificationNextPath =
    role === "employer_free" ? "/dashboard/employer?verified=1" : "/dashboard/candidate/welcome?verified=1";
  const emailRedirectTo = useMemo(
    () => `${CANONICAL_AUTH_REDIRECT_BASE.replace(/\/$/, "")}/auth/confirm?next=${encodeURIComponent(verificationNextPath)}`,
    [verificationNextPath]
  );

  const handleResend = async () => {
    if (!email) {
      setResendStatus("Add the same email address you used to register, then try again.");
      return;
    }

    setResending(true);
    setResendStatus(null);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      setResendStatus(error.message || "We couldn't resend the verification email just now.");
      setResending(false);
      return;
    }

    setResendStatus("A fresh verification email is on its way.");
    setResending(false);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faef_0%,#eef6e4_100%)] text-[#202733]">
      <main className="mx-auto flex min-h-screen w-full max-w-[1280px] items-center px-5 py-16 md:px-8">
        <div className="mx-auto grid w-full max-w-[980px] gap-6 rounded-[34px] border border-white/80 bg-white/92 p-6 shadow-[0_28px_70px_rgba(86,106,58,0.14)] md:grid-cols-[0.9fr_1.1fr] md:p-10">
          <section className="rounded-[28px] bg-[radial-gradient(circle_at_top_right,rgba(188,247,191,0.18),transparent_30%),linear-gradient(180deg,#0d7d17_0%,#0a6514_100%)] px-6 py-8 text-white shadow-[0_20px_40px_rgba(6,108,18,0.18)]">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12">
              <MailCheck className="h-7 w-7 text-[#bcf7bf]" />
            </div>
            <p className="mt-8 text-[12px] font-semibold uppercase tracking-[0.24em] text-[#b9f2bc]">One last step</p>
            <h1 className="mt-4 text-[2.4rem] font-semibold tracking-[-0.05em]">Check your inbox</h1>
            <p className="mt-5 text-[1rem] leading-8 text-[#d5f5d6]">
              Your account is ready. Open the email, tap the verify button, and we&apos;ll take you straight to your dashboard with your first matched roles waiting.
            </p>
            <div className="mt-8 rounded-[22px] border border-white/15 bg-white/10 px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b9f2bc]">Email used</p>
              <p className="mt-2 break-all text-lg font-semibold text-white">{email || "Use the email you registered with."}</p>
            </div>
            <div className="mt-6 rounded-[22px] border border-white/15 bg-[#081d0d]/30 px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b9f2bc]">Quick checklist</p>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-[#d5f5d6]">
                <li>Open the verification email in the same inbox shown here.</li>
                <li>Tap the button to unlock your matched jobs.</li>
                <li>Check spam, promotions, or updates if the first message is missing.</li>
              </ul>
            </div>
          </section>

          <section className="flex flex-col justify-center px-2 py-2 md:px-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#66715d]">Email verification</p>
            <h2 className="mt-4 text-[2.2rem] font-semibold tracking-[-0.05em] text-[#20252f]">
              Open the message and tap the verify button
            </h2>
            <p className="mt-4 max-w-[520px] text-[1rem] leading-8 text-[#5f6876]">
              We sent the verification link to <span className="font-semibold text-[#2a3039]">{email || "your inbox"}</span>. Once you verify, you&apos;ll skip the homepage and land directly on your dashboard with your first 5 matched jobs.
            </p>

            <div className="mt-8 space-y-4 rounded-[26px] border border-[#dbe4d1] bg-[#f8fbf4] p-6">
              <div>
                <p className="text-sm font-semibold text-[#1f2937]">Need another copy?</p>
                <p className="mt-1 text-sm leading-7 text-[#64706b]">
                  Tap resend and we&apos;ll send a fresh verification email to the same address.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex h-[58px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#066c12] px-6 text-[1rem] font-semibold text-white shadow-[0_14px_26px_rgba(6,108,18,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#045b0e] disabled:translate-y-0 disabled:opacity-60"
              >
                {resending ? "Resending..." : "Resend email"}
                {!resending ? <RefreshCw className="h-4.5 w-4.5" /> : null}
              </button>
              {resendStatus ? <div className="rounded-[16px] border border-[#dbe4d1] bg-white px-4 py-3 text-sm text-[#44514e]">{resendStatus}</div> : null}
            </div>

            <div className="mt-6 rounded-[22px] border border-[#f0d9a7] bg-[#fff8ea] px-5 py-4 text-sm leading-7 text-[#7a5b1c]">
              Check your spam folder, promotions tab, or updates folder too. Some inboxes file the first verification email there.
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-[54px] items-center justify-center gap-2 rounded-[14px] border border-[#d7e2cf] bg-white px-6 text-[0.98rem] font-semibold text-[#25303a] transition-colors hover:bg-[#f3f7ef]"
              >
                I already verified
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
              <Link
                href="/jobs"
                className="inline-flex h-[54px] items-center justify-center rounded-[14px] px-6 text-[0.98rem] font-semibold text-[#2f6d2d] transition-colors hover:text-[#194e17]"
              >
                Preview the job board while you wait
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

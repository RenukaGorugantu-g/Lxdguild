import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Smartphone } from "lucide-react";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Email Verified",
  "Your email is verified. Continue into LXD Guild or log in on this device to keep going."
);

type VerifiedSearchParams = {
  signed_in?: string;
  next?: string;
  email?: string;
};

function safeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/")) return "/dashboard";
  return value;
}

export default async function EmailVerifiedPage({
  searchParams,
}: {
  searchParams: Promise<VerifiedSearchParams>;
}) {
  const params = await searchParams;
  const signedIn = params.signed_in === "1";
  const nextPath = safeNextPath(params.next);
  const email = params.email?.trim() || "";
  const loginHref = email
    ? `/login?verified=1&email=${encodeURIComponent(email)}`
    : "/login?verified=1";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faef_0%,#eef6e4_100%)] text-[#202733]">
      <main className="mx-auto flex min-h-screen w-full max-w-[920px] items-center px-5 py-16 md:px-8">
        <div className="w-full rounded-[34px] border border-white/80 bg-white/92 p-6 shadow-[0_28px_70px_rgba(86,106,58,0.14)] md:p-10">
          <div className="grid gap-6 md:grid-cols-[0.88fr_1.12fr]">
            <section className="rounded-[28px] bg-[radial-gradient(circle_at_top_right,rgba(188,247,191,0.2),transparent_30%),linear-gradient(180deg,#0d7d17_0%,#0a6514_100%)] px-6 py-8 text-white shadow-[0_20px_40px_rgba(6,108,18,0.18)]">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/12">
                <CheckCircle2 className="h-7 w-7 text-[#bcf7bf]" />
              </div>
              <p className="mt-8 text-[12px] font-semibold uppercase tracking-[0.24em] text-[#b9f2bc]">Email confirmed</p>
              <h1 className="mt-4 text-[2.4rem] font-semibold tracking-[-0.05em]">You&apos;re verified</h1>
              <p className="mt-5 text-[1rem] leading-8 text-[#d5f5d6]">
                Your email has been verified successfully. We&apos;ll now help you continue on this device without leaving you guessing.
              </p>
              {email ? (
                <div className="mt-8 rounded-[22px] border border-white/15 bg-white/10 px-5 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b9f2bc]">Verified email</p>
                  <p className="mt-2 break-all text-lg font-semibold text-white">{email}</p>
                </div>
              ) : null}
            </section>

            <section className="flex flex-col justify-center px-2 py-2 md:px-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#66715d]">What happens next</p>
              <h2 className="mt-4 text-[2.1rem] font-semibold tracking-[-0.05em] text-[#20252f]">
                {signedIn ? "Continue straight into your account" : "Log in on this device to continue"}
              </h2>
              <p className="mt-4 max-w-[520px] text-[1rem] leading-8 text-[#5f6876]">
                {signedIn
                  ? "This device already has an active session from the verification link, so you can continue without entering your password again."
                  : "If you verified from another device or your session did not carry over, that is okay. Your email is confirmed. Log in once on this device and continue from there."}
              </p>

              <div className="mt-8 space-y-4 rounded-[26px] border border-[#dbe4d1] bg-[#f8fbf4] p-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#138d1a] shadow-[0_10px_18px_rgba(15,23,42,0.06)]">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1f2937]">Verified on mobile or another device?</p>
                    <p className="mt-1 text-sm leading-7 text-[#64706b]">
                      Verification confirms the email address. If you started on desktop and opened the email on mobile, you may still need to log in on the device where you want to continue working.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {signedIn ? (
                  <Link
                    href={nextPath}
                    className="inline-flex h-[54px] items-center justify-center gap-2 rounded-[14px] bg-[#066c12] px-6 text-[0.98rem] font-semibold text-white shadow-[0_14px_26px_rgba(6,108,18,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#045b0e]"
                  >
                    Continue to dashboard
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Link>
                ) : (
                  <Link
                    href={loginHref}
                    className="inline-flex h-[54px] items-center justify-center gap-2 rounded-[14px] bg-[#066c12] px-6 text-[0.98rem] font-semibold text-white shadow-[0_14px_26px_rgba(6,108,18,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#045b0e]"
                  >
                    Log in to continue
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Link>
                )}
                <Link
                  href={email ? `/forgot-password?email=${encodeURIComponent(email)}` : "/forgot-password"}
                  className="inline-flex h-[54px] items-center justify-center rounded-[14px] border border-[#d7e2cf] bg-white px-6 text-[0.98rem] font-semibold text-[#25303a] transition-colors hover:bg-[#f3f7ef]"
                >
                  Forgot password
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

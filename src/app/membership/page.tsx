import Link from "next/link";
import { ArrowRight, CheckCircle, Crown, Sparkles, Star } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getBaseRole } from "@/lib/profile-role";

export default async function PublicMembershipPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let baseRole: "candidate" | "employer" | "admin" | "visitor" = "visitor";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    baseRole = getBaseRole(profile);
  }

  const sharedPrimaryHref =
    baseRole === "candidate"
      ? "/dashboard/membership"
      : baseRole === "employer"
        ? "/dashboard/membership"
        : "/register";
  const sharedPrimaryLabel =
    baseRole === "candidate"
      ? "Open Candidate Membership"
      : baseRole === "employer"
        ? "Open Employer Membership"
        : "Join Guild";

  const benefits = [
    "Access premium templates, guides, and practical resources",
    "Keep your candidate or employer role while adding member benefits",
    "Unlock a more complete toolkit for one full year",
    "Return and renew only when you need continued access",
  ];

  const audiences = [
    {
      title: "For candidates",
      copy: "Use premium resources to strengthen applications, portfolios, and readiness while still applying for jobs as a candidate.",
      href: "/candidate",
    },
    {
      title: "For employers",
      copy: "Add resource access for hiring support, team capability-building, and a more complete L&D workflow.",
      href: "/employer",
    },
  ];

  return (
    <div className="premium-shell">
      <main className="premium-content px-6 pb-24 pt-28">
        <div className="premium-container space-y-8">
          <section className="premium-hero px-7 py-10 sm:px-10 sm:py-14">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <div className="premium-badge">
                  <Sparkles className="h-3.5 w-3.5 text-[#34cd2f]" />
                  Membership benefits
                </div>
                <h1 className="premium-title mt-6 text-5xl sm:text-6xl">
                  Add premium resource access without changing who you are in the platform.
                </h1>
                <p className="premium-copy mt-5 max-w-2xl text-lg leading-8">
                  Membership is an add-on layer for candidates and employers. It does not replace your core role. It simply
                  unlocks the full resource library and a more valuable ongoing experience.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link href={sharedPrimaryHref} className="premium-button premium-button-primary">
                    {sharedPrimaryLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/dashboard/membership" className="premium-button premium-button-secondary">
                    Open Checkout
                  </Link>
                </div>
              </div>

              <div className="premium-card-light p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">Why it matters</p>
                    <p className="text-xl font-bold text-zinc-950">Premium support for the whole workflow</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {benefits.map((benefit) => (
                    <div key={benefit} className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-medium text-zinc-700">
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            {audiences.map((audience) => (
              <article key={audience.title} className="premium-glass-section p-8">
                <div className="premium-badge">
                  <Star className="h-3.5 w-3.5 text-[#5fd5ff]" />
                  {audience.title}
                </div>
                <h2 className="mt-5 text-3xl font-bold text-white">{audience.title}</h2>
                <p className="premium-copy mt-4 text-sm leading-7">{audience.copy}</p>
                <Link href={audience.href} className="premium-button premium-button-secondary mt-8">
                  Learn More
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </section>

          <section className="premium-card-light p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Simple model</p>
            <h2 className="mt-4 text-3xl font-bold text-zinc-950">Role first. Membership on top.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600">
              If you are candidate_mvp, you stay a candidate and can still apply for jobs. If you are an employer, you stay
              an employer. Membership adds premium resources and tools alongside that core role instead of replacing it.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

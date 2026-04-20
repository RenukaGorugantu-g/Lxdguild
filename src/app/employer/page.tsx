import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getBaseRole } from "@/lib/profile-role";

export default async function EmployerLandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let baseRole: "candidate" | "employer" | "admin" | "visitor" = "visitor";
  let profileName: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role, name").eq("id", user.id).single();
    baseRole = getBaseRole(profile);
    profileName = profile?.name ?? null;
  }

  const isSignedInEmployer = baseRole === "employer";
  const primaryHref = isSignedInEmployer ? "/dashboard/employer" : "/register?role=employer";
  const primaryLabel = isSignedInEmployer ? "Open Employer Dashboard" : "Join as Employer";
  const secondaryHref = isSignedInEmployer ? "/dashboard/employer/post-job" : "/membership";
  const secondaryLabel = isSignedInEmployer ? "Continue Hiring Flow" : "Explore Membership";

  const pillars = [
    {
      icon: ShieldCheck,
      title: "Higher-trust hiring",
      copy: "Discover candidates who have already gone through a skills-first validation layer.",
    },
    {
      icon: Search,
      title: "Cleaner discovery",
      copy: "Browse a more focused talent pool instead of spending time sorting weak-fit applications.",
    },
    {
      icon: BriefcaseBusiness,
      title: "Integrated workflow",
      copy: "Post roles, review talent, and add premium resources access for your team when needed.",
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
                  {isSignedInEmployer ? "Employer home" : "For employers"}
                </div>
                <h1 className="premium-title mt-6 text-5xl sm:text-6xl">
                  {isSignedInEmployer
                    ? `Welcome back${profileName ? `, ${profileName}` : ""}. Your employer home is ready.`
                    : "Hire L&D talent through a more premium, skill-first workflow."}
                </h1>
                <p className="premium-copy mt-5 max-w-2xl text-lg leading-8">
                  {isSignedInEmployer
                    ? "Return to hiring with a clearer path into role posting, candidate discovery, membership benefits, and employer-focused actions."
                    : "LXD Guild gives employers a cleaner hiring experience with pre-vetted candidate visibility, role posting, and a more polished path from discovery to decision."}
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link href={primaryHref} className="premium-button premium-button-primary">
                    {primaryLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href={secondaryHref} className="premium-button premium-button-secondary">
                    {secondaryLabel}
                  </Link>
                </div>
              </div>

              <div className="grid gap-4">
                {(isSignedInEmployer
                  ? [
                      ["Hiring home", "Pick up quickly with the most relevant employer actions."],
                      ["Role posting", "Get back into publishing roles and managing demand."],
                      ["Membership value", "Keep premium resources visible as shared value for employers too."],
                    ]
                  : [
                      ["Verified pipeline", "See candidates with stronger evidence of readiness."],
                      ["Faster review", "Reduce noise and spend more time on quality matches."],
                      ["Employer growth", "Upgrade plans and membership when you want broader access."],
                    ]).map(([title, copy]) => (
                  <div key={title} className="premium-metric">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="premium-copy mt-2 text-sm leading-6">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            {pillars.map((item) => (
              <article key={item.title} className="premium-card-light p-7">
                <div className="glass-panel mb-6 flex h-14 w-14 items-center justify-center rounded-2xl">
                  <item.icon className="h-7 w-7 text-[#34cd2f]" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-950">{item.title}</h2>
                <p className="premium-light-copy mt-3 text-sm leading-7">{item.copy}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="premium-glass-section p-8">
              <div className="premium-badge">
                <Users className="h-3.5 w-3.5 text-[#5fd5ff]" />
                Employer flow
              </div>
              <div className="mt-6 space-y-4">
                {[
                  isSignedInEmployer
                    ? "This page now works as your signed-in employer home."
                    : "Landing page frames the hiring workflow clearly.",
                  isSignedInEmployer
                    ? "Jump directly into role posting, review, and next hiring actions."
                    : "Registration moves into employer hub and role posting.",
                  "Membership stays available to both employers and candidates as an added premium layer.",
                ].map((point) => (
                  <div key={point} className="premium-metric text-white">
                    {point}
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-card-light p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Plan clarity</p>
              <h2 className="mt-4 text-3xl font-bold text-zinc-950">Employer plans and membership can work together.</h2>
              <p className="mt-4 text-sm leading-7 text-zinc-600">
                {isSignedInEmployer
                  ? "Your employer role still drives hiring workflow. Membership adds premium tools and resources on top, so the product supports both recruiting and capability-building."
                  : "Your employer role handles hiring workflow. Membership adds premium tools and resources on top, so the product can support both recruiting and team capability-building."}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={primaryHref} className="premium-button premium-button-dark">
                  {primaryLabel}
                </Link>
                <Link href="/membership" className="premium-button border border-zinc-200 bg-white text-zinc-800">
                  Explore Membership
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

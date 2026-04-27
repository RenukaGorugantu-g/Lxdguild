import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Search, ShieldCheck, Sparkles } from "lucide-react";
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
  const secondaryHref = isSignedInEmployer ? "/dashboard/employer/post-job" : "/membership";

  const features = [
    {
      title: "Exclusive MVP Talent Pool",
      copy: "Browse a curated collection of high-performing candidates verified for excellence and cultural fit.",
    },
    {
      title: "Direct Candidate Management",
      copy: "Streamlined accept or reject flows that keep your pipeline moving without unnecessary friction.",
    },
    {
      title: "Data-Driven Insights",
      copy: "Make hiring decisions based on hard metrics, market benchmarks, and talent availability.",
    },
  ];

  return (
    <div className="marketing-page">
      <main className="pt-32">
        <section className="marketing-section pb-16">
          <div className="marketing-container">
            <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-6">
                <div className="marketing-kicker">
                  <Sparkles className="h-3.5 w-3.5" />
                  {isSignedInEmployer ? "Employer Home" : "Recruitment 2.0"}
                </div>
                <h1 className="marketing-title max-w-xl text-4xl sm:text-5xl">
                  {isSignedInEmployer
                    ? `Welcome back${profileName ? `, ${profileName}` : ""}. Hire with calmer precision.`
                    : "Hire verified MVP talent, instantly."}
                </h1>
                <p className="marketing-copy max-w-xl text-base leading-8">
                  {isSignedInEmployer
                    ? "Return to your hiring home for role posting, candidate review, and fast action across the employer workflow."
                    : "Access an exclusive pool of high-impact candidates and manage your entire hiring pipeline with fluid simplicity."}
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link href={primaryHref} className="marketing-primary">
                    {isSignedInEmployer ? "Open Employer Dashboard" : "Post a Job"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href={secondaryHref} className="marketing-secondary">
                    {isSignedInEmployer ? "Continue Hiring Flow" : "Explore MVP Pool"}
                  </Link>
                </div>
              </div>

              <div className="marketing-panel p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="marketing-soft-card p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">MVP Candidates</p>
                    <p className="mt-3 text-4xl font-bold text-[#17a21c]">1,284</p>
                    <div className="mt-3 h-1.5 rounded-full bg-[#e2ecd8]"><div className="h-1.5 w-[84%] rounded-full bg-[#23b61f]" /></div>
                  </div>
                  <div className="marketing-soft-card p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Time to Hire</p>
                    <p className="mt-3 text-4xl font-bold text-[#111827]">12 Days</p>
                    <p className="mt-4 text-xs text-[#1da326]">98.1% engagement</p>
                  </div>
                </div>
                <div className="marketing-soft-card mt-4 p-4">
                  <p className="text-sm font-semibold text-[#111827]">Direct Management Flow</p>
                  <div className="mt-5 grid grid-cols-5 gap-3">
                    {[34, 52, 28, 68, 46].map((height, index) => (
                      <div key={index} className="rounded-t-xl bg-[#dff5d8]" style={{ height: `${height + 20}px` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-14">
          <div className="marketing-container grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => {
              const icons = [ShieldCheck, Search, BriefcaseBusiness];
              const Icon = icons[index];
              return (
                <article key={feature.title} className="marketing-grid-card p-7">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${index === 0 ? "bg-[#e9fde2] text-[#15911b]" : index === 1 ? "bg-[#f3f4ff] text-[#7281d0]" : "bg-[#ffe9ee] text-[#cc5c82]"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#111827]">{feature.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#5b6757]">{feature.copy}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="marketing-section pb-16">
          <div className="marketing-container">
            <div className="mb-8 text-center">
              <h2 className="marketing-title text-3xl">Experience the fluid flow</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <article className="marketing-grid-card p-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6d7d68]">Everything you need to scale</p>
                <h3 className="mt-4 text-3xl font-bold text-[#111827]">A focused employer workflow from shortlist to decision.</h3>
                <p className="mt-4 text-sm leading-7 text-[#5b6757]">
                  Direct candidate management, recruiter collaboration, analytics, and verified pool visibility work together
                  in one more intentional employer flow.
                </p>
              </article>
              <article className="marketing-grid-card grid gap-6 p-8 lg:grid-cols-[1fr_0.8fr]">
                <div>
                  <div className="inline-flex rounded-full bg-[#ebf7e3] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#138d1a]">
                    Enterprise Ready
                  </div>
                  <h3 className="mt-5 text-3xl font-bold text-[#111827]">CareerEco for Enterprise</h3>
                  <p className="mt-4 text-sm leading-7 text-[#5b6757]">
                    Custom solutions designed for high-volume hiring, complex organizational structures, and global compliance.
                  </p>
                  <div className="mt-6 space-y-2 text-sm text-[#334155]">
                    <p>● Unlimited Job Postings</p>
                    <p>● Dedicated Account Manager</p>
                    <p>● API & SSO Integration</p>
                  </div>
                </div>
                <div className="marketing-panel p-6 text-center">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#6d7d68]">Starting From</p>
                  <p className="mt-4 text-5xl font-bold text-[#111827]">$999<span className="text-lg font-medium text-[#6b7280]">/mo</span></p>
                  <button className="marketing-primary mt-6 w-full">Get Started</button>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-20">
          <div className="marketing-container rounded-[2.25rem] bg-[radial-gradient(circle_at_top,rgba(137,222,119,0.18),transparent_40%),rgba(255,255,255,0.56)] px-8 py-14 text-center">
            <h2 className="marketing-title text-4xl">Ready to hire your next MVP?</h2>
            <p className="marketing-copy mx-auto mt-4 max-w-2xl text-sm">
              Join thousands of companies building the next generation of high-impact teams with LXD Guild.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={primaryHref} className="marketing-primary">
                {isSignedInEmployer ? "Open Hiring Hub" : "Start Hiring Now"}
              </Link>
              <Link href="/membership" className="marketing-secondary">Talk to an Expert</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

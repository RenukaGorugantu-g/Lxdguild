import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Crown, ShieldCheck, Sparkles, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getBaseRole } from "@/lib/profile-role";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const baseRole = getBaseRole(profile);

    if (baseRole === "candidate") {
      redirect("/candidate");
    }

    if (baseRole === "employer") {
      redirect("/employer");
    }

    if (baseRole === "admin") {
      redirect("/dashboard");
    }
  }

  const roleCards = [
    {
      icon: ShieldCheck,
      title: "Candidates",
      copy: "Validate your skill, build trust faster, unlock job access, and use premium resources without losing your candidate role.",
      href: "/candidate",
      cta: "Explore Candidate Path",
    },
    {
      icon: BriefcaseBusiness,
      title: "Employers",
      copy: "Post roles, discover more qualified L&D talent, and manage hiring through a more focused premium workflow.",
      href: "/employer",
      cta: "Explore Employer Path",
    },
    {
      icon: Crown,
      title: "Membership",
      copy: "Add premium benefits on top of candidate or employer access with templates, guides, tools, and stronger support.",
      href: "/membership",
      cta: "Explore Membership",
    },
  ];

  return (
    <div className="premium-shell">
      <main className="premium-content pt-28">
        <section className="px-6 py-14 sm:py-20">
          <div className="premium-container">
            <div className="premium-hero px-7 py-10 sm:px-10 sm:py-14">
              <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div>
                  <div className="premium-badge">
                    <Sparkles className="h-3.5 w-3.5 text-[#34cd2f]" />
                    Skill-first talent marketplace
                  </div>
                  <h1 className="premium-title mt-6 text-5xl sm:text-7xl">
                    One premium platform for <span className="gradient-text">candidates</span>,{" "}
                    <span className="gradient-text">employers</span>, and <span className="gradient-text">members</span>.
                  </h1>
                  <p className="premium-copy mt-6 max-w-2xl text-lg leading-8">
                    LXD Guild gives each audience a clearer home: candidates prove readiness, employers hire with more
                    trust, and membership adds premium value on top of both journeys.
                  </p>
                  <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                    <Link href="/candidate" className="premium-button premium-button-primary">
                      I&apos;m a Candidate
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/employer" className="premium-button premium-button-secondary">
                      I&apos;m an Employer
                    </Link>
                    <Link href="/membership" className="premium-button premium-button-secondary">
                      Membership Benefits
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="premium-metric sm:col-span-2">
                    <p className="premium-kicker">How the flow works</p>
                    <p className="mt-3 text-2xl font-bold text-white">Logged-out users see the full marketplace story. Logged-in users go straight to their role home.</p>
                    <p className="premium-copy mt-2 text-sm leading-6">
                      That keeps the public experience clear while making the signed-in experience faster and more relevant.
                    </p>
                  </div>
                  {[
                    ["Candidate home", "Assessment, profile growth, job readiness, and premium resource support."],
                    ["Employer home", "Hiring workflow, talent discovery, plan clarity, and team support."],
                    ["Membership layer", "Shared premium value for both candidates and employers."],
                    ["Better UX", "One public landing page, separate role homes after login."],
                  ].map(([title, copy]) => (
                    <div key={title} className="premium-metric">
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="premium-copy mt-2 text-sm leading-6">{copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="premium-container">
            <div className="grid gap-6 lg:grid-cols-3">
              {roleCards.map((item) => (
                <article key={item.title} className="premium-card-light p-8">
                  <div className="glass-panel mb-6 flex h-14 w-14 items-center justify-center rounded-2xl">
                    <item.icon className="h-7 w-7 text-[#34cd2f]" />
                  </div>
                  <p className="premium-light-kicker">{item.title}</p>
                  <h2 className="mt-4 text-3xl font-bold text-zinc-950">{item.title}</h2>
                  <p className="premium-light-copy mt-4 text-sm leading-7">{item.copy}</p>
                  <Link href={item.href} className="premium-button premium-button-dark mt-8">
                    {item.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="premium-container">
            <div className="premium-glass-section p-8 sm:p-10">
              <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                <div>
                  <div className="premium-badge">
                    <Users className="h-3.5 w-3.5 text-[#5fd5ff]" />
                    Shared platform benefit
                  </div>
                  <h2 className="mt-5 text-4xl font-bold text-white">Different homes, one connected product.</h2>
                  <p className="premium-copy mt-4 max-w-2xl text-sm leading-7">
                    The public landing page explains the whole value proposition. After login, each audience gets a home
                    page that fits their role, while membership stays visible to both as a premium add-on.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    ["Candidates", "Validate and grow"],
                    ["Employers", "Hire with confidence"],
                    ["Members", "Unlock premium support"],
                  ].map(([title, copy]) => (
                    <div key={title} className="premium-metric">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#80ef7a]">{title}</p>
                      <p className="mt-2 text-sm font-semibold text-white">{copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

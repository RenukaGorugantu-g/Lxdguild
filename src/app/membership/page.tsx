import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle,
  Crown,
  FileText,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export default async function PublicMembershipPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryHref = user ? "/dashboard/membership" : "/register";
  const benefits = [
    {
      title: "Premium resource access",
      copy: "Templates, guides, and practical assets for deeper career and hiring execution.",
      icon: FileText,
      accent: "bg-[#e9fde2] text-[#15911b]",
    },
    {
      title: "Role-safe upgrade",
      copy: "Membership sits on top of candidate or employer identity without replacing the core workflow.",
      icon: Crown,
      accent: "bg-[#f3f4ff] text-[#7281d0]",
    },
    {
      title: "Longer-term support",
      copy: "Use the platform with more continuity, richer preparation, and stronger access across the year.",
      icon: Star,
      accent: "bg-[#ffe9ee] text-[#cc5c82]",
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
                  Premium Membership
                </div>
                <h1 className="marketing-title max-w-xl text-4xl sm:text-5xl">
                  Add premium support without changing your core role.
                </h1>
                <p className="marketing-copy max-w-xl text-base leading-8">
                  Membership is a premium layer for both candidates and employers. Keep your main role intact while unlocking
                  more resources, stronger guidance, and a fuller long-term workflow.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link href={primaryHref} className="marketing-primary">
                    {user ? "Open Membership" : "Join Guild"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/candidate" className="marketing-secondary">
                    See Candidate Flow
                  </Link>
                </div>
              </div>

              <div className="marketing-panel p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="marketing-soft-card p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Member Access</p>
                    <p className="mt-3 text-4xl font-bold text-[#17a21c]">12 Months</p>
                    <div className="mt-3 h-1.5 rounded-full bg-[#e2ecd8]">
                      <div className="h-1.5 w-[88%] rounded-full bg-[#23b61f]" />
                    </div>
                  </div>
                  <div className="marketing-soft-card p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Best For</p>
                    <p className="mt-3 text-4xl font-bold text-[#111827]">Both Roles</p>
                    <p className="mt-4 text-xs text-[#1da326]">Candidate and employer safe</p>
                  </div>
                </div>
                <div className="marketing-soft-card mt-4 p-4">
                  <p className="text-sm font-semibold text-[#111827]">Membership Value Flow</p>
                  <div className="mt-5 grid grid-cols-4 gap-3">
                    {[
                      { label: "Access", height: 34 },
                      { label: "Resources", height: 48 },
                      { label: "Support", height: 62 },
                      { label: "Growth", height: 56 },
                    ].map((step, index) => (
                      <div key={step.label} className="space-y-2">
                        <div
                          className={`${index === 2 ? "bg-[#35d421]" : "bg-[#dff5d8]"} rounded-t-xl`}
                          style={{ height: `${step.height}px` }}
                        />
                        <p className="text-[11px] font-semibold text-[#62705f]">{step.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-14">
          <div className="marketing-container grid gap-6 md:grid-cols-3">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="marketing-grid-card p-7">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${benefit.accent}`}>
                  <benefit.icon className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#111827]">{benefit.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#5b6757]">{benefit.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-section pb-16">
          <div className="marketing-container">
            <div className="mb-8 text-center">
              <h2 className="marketing-title text-3xl">Experience the fluid flow</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <article className="marketing-grid-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eafde2] text-[#15911b]">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#111827]">For Candidates</p>
                    <p className="text-xs text-[#5b6757]">Readiness and profile support</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-[#5b6757]">
                  <p>Premium templates and prep support around assessment and profile growth.</p>
                  <p>Course suggestion context and stronger career resources.</p>
                </div>
              </article>
              <article className="marketing-grid-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3f4ff] text-[#7281d0]">
                    <BriefcaseBusiness className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#111827]">For Employers</p>
                    <p className="text-xs text-[#5b6757]">Hiring and capability support</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-[#5b6757]">
                  <p>Access better hiring resources and structured support around recruiting operations.</p>
                  <p>Keep employer workflows intact while adding premium depth.</p>
                </div>
              </article>
              <article className="marketing-grid-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-semibold text-[#111827]">Premium Benefits</p>
                  <BookOpen className="h-4 w-4 text-[#cc5c82]" />
                </div>
                <div className="space-y-3 text-sm text-[#5b6757]">
                  <p>One membership layer across the full platform.</p>
                  <p>Designed to expand value, not complicate your core journey.</p>
                  <p>Renew only when you need continued access.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-16">
          <div className="marketing-container">
            <div className="mb-8">
              <h2 className="marketing-title text-3xl">Everything you need to extend the journey</h2>
              <p className="marketing-copy mt-3 max-w-2xl text-sm">
                Membership gives the platform more depth for people who want richer resources, stronger support, and a
                fuller long-term experience.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <article className="marketing-grid-card p-8">
                <h3 className="text-3xl font-bold text-[#111827]">Role first, membership second</h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5b6757]">
                  Candidate and employer identities stay intact. Membership simply adds premium resources, stronger support,
                  and longer-term value on top of the same platform experience.
                </p>
                <div className="mt-8 space-y-3 text-sm text-[#334155]">
                  <p className="inline-flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Access premium templates, guides, and resource packs
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Support both candidate and employer journeys
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Keep the same main role while adding benefits
                  </p>
                </div>
              </article>
              <article className="marketing-grid-card p-8">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#6d7d68]">Membership Access</p>
                <p className="mt-4 text-5xl font-bold text-[#111827]">$999<span className="text-lg font-medium text-[#6b7280]">/year</span></p>
                <p className="mt-4 text-sm leading-7 text-[#5b6757]">
                  A simple premium layer designed for people who want more depth around learning, hiring, and long-term
                  growth in the Guild ecosystem.
                </p>
                <Link href={primaryHref} className="marketing-primary mt-6 w-full justify-center">
                  {user ? "Open Membership" : "Create Free Account"}
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-20">
          <div className="marketing-container rounded-[2.25rem] bg-[radial-gradient(circle_at_top,rgba(137,222,119,0.18),transparent_40%),rgba(255,255,255,0.56)] px-8 py-14 text-center">
            <h2 className="marketing-title text-4xl">Ready to add premium support?</h2>
            <p className="marketing-copy mx-auto mt-4 max-w-2xl text-sm">
              Join membership when you want more depth, and keep your candidate or employer role exactly where it belongs.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={primaryHref} className="marketing-primary">
                {user ? "Open Membership Hub" : "Join Guild"}
              </Link>
              <Link href="/employer" className="marketing-secondary">
                Explore Employer Flow
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

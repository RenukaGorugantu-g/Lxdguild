import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Crown, ShieldCheck, Sparkles } from "lucide-react";

export default function LandingPage() {
  const perspectiveCards = [
    {
      icon: ShieldCheck,
      title: "Candidate",
      copy: "Access premium job boards, AI-resume optimization, and curated intros to top-tier startups.",
      points: ["Skill-Gap Analysis", "One-Click Applications"],
      href: "/candidate",
      cta: "Explore Talent Portal",
      accent: "bg-[#f5fff1]",
    },
    {
      icon: BriefcaseBusiness,
      title: "Employer",
      copy: "Source vetted talent with behavioral predictive modeling and automated scheduling tools.",
      points: ["Talent Pipelining", "Diversity Metrics"],
      href: "/employer",
      cta: "Hire with Precision",
      accent: "bg-[#f7f8ff]",
    },
    {
      icon: Crown,
      title: "Membership",
      copy: "Join an elite community of mentors, learners, and executives for lifelong career acceleration.",
      points: ["Exclusive Networking", "Weekly Masterclasses"],
      href: "/membership",
      cta: "Join the Inner Circle",
      accent: "bg-[#0b7f14] text-white",
    },
  ];

  return (
    <div className="marketing-page">
      <main className="pt-32">
        <section className="marketing-section pb-18">
          <div className="marketing-container">
            <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="space-y-6">
                <div className="marketing-kicker">
                  <Sparkles className="h-3.5 w-3.5" />
                  The 2026 Future of Work Ecosystem
                </div>
                <h1 className="marketing-title max-w-xl text-4xl sm:text-5xl">
                  Navigate your <span className="marketing-highlight">career orbit</span> with precision AI.
                </h1>
                <p className="marketing-copy max-w-xl text-base leading-8">
                  A fluid platform connecting ambitious talent with visionary employers through data-driven matching and
                  personalized growth paths.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link href="/register" className="marketing-primary">
                    Launch Discovery
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/membership" className="marketing-secondary">
                    How it works
                  </Link>
                </div>
              </div>

              <div className="marketing-dashboard p-5">
                <div className="flex items-start justify-between">
                  <div className="marketing-stat-chip px-4 py-3">
                    <p className="text-xs font-semibold text-[#0f172a]">Growth Match</p>
                    <p className="mt-1 text-[11px] text-[#5b6757]">85% Skills Alignment</p>
                  </div>
                  <div className="text-right text-[#d4dee5]">
                    <p className="text-xs">Search</p>
                    <p className="mt-3 text-xs">Filter</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_0.7fr]">
                  <div className="rounded-[1.4rem] border border-white/8 bg-[#0f1a20] p-4">
                    <div className="flex h-32 items-end gap-2">
                      {[42, 68, 54, 82, 48, 74].map((height, index) => (
                        <div key={index} className="flex-1 rounded-t-lg bg-[#204e6e]" style={{ height: `${height}%` }} />
                      ))}
                    </div>
                    <div className="mt-4 space-y-2 text-[11px] text-[#8fa7b7]">
                      <div className="flex justify-between"><span>Job Fit</span><span>84/100</span></div>
                      <div className="flex justify-between"><span>Growth Match</span><span>92/100</span></div>
                      <div className="flex justify-between"><span>Culture Score</span><span>88/100</span></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-[1.4rem] border border-white/8 bg-[#101d23] p-4 text-center">
                      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-[10px] border-[#1f5777] border-r-[#2aa8ff] text-xl font-bold text-[#5fd5ff]">
                        90%
                      </div>
                    </div>
                    <div className="marketing-stat-chip p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e746d]">Salary Range</p>
                      <p className="mt-2 text-lg font-semibold text-[#111827]">$140k - $158k</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-16">
          <div className="marketing-container">
            <div className="mb-8 text-center">
              <h2 className="marketing-title text-3xl">Choose your perspective</h2>
              <p className="marketing-copy mt-3 text-sm">
                Our ecosystem is built for three distinct pillars of the modern professional world.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {perspectiveCards.map((card) => (
                <article
                  key={card.title}
                  className={`${card.title === "Membership" ? "rounded-[1.9rem] shadow-[0_20px_50px_rgba(8,95,19,0.22)]" : "marketing-grid-card"} ${card.accent} p-8`}
                >
                  <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${card.title === "Membership" ? "bg-[#9df36c] text-[#0b3b0f]" : "bg-[#eaffdf] text-[#16901d]"}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <h3 className={`text-3xl font-bold ${card.title === "Membership" ? "text-white" : "text-[#111827]"}`}>{card.title}</h3>
                  <p className={`mt-4 text-sm leading-7 ${card.title === "Membership" ? "text-white/78" : "text-[#5b6757]"}`}>{card.copy}</p>
                  <div className="mt-5 space-y-2">
                    {card.points.map((point) => (
                      <p key={point} className={`text-xs font-medium ${card.title === "Membership" ? "text-white" : "text-[#334155]"}`}>
                        ● {point}
                      </p>
                    ))}
                  </div>
                  <Link href={card.href} className={`mt-8 inline-flex items-center gap-2 text-sm font-semibold ${card.title === "Membership" ? "text-white" : "text-[#1f2937]"}`}>
                    {card.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-section pb-16">
          <div className="marketing-container grid gap-6 lg:grid-cols-[1fr_0.52fr]">
            <article className="marketing-grid-card grid overflow-hidden lg:grid-cols-[0.9fr_1.1fr]">
              <div className="p-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6f7f68]">Innovation</p>
                <h3 className="mt-5 text-3xl font-bold text-[#111827]">Career Orbiting: An AI-Driven Trajectory</h3>
                <p className="mt-4 text-sm leading-7 text-[#5b6757]">
                  Predict where your industry is heading and prepare today. Our AI analyzes millions of career paths to
                  find your unique shortcut to the C-suite.
                </p>
                <button className="marketing-primary mt-8">Try Predictor</button>
              </div>
              <div className="min-h-[320px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.95),rgba(17,24,39,0.96)_72%)]" />
            </article>

            <article className="marketing-grid-card p-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffe6ef] text-[#b34367]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-3xl font-bold text-[#111827]">Instant Match</h3>
              <p className="mt-3 text-sm leading-7 text-[#5b6757]">
                Skip the line with verified profiles that auto-apply to roles based on your behavior.
              </p>
              <div className="marketing-soft-card mt-14 px-4 py-3">
                <p className="text-sm font-semibold text-[#111827]">Hired at Google</p>
                <p className="text-xs text-[#6b7280]">2 days after joining</p>
              </div>
            </article>
          </div>
        </section>

        <section className="marketing-section pb-18">
          <div className="marketing-container grid gap-6 lg:grid-cols-[0.55fr_1.45fr]">
            <article className="marketing-grid-card p-8">
              <h3 className="text-3xl font-bold text-[#111827]">Global Network</h3>
              <p className="mt-4 text-sm leading-7 text-[#5b6757]">Connect with over 2M professionals across 140 countries and every major industry.</p>
            </article>
            <article className="marketing-dark-card grid gap-8 p-8 lg:grid-cols-[1fr_0.65fr]">
              <div>
                <h3 className="text-3xl font-bold">Seamless Hiring Infrastructure</h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
                  Enterprise-grade tools for teams that need to scale without friction. Integrated ATS, automated vetting,
                  and compliance built-in.
                </p>
                <button className="marketing-secondary mt-8 border-none bg-[#8ef06d] text-[#18301a]">Scale Your Team</button>
              </div>
              <div className="space-y-4">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
                  <div className="flex justify-between text-sm"><span>Talent Pipeline</span><span>84% Full</span></div>
                  <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-2 w-[84%] rounded-full bg-[#8ef06d]" /></div>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
                  <div className="flex justify-between text-sm"><span>Diversity Score</span><span>92/100</span></div>
                  <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-2 w-[92%] rounded-full bg-[#8ef06d]" /></div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="marketing-section pb-20">
          <div className="marketing-container rounded-[2.5rem] bg-[linear-gradient(180deg,#05760e,#0b7f14)] px-8 py-16 text-center text-white shadow-[0_26px_70px_rgba(10,102,21,0.24)]">
            <h2 className="mx-auto max-w-2xl text-4xl font-bold leading-tight">Ready to accelerate your professional journey?</h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/78">
              Join thousands of others who have already unlocked their full potential with the Guild ecosystem.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register" className="marketing-secondary border-none bg-white text-[#111827]">Create Free Account</Link>
              <Link href="/membership" className="marketing-secondary border border-white/18 bg-white/10 text-white">Schedule a Demo</Link>
            </div>
          </div>
        </section>

        <footer className="marketing-footer px-6 py-8">
          <div className="marketing-container flex flex-col gap-5 text-xs text-[#7a8677] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#111827]">LXD Guild</p>
              <p className="mt-1">Empowering professionals through technology, learning, and community.</p>
            </div>
            <div className="flex flex-wrap gap-5">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Help Center</span>
              <span>Cookie Settings</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

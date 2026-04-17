import Link from "next/link";
import { ArrowRight, ShieldCheck, TrendingUp, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pt-28">
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(52,205,47,0.14),transparent_28%),radial-gradient(circle_at_right,rgba(95,213,255,0.12),transparent_24%)]" />
          <div className="container mx-auto px-6 text-center">
            <div className="glass-panel mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[#cde3e1]">
              <span className="flex h-2 w-2 rounded-full bg-[#34cd2f]"></span>
              Skill-First Talent Marketplace
            </div>
            <h1 className="mb-8 text-5xl font-bold tracking-tight sm:text-7xl">
              Hire <span className="gradient-text">Verified</span> <br className="hidden sm:block" />
              L&D Professionals.
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-[#cde3e1]">
              Stop guessing. We validate Instructional Designers, eLearning Developers, and Learning Consultants through rigorous skill exams before they can apply to your roles.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register?role=employer"
                className="flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] px-8 py-3.5 text-base font-semibold text-[#091737] shadow-[0_18px_40px_rgba(52,205,47,0.24)] transition-all hover:translate-y-[-1px]"
              >
                Hire Talent
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register?role=candidate"
                className="glass-panel flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/12"
              >
                Validate My Skills
              </Link>
            </div>
          </div>
        </section>

        <section id="features" className="py-24">
          <div className="container mx-auto px-6">
            <div className="grid gap-12 text-center md:grid-cols-3">
              <div className="flex flex-col items-center">
                <div className="glass-panel mb-6 flex h-16 w-16 items-center justify-center rounded-2xl">
                  <ShieldCheck className="h-8 w-8 text-[#34cd2f]" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">Pre-Vetted Talent</h3>
                <p className="text-[#cde3e1]">Every candidate passes a role-specific exam simulating real-world Learning UX and Adult Learning Theory challenges.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="glass-panel mb-6 flex h-16 w-16 items-center justify-center rounded-2xl">
                  <TrendingUp className="h-8 w-8 text-[#5fd5ff]" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">Structured Learning Paths</h3>
                <p className="text-[#cde3e1]">Candidates who fall short are redirected to structured learning paths to upskill, ensuring a constantly improving talent pool.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="glass-panel mb-6 flex h-16 w-16 items-center justify-center rounded-2xl">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">Community & Growth</h3>
                <p className="text-[#cde3e1]">Premium memberships offer access to exclusive templates, storyboarding guides, and advanced career resources.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, TrendingUp, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="fixed top-0 w-full backdrop-blur-md bg-background/80 border-b border-border z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex flex-row items-center gap-2">
            <span className="text-xl font-bold gradient-text">LXD Guild</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link href="#features" className="hover:text-brand-600 transition-colors">Features</Link>
            <Link href="#employers" className="hover:text-brand-600 transition-colors">For Employers</Link>
            <Link href="#candidates" className="hover:text-brand-600 transition-colors">For Candidates</Link>
          </nav>
          <div className="flex gap-4 items-center">
            <Link href="/login" className="text-sm font-medium hover:text-brand-600">
              Sign In
            </Link>
            <Link href="/register" className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 transition-opacity">
              Join the Guild
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100 via-background to-background dark:from-surface-dark dark:via-background dark:to-background -z-10" />
          <div className="container mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-surface-dark dark:border dark:border-border dark:text-zinc-300 text-sm font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-brand-600"></span>
              Skill-First Talent Marketplace
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-8">
              Hire <span className="gradient-text">Verified</span> <br className="hidden sm:block" />
              L&D Professionals.
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10">
              Stop guessing. We validate Instructional Designers, eLearning Developers, and Learning Consultants through rigorous skill exams before they can apply to your roles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register?role=employer" className="flex items-center gap-2 text-base font-semibold bg-brand-600 text-white px-8 py-3.5 rounded-full hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/25">
                Hire Talent
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/register?role=candidate" className="flex items-center gap-2 text-base font-semibold border-2 border-border px-8 py-3.5 rounded-full hover:bg-zinc-50 dark:hover:bg-surface-dark transition-all">
                Validate My Skills
              </Link>
            </div>
          </div>
        </section>

        {/* Value Prop Section */}
        <section id="features" className="py-24 bg-zinc-50 dark:bg-[#12141a]">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-12 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-surface-dark flex items-center justify-center mb-6 border border-brand-200 dark:border-border">
                  <ShieldCheck className="w-8 h-8 text-brand-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Pre-Vetted Talent</h3>
                <p className="text-zinc-600 dark:text-zinc-400">Every candidate passes a role-specific exam simulating real-world Learning UX and Adult Learning Theory challenges.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-accent-100 dark:bg-surface-dark flex items-center justify-center mb-6 border border-accent-200 dark:border-border">
                  <TrendingUp className="w-8 h-8 text-accent-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Structured Learning Paths</h3>
                <p className="text-zinc-600 dark:text-zinc-400">Candidates who fall short are redirected to structured learning paths to upskill, ensuring a constantly improving talent pool.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-surface-dark flex items-center justify-center mb-6 border border-blue-200 dark:border-border">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Community & Growth</h3>
                <p className="text-zinc-600 dark:text-zinc-400">Premium memberships offer access to exclusive templates, storyboarding guides, and advanced career resources.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-border bg-background">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-zinc-500">
          <p>© 2026 LXD Guild. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

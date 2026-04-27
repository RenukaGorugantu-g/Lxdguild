import Link from "next/link";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Mail, Sparkles } from "lucide-react";

const tiers = [
  {
    name: "Employer Pro",
    copy: "For teams that want richer employer branding, stronger candidate discovery, and more guided hiring support.",
    features: ["Priority employer support", "Enhanced candidate visibility", "Stronger employer branding on job posts"],
  },
  {
    name: "Employer Premium",
    copy: "For higher-touch hiring teams that want a more consultative relationship with LXD Guild.",
    features: ["Everything in Pro", "Hiring concierge support", "Custom workflow guidance"],
  },
];

export default function EmployerPricingPage() {
  return (
    <div className="marketing-page">
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-32">
        <section className="marketing-shell rounded-[2.25rem] p-8 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <div className="marketing-kicker">
                <Sparkles className="h-3.5 w-3.5" />
                Employer Pricing
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-[-0.05em] text-[#111827] sm:text-5xl">
                Upgrade when you want deeper hiring support, not more friction.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-[#5b6757]">
                We&apos;re keeping employer pricing consultative for now. Tell us what kind of hiring flow you need and we&apos;ll guide you to the right plan.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link href="/contact" className="marketing-primary">
                  Contact Us for Pricing
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="mailto:lxdguild@gmail.com?subject=Employer%20Pricing%20Inquiry" className="marketing-secondary">
                  <Mail className="h-4 w-4" />
                  Email LXD Guild
                </a>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {tiers.map((tier, index) => (
                <article
                  key={tier.name}
                  className={`rounded-[2rem] border p-6 shadow-[0_16px_38px_rgba(92,115,71,0.08)] ${
                    index === 0
                      ? "border-[#dbe7d4] bg-white"
                      : "border-[#1d8c21]/20 bg-[linear-gradient(180deg,#1f9c1f,#177f1c)] text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${index === 0 ? "bg-[#eff8ea] text-[#138d1a]" : "bg-white/16 text-white"}`}>
                      {index === 0 ? <BriefcaseBusiness className="h-5 w-5" /> : <BadgeCheck className="h-5 w-5" />}
                    </div>
                    <h2 className={`text-2xl font-bold ${index === 0 ? "text-[#111827]" : "text-white"}`}>{tier.name}</h2>
                  </div>
                  <p className={`mt-4 text-sm leading-7 ${index === 0 ? "text-[#5b6757]" : "text-white/88"}`}>{tier.copy}</p>
                  <ul className={`mt-6 space-y-3 text-sm ${index === 0 ? "text-[#334155]" : "text-white/92"}`}>
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-[#1f9c1f]" : "bg-white"}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

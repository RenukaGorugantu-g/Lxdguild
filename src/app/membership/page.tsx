import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Crown,
  Eye,
  FileText,
  Sparkles,
  Users,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { MEMBER_ANNUAL_PRICE_INR } from "@/lib/membership";

const curatedAssets = [
  "LXD Playbooks",
  "Cinematic Storyboards",
] as const;

const advancedTools = [
  {
    title: "AI Career Pathmaker",
    copy:
      "Our proprietary engine analyzes global market shifts to generate a personalized career evolution roadmap for your L&D journey.",
    dark: true,
  },
  {
    title: "Enhanced Visibility",
    copy:
      "Member profiles appear more often in employer searches with advanced AI tagging and stronger marketplace context.",
    dark: false,
  },
  {
    title: "Skill Assessments",
    copy:
      "Validated assessments that prove your expertise to potential partners and employers.",
    dark: false,
  },
  {
    title: "The Intelligence Hub",
    copy:
      "Join monthly think-tanks with industry leaders. It is about collaboration, evolution, and privileged Guild access.",
    dark: false,
    bullets: ["Private Member Slack", "Monthly Builder Sprints", "Exclusive Job Board Access"],
  },
] as const;

export default async function PublicMembershipPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryHref = user ? "/dashboard/membership" : "/register";
  const secondaryHref = "/dashboard/resources";
  const freeResourcesHref = "/dashboard/resources";

  return (
    <div className="marketing-page">
      <main className="pt-22 sm:pt-24">
        <section className="marketing-section pb-16 pt-3">
          <div className="marketing-container">
            <div className="grid items-center gap-10 lg:grid-cols-[0.96fr_1.04fr]">
              <div className="space-y-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7a8773]">
                  Exclusive membership
                </div>
                <h1 className="marketing-title max-w-2xl text-[3rem] leading-[0.96] sm:text-[4.25rem]">
                  Unlock the full LXD ecosystem
                </h1>
                <p className="marketing-copy max-w-2xl text-base leading-8">
                  Access premium AI-powered tools, learning resources, professional visibility, and ecosystem
                  advantages built for the future of L&D.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link href={primaryHref} className="marketing-primary rounded-full px-6">
                    {user ? "Open membership" : "Join the Guild"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href={secondaryHref} className="marketing-secondary rounded-full px-6">
                    View ecosystem benefits
                  </Link>
                </div>
              </div>

              <div className="lg:pl-8">
                <div className="relative mx-auto max-w-xl overflow-hidden rounded-[2rem] border border-[#dbe6d6] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbf1_100%)] p-4 shadow-[0_24px_60px_rgba(87,108,67,0.08)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,205,47,0.08),transparent_26%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(95,213,255,0.06),transparent_24%)]" />
                  <div className="relative min-h-[460px] overflow-hidden rounded-[1.65rem] border border-[#112019] bg-[#11171c] shadow-[0_18px_44px_rgba(15,23,42,0.14)] sm:min-h-[430px]">
                    <Image
                      src="/landing-membership-human.png"
                      alt="Membership experience with premium learning support"
                      fill
                      sizes="(max-width: 1024px) 100vw, 520px"
                      className="object-cover object-center"
                      priority
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,17,24,0.08),rgba(8,17,24,0.55))]" />
                    <div className="absolute left-4 right-4 top-4 rounded-[1.1rem] border border-white/14 bg-[rgba(10,20,29,0.78)] px-4 py-3 text-white sm:right-auto sm:max-w-[220px]">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9be6a1]">Premium layer</p>
                      <p className="mt-2 text-sm font-semibold">AI tools + curated resources</p>
                    </div>
                    <div className="absolute left-4 right-4 top-24 rounded-[1.1rem] border border-white/10 bg-[rgba(10,20,29,0.84)] px-4 py-3 text-white shadow-[0_12px_26px_rgba(15,23,42,0.18)] sm:left-auto sm:right-4 sm:top-6 sm:max-w-[210px] sm:bg-white/94 sm:text-[#111827] sm:shadow-[0_12px_26px_rgba(15,23,42,0.12)]">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9be6a1] sm:text-[#7a8674]">Guild support</p>
                      <p className="mt-2 text-xl font-semibold text-white sm:text-2xl sm:text-[#111827]">1 ecosystem</p>
                    </div>
                    <div className="absolute inset-x-4 bottom-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-[1.1rem] border border-white/10 bg-[rgba(10,20,29,0.84)] px-4 py-3 text-white sm:bg-[rgba(10,20,29,0.72)]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9be6a1]">Resources</p>
                        <p className="mt-2 text-lg font-semibold">180+</p>
                      </div>
                      <div className="rounded-[1.1rem] border border-white/10 bg-[rgba(10,20,29,0.84)] px-4 py-3 text-white sm:bg-[rgba(10,20,29,0.72)]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9be6a1]">Visibility</p>
                        <p className="mt-2 text-lg font-semibold">Enhanced</p>
                      </div>
                      <div className="rounded-[1.1rem] border border-white/10 bg-[rgba(10,20,29,0.84)] px-4 py-3 text-white sm:bg-[rgba(10,20,29,0.72)]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9be6a1]">Support</p>
                        <p className="mt-2 text-lg font-semibold">Member hub</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
              <article className="space-y-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7b8775]">Curated assets</p>
                  <h2 className="mt-4 max-w-lg text-3xl font-semibold leading-tight text-[#111827] sm:text-4xl">
                    180+ premium L&amp;D resources
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-[#606c5b]">
                    Step away from generic templates. Access cinematic storyboards, AI-integrated playbooks, and
                    organizational learning guides that transform how teams perceive growth.
                  </p>
                </div>

                <div className="space-y-4">
                  {curatedAssets.map((item, index) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-[#50604e]">
                      {index === 0 ? <BookOpen className="mt-0.5 h-4 w-4 text-[#17931b]" /> : <Sparkles className="mt-0.5 h-4 w-4 text-[#17931b]" />}
                      <div>
                        <p className="font-medium text-[#111827]">{item}</p>
                        <p className="mt-1 text-xs text-[#72806f]">
                          {index === 0
                            ? "Strategic frameworks for high-impact learning initiatives."
                            : "Visual mapping tools for immersive learning experiences."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
                <div className="relative min-h-[320px] overflow-hidden rounded-[1.8rem] border border-[#102028] bg-[#11171c] shadow-[0_20px_50px_rgba(15,23,42,0.14)] lg:min-h-[360px]">
                  <Image
                    src="/landing-membership-human.png"
                    alt="Premium learning resources"
                    fill
                    sizes="(max-width: 1024px) 100vw, 280px"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,17,24,0.08),rgba(8,17,24,0.38))]" />
                </div>

                <div className="space-y-4">
                  <div className="relative min-h-[240px] overflow-hidden rounded-[1.7rem] border border-[#dbe6d6] bg-[#f2f6ef] shadow-[0_18px_44px_rgba(87,108,67,0.08)]">
                    <Image
                      src="/landing-hero-human.png"
                      alt="Ecosystem verification layer"
                      fill
                      sizes="(max-width: 1024px) 100vw, 280px"
                      className="object-cover object-center opacity-80"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(240,247,235,0.18),rgba(240,247,235,0.78))]" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.4rem] bg-[#dff6d9] px-5 py-5 shadow-[0_14px_30px_rgba(87,108,67,0.08)]">
                      <p className="text-3xl font-semibold text-[#111827]">180+</p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a7766]">Premium resources</p>
                    </div>
                    <div className="rounded-[1.4rem] bg-white px-5 py-5 shadow-[0_14px_30px_rgba(87,108,67,0.08)]">
                      <div className="flex items-start gap-3">
                        <Crown className="mt-0.5 h-4 w-4 text-[#17931b]" />
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">Ecosystem verified</p>
                          <p className="mt-1 text-xs leading-6 text-[#72806f]">Every resource is vetted by our L&amp;D council.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-16">
          <div className="marketing-container">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7b8775]">Advanced AI tools</p>
              <h2 className="mt-4 text-4xl font-semibold text-[#111827]">Career intelligence reimagined</h2>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
              <article className="overflow-hidden rounded-[2rem] border border-[#112019] bg-[#101713] p-7 text-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8ee89b]">AI Career Pathmaker</p>
                <h3 className="mt-4 text-3xl font-semibold text-[#67ee63]">AI Career Pathmaker</h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
                  Our proprietary engine analyzes global market shifts to generate a personalized career evolution roadmap
                  for your L&D journey.
                </p>
                <Link href={primaryHref} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#34cd2f] px-5 py-3 text-sm font-semibold text-[#08170d]">
                  Try Pathmaker
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>

              <article className="rounded-[2rem] border border-[#dbe6d6] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbf2_100%)] p-7 shadow-[0_20px_50px_rgba(87,108,67,0.08)]">
                <Eye className="h-5 w-5 text-[#17931b]" />
                <h3 className="mt-10 text-2xl font-semibold text-[#111827]">Enhanced visibility</h3>
                <p className="mt-4 text-sm leading-7 text-[#616d5c]">
                  Member profiles appear more often in employer searches with advanced AI tagging, better context, and
                  stronger marketplace positioning.
                </p>
              </article>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
              <article className="rounded-[2rem] border border-[#dbe6d6] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbf2_100%)] p-7 shadow-[0_20px_50px_rgba(87,108,67,0.08)]">
                <FileText className="h-5 w-5 text-[#17931b]" />
                <h3 className="mt-10 text-2xl font-semibold text-[#111827]">Skill assessments</h3>
                <p className="mt-4 text-sm leading-7 text-[#616d5c]">
                  Validated assessments that prove your expertise to potential partners and employers.
                </p>
              </article>

              <article className="overflow-hidden rounded-[2rem] border border-[#dbe6d6] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbf2_100%)] p-7 shadow-[0_20px_50px_rgba(87,108,67,0.08)]">
                <div className="grid gap-6 lg:grid-cols-[0.96fr_1.04fr]">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7b8775]">Networking</p>
                    <h3 className="mt-3 text-3xl font-semibold text-[#111827]">The Intelligence Hub</h3>
                    <p className="mt-4 text-sm leading-7 text-[#606c5b]">
                      Join monthly think-tanks with industry leaders. Our network is not just about contacts, it is about
                      collaboration and evolution.
                    </p>
                    <div className="mt-6 space-y-3">
                      {advancedTools[3].bullets?.map((bullet) => (
                        <div key={bullet} className="flex items-start gap-3 text-sm text-[#50604e]">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#17931b]" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative min-h-[260px] overflow-hidden rounded-[1.6rem] border border-[#dbe6d6] bg-[#ecefee]">
                    <Image
                      src="/landing-employer-human.png"
                      alt="Membership intelligence community"
                      fill
                      sizes="(max-width: 1024px) 100vw, 420px"
                      className="object-cover object-center"
                    />
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-24">
          <div className="marketing-container relative overflow-hidden rounded-[2.5rem] border border-[#101a1d] bg-[#091116] px-8 py-18 text-center text-white shadow-[0_28px_80px_rgba(7,19,31,0.18)]">
            <div className="relative z-10 mx-auto mb-10 max-w-5xl rounded-[2rem] border border-white/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] p-5 text-left shadow-[0_24px_50px_rgba(7,19,31,0.18)] backdrop-blur-xl sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a8b7a7]">Membership access</p>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-5xl font-semibold leading-none text-white">Rs {MEMBER_ANNUAL_PRICE_INR}</span>
                    <span className="pb-1 text-sm font-medium text-white/70">/ year</span>
                  </div>
                  <p className="mt-3 max-w-md text-sm leading-7 text-white/72">
                    {user
                      ? "Membership is ready to unlock in your dashboard."
                      : "Not a member yet. Start with access to premium resources, guided tools, and deeper Guild support."}
                  </p>
                </div>
                <div className="flex flex-col gap-3 lg:items-end">
                  <Link href={primaryHref} className="marketing-primary w-full justify-center rounded-full px-6 lg:w-auto">
                    {user ? "Open membership" : "Join the Guild"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                    <Link href={freeResourcesHref} className="marketing-secondary flex-1 justify-center rounded-full px-5">
                      Free resources
                    </Link>
                    <Link href={secondaryHref} className="marketing-secondary flex-1 justify-center rounded-full px-5">
                      Resources page
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="landing-cta-panel absolute inset-0 rounded-[2.5rem]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(46,201,78,0.16),transparent_48%),linear-gradient(180deg,rgba(8,16,22,0.82),rgba(8,16,22,0.94))]" />
            <div className="relative">
              <h2 className="mx-auto max-w-4xl text-5xl font-semibold leading-tight">Step into the future of L&amp;D</h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/72">
                The ecosystem is evolving. Secure your place at the forefront of AI-driven learning design.
              </p>
              <Link href={primaryHref} className="marketing-primary mt-8 rounded-full px-7">
                {user ? "Open membership" : "Join the Guild"}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

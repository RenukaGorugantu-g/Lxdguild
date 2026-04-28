import { createClient } from "@/utils/supabase/server";
import { getJobBoardAccessForUser } from "@/lib/job-board-access";
import { ensureUserProfile } from "@/lib/ensure-user-profile";
import { loadProfile } from "@/lib/load-profile";
import { redirect } from "next/navigation";
import { Briefcase, ChevronRight, FileText, Sparkles, UserCircle2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import ProfileForm from "./ProfileForm";

export default async function CandidateProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await loadProfile<Record<string, unknown>>(supabase, user.id, "*");

  let resolvedProfile = profile;
  if (!resolvedProfile) {
    const ensuredProfile = await ensureUserProfile(user);
    if (ensuredProfile) {
      resolvedProfile = await loadProfile<Record<string, unknown>>(supabase, user.id, "*");
    }
  }

  // Verify role is valid for candidate profile access
  const roleStr = resolvedProfile ? String(resolvedProfile.role || "").toLowerCase() : "";
  if (resolvedProfile && (!roleStr || !roleStr.startsWith("candidate"))) {
    // Auto-fix: if user exists but role is invalid, update it to candidate_onhold
    const { data: fixedProfile } = await supabase
      .from("profiles")
      .update({ role: "candidate_onhold" })
      .eq("id", user.id)
      .select("*")
      .single();
    if (fixedProfile) resolvedProfile = fixedProfile;
  }

  if (!resolvedProfile) {
    return (
      <div className="marketing-page min-h-screen">
        <div className="marketing-section pt-32 pb-16">
          <div className="marketing-container">
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="rounded-[28px] border border-[#dfe8d8] bg-white p-8 text-center shadow-[0_18px_45px_rgba(94,119,74,0.08)]">
                <h1 className="text-2xl font-semibold text-[#111827]">Could not load your profile.</h1>
                <p className="mt-3 text-sm leading-7 text-[#5f6876]">
                  Please refresh the page or contact support if this persists.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data: resumes } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", user.id);

  const { count: applicationCount } = await supabase
    .from("job_applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const access = await getJobBoardAccessForUser(supabase, user.id);

  return (
    <div className="marketing-page min-h-screen">
      <div className="marketing-section pt-32 pb-16">
        <div className="marketing-container space-y-10">
          <section className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <h1 className="marketing-title max-w-3xl text-5xl sm:text-6xl">Shape the profile employers will see.</h1>
              <p className="marketing-copy max-w-2xl text-base leading-8">
                Keep your identity, resume, and skill story current so every application feels stronger. This is where
                candidate-onhold users can still unlock value, even before full verification.
              </p>
              <p className="marketing-copy max-w-2xl text-base leading-8">
                You&apos;re currently in the <span className="font-semibold text-[#138d1a]">Profile</span> phase. A stronger
                profile helps you use your free access well and prepares you for verified marketplace visibility.
              </p>
            </div>

            <div className="marketing-panel p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="marketing-soft-card p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Applications</p>
                  <p className="mt-3 text-4xl font-bold text-[#17a21c]">{applicationCount || 0}</p>
                  <p className="mt-4 text-xs text-[#1da326]">Tracked from your candidate account</p>
                </div>
                <div className="marketing-soft-card p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Job Access</p>
                  <p className="mt-3 text-4xl font-bold text-[#111827]">
                    {access.isFreeAccessCandidate ? `${access.freeApplicationsRemaining}` : "Open"}
                  </p>
                  <p className="mt-4 text-xs text-[#1da326]">
                    {access.isFreeAccessCandidate
                      ? `Free applications left out of ${access.freeApplicationLimit}`
                      : "Verified candidate access active"}
                  </p>
                </div>
              </div>
              <div className="marketing-soft-card mt-4 p-4">
                <p className="text-sm font-semibold text-[#111827]">Candidate Progress</p>
                <div className="mt-5 grid grid-cols-4 gap-3">
                  {[34, 52, 28, 68].map((height, index) => (
                    <div
                      key={index}
                      className={`${index === 2 ? "bg-[#35d421]" : "bg-[#dff5d8]"} rounded-t-xl`}
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              icon={<UserCircle2 className="h-5 w-5" />}
              title="Profile Basics"
              copy="Keep your name, headline, and experience aligned to the roles you want."
            />
            <InfoCard
              icon={<Sparkles className="h-5 w-5" />}
              title="Skills Story"
              copy="Turn your profile into a sharper signal for employers and matching logic."
            />
            <InfoCard
              icon={<FileText className="h-5 w-5" />}
              title="Resume Vault"
              copy="Upload polished resumes so you can apply faster when a fit appears."
            />
            <InfoCard
              icon={<Briefcase className="h-5 w-5" />}
              title="Marketplace Access"
              copy={access.lockReason || "Your marketplace access is fully active."}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.55fr]">
            <div className="marketing-grid-card p-8">
              <ProfileForm initialProfile={resolvedProfile} initialResumes={resumes || []} />
            </div>

            <div className="space-y-6">
              <Link
                href="/dashboard/jobs"
                className="flex items-center justify-between rounded-[1.9rem] border border-[#dde7d8] bg-white px-7 py-6 shadow-[0_16px_40px_rgba(87,108,67,0.08)] transition hover:-translate-y-0.5"
              >
                <div>
                  <h3 className="text-2xl font-bold text-[#111827]">Job Marketplace</h3>
                  <p className="mt-1 text-sm text-[#7f8a7b]">
                    {access.isFreeAccessCandidate
                      ? `${access.freeApplicationsRemaining} free applications remaining`
                      : "Browse and apply with your verified profile."}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-[#c2c8be]" />
              </Link>

              <Link
                href="/dashboard/candidate/applications"
                className="flex items-center justify-between rounded-[1.9rem] border border-[#dde7d8] bg-white px-7 py-6 shadow-[0_16px_40px_rgba(87,108,67,0.08)] transition hover:-translate-y-0.5"
              >
                <div>
                  <h3 className="text-2xl font-bold text-[#111827]">My Applications</h3>
                  <p className="mt-1 text-sm text-[#7f8a7b]">Track your submissions and employer movement in one place.</p>
                </div>
                <ChevronRight className="h-5 w-5 text-[#c2c8be]" />
              </Link>

              <article className="rounded-[1.9rem] border border-[#dde7d8] bg-[radial-gradient(circle_at_top,rgba(181,231,157,0.25),transparent_50%),rgba(255,255,255,0.85)] p-7 shadow-[0_16px_40px_rgba(87,108,67,0.08)]">
                <h3 className="text-2xl font-bold text-[#111827]">Profile Insight</h3>
                <p className="mt-4 text-base leading-7 text-[#5b6757]">
                  Candidates who complete their profile early still get something meaningful: cleaner applications,
                  stronger employer context, and limited free marketplace access before full verification.
                </p>
              </article>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  copy,
}: {
  icon: ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <article className="rounded-[1.9rem] border border-[#d8e6d3] bg-white p-7 shadow-[0_16px_40px_rgba(87,108,67,0.08)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#138d1a] text-white">{icon}</div>
      <h3 className="mt-8 text-2xl font-bold text-[#111827]">{title}</h3>
      <p className="mt-3 text-base leading-7 text-[#647061]">{copy}</p>
    </article>
  );
}

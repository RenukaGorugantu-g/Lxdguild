import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck, User, GraduationCap } from "lucide-react";

type CandidateResume = {
  id: string;
  file_url?: string | null;
  visibility?: string | null;
};

export default async function EmployerCandidateDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.role?.startsWith("employer")) {
    redirect("/dashboard");
  }

  const hasPaid = profile.role === "employer_pro" || profile.role === "employer_premium";

  if (!hasPaid) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black pt-28 pb-16 px-6">
        <div className="max-w-xl mx-auto bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border rounded-3xl p-10 text-center shadow-sm">
          <ShieldCheck className="w-12 h-12 text-brand-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Upgrade Required</h1>
          <p className="text-zinc-500 mb-6">Full candidate profile and resume access is available only for Pro or Premium employers.</p>
          <Link href="/dashboard/employer/upgrade" className="inline-flex items-center justify-center px-6 py-3 bg-brand-600 text-white rounded-2xl font-medium hover:bg-brand-700 transition">
            Upgrade Now
          </Link>
        </div>
      </div>
    );
  }

  const { data: candidate } = await supabase
    .from("profiles")
    .select(
      `id, name, designation_level, role, candidates(latest_score, pass_status, exam_status), resumes(id, file_url, visibility)`
    )
    .eq("id", params.id)
    .single();

  if (!candidate || candidate.role !== "candidate_mvp") {
    notFound();
  }

  const candidateData = candidate.candidates?.[0] || {};
  const resumes = candidate.resumes || [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-28 pb-16 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard/employer"
              className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Employer Hub
            </Link>
            <h1 className="text-3xl font-bold mt-4">{candidate.name}</h1>
            <p className="text-zinc-500 mt-2">MVP candidate profile preview — read-only access for Pro/Premium employers.</p>
          </div>
          <div className="rounded-3xl bg-brand-50 border border-brand-200 p-4 text-brand-700">
            <p className="text-sm uppercase tracking-[0.2em] font-bold">Verified MVP</p>
            <div className="mt-3 text-3xl font-extrabold">{candidateData.latest_score ?? "—"}%</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <section className="bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border rounded-3xl p-8 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Candidate Summary</p>
                  <h2 className="text-2xl font-bold mt-2">Profile Snapshot</h2>
                </div>
                <div className="rounded-full bg-green-50 text-green-700 px-4 py-2 text-sm font-semibold border border-green-100">
                  MVP Verified
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-[0.2em]">Role</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{candidate.designation_level || "Instructional Designer"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-[0.2em]">Exam Status</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{candidateData.exam_status || "Not available"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-[0.2em]">Pass Status</p>
                  <p className="font-medium text-zinc-900 dark:text-white">{candidateData.pass_status || "Not available"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-[0.2em]">Access</p>
                  <p className="font-medium text-zinc-900 dark:text-white">Read-only profile + resume</p>
                </div>
              </div>

              <div className="rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 p-5">
                <p className="text-sm text-zinc-500">Contact details are withheld until the candidate chooses to share them with you.</p>
              </div>
            </section>

            <section className="bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <GraduationCap className="w-5 h-5 text-brand-600" />
                <h3 className="text-xl font-semibold">Candidate Resume</h3>
              </div>

              {resumes.length > 0 ? (
                <div className="space-y-4">
                  {resumes.map((resume: CandidateResume) => (
                    <div key={resume.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-3xl border border-zinc-200 dark:border-border p-5">
                      <div>
                        <p className="text-sm font-semibold">Resume</p>
                        <p className="text-xs text-zinc-500">Visibility: {resume.visibility || "private"}</p>
                      </div>
                      <a
                        href={`/api/resumes/${resume.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-600 text-brand-600 hover:bg-brand-50 transition"
                      >
                        <FileText className="w-4 h-4" /> View Resume
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-8 text-center text-zinc-500">
                  No resume uploaded yet by this candidate.
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <div className="bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-brand-600" />
                <h3 className="text-lg font-semibold">Read-only Access</h3>
              </div>
              <p className="text-sm text-zinc-500">
                As a paid employer, you can preview MVP candidate profiles and resumes without editing access. Candidate contact information remains private until they approve engagement.
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-accent-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-sm font-semibold">Privacy protected</span>
              </div>
              <p className="mt-4 text-sm text-white/90">
                This preview is strictly for employer evaluation. Resume access is available in read-only mode only for Pro and Premium employers.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

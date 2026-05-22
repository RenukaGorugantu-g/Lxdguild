import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import { Users, GraduationCap, Building, Briefcase } from "lucide-react";
import CertificateReviewList from "./certificate-review-list";
import JobDeletionReviewList from "./job-deletion-review-list";
import { ensureUserProfile } from "@/lib/ensure-user-profile";
import { isAdminRole } from "@/lib/profile-role";
import Link from "next/link";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Admin Control Center",
  "Private administration area for certificate approvals, job management, and platform operations."
);

type AdminProfile = {
  id?: string;
  role?: string | null;
  [key: string]: unknown;
};

type AdminPostedJob = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  created_at: string | null;
  is_active?: boolean | null;
  deletion_request_status?: string | null;
  deleted_at?: string | null;
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient() ?? supabase;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let profile: AdminProfile | null = null;
  if (!profile && user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  if (!profile) {
    const ensuredProfile = await ensureUserProfile(user);
    if (ensuredProfile) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      profile = data;
    }
  }

  if (!profile) {
    redirect("/dashboard");
  }

  if (!isAdminRole(profile.role)) {
    redirect("/dashboard");
  }

  // Fetch counts for KPI cards
  const { count: totalCandidates } = await adminSupabase.from("profiles").select("*", { count: "exact", head: true }).like("role", "candidate%");
  const { count: mvpCandidates } = await adminSupabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "candidate_mvp");
  const { count: onholdCandidates } = await adminSupabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "candidate_onhold");
  const { count: totalEmployers } = await adminSupabase.from("profiles").select("*", { count: "exact", head: true }).or("role.like.employer%,role.eq.pro_member");
  const { count: totalJobs } = await adminSupabase.from("jobs").select("*", { count: "exact", head: true }).is("deleted_at", null);
  const { count: pendingDeletionCount } = await adminSupabase
    .from("deleted_jobs")
    .select("*", { count: "exact", head: true })
    .eq("request_status", "pending");

  // Fetch pending certificates
  const { data: pendingCertificates } = await adminSupabase
    .from("certificates")
    .select("*, profiles(name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const { data: pendingDeletionRequests } = await adminSupabase
    .from("deleted_jobs")
    .select("id, original_job_id, title, company, requested_at, request_status")
    .eq("request_status", "pending")
    .order("requested_at", { ascending: true });

  const adminPostedJobsQuery = await adminSupabase
    .from("jobs")
    .select("id, title, company, location, created_at, is_active, deletion_request_status, deleted_at, user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);

  const adminPostedJobs =
    adminPostedJobsQuery.error?.code === "42703"
      ? (
          await adminSupabase
            .from("jobs")
            .select("id, title, company, location, created_at, user_id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(8)
        ).data || []
      : adminPostedJobsQuery.data || [];

  const adminPostedJobIds = adminPostedJobs.map((job) => job.id);
  const applicantCountMap = new Map<string, number>();

  if (adminPostedJobIds.length > 0) {
    const applicationsResult = await adminSupabase
      .from("job_applications")
      .select("job_id")
      .in("job_id", adminPostedJobIds);

    for (const application of applicationsResult.data || []) {
      const jobId = application.job_id as string | undefined;
      if (!jobId) continue;
      applicantCountMap.set(jobId, (applicantCountMap.get(jobId) || 0) + 1);
    }
  }

  const passRate = totalCandidates ? Math.round(((mvpCandidates || 0) / (totalCandidates || 1)) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-28 pb-16 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-red-600">Admin Control Center</h1>
            <p className="text-zinc-500 mt-1">Platform Analytics and Overviews.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/employer/post-job"
              className="inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#21a421,#34cd2f)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(33,164,33,0.24)] transition hover:-translate-y-0.5"
            >
              Post Job
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title="Total Candidates" value={totalCandidates || 0} icon={<Users className="w-5 h-5 text-blue-500" />} />
          <KpiCard title="MVP (Verified)" value={mvpCandidates || 0} icon={<GraduationCap className="w-5 h-5 text-green-500" />} trend={`${passRate}% pass rate`} />
          <KpiCard title="On-hold Candidates" value={onholdCandidates || 0} icon={<Users className="w-5 h-5 text-orange-500" />} />
          <KpiCard title="Total Employers" value={totalEmployers || 0} icon={<Building className="w-5 h-5 text-purple-500" />} />
          <KpiCard title="Imported Jobs" value={totalJobs || 0} icon={<Briefcase className="w-5 h-5 text-zinc-500" />} trend="Across all sources" />
          <KpiCard title="Delete Requests" value={pendingDeletionCount || 0} icon={<Briefcase className="w-5 h-5 text-red-500" />} trend="Awaiting review" />
        </div>

        <div className="bg-white dark:bg-surface-dark border p-6 rounded-2xl">
           <h2 className="text-xl font-semibold mb-6">Pending Certificate Approvals</h2>
           <CertificateReviewList certificates={pendingCertificates || []} />
        </div>

        <div className="bg-white dark:bg-surface-dark border p-6 rounded-2xl">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Jobs You Posted</h2>
              <p className="mt-1 text-sm text-zinc-500">Quick access to the roles posted from your admin account.</p>
            </div>
            <Link
              href="/dashboard/employer/post-job"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Post another job
            </Link>
          </div>

          {adminPostedJobs.length > 0 ? (
            <div className="space-y-4">
              {(adminPostedJobs as AdminPostedJob[]).map((job) => (
                <div key={job.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-zinc-900">{job.title}</h3>
                        <AdminJobStatusPill job={job} />
                      </div>
                      <p className="mt-1 text-sm text-zinc-600">{[job.company, job.location].filter(Boolean).join(" | ")}</p>
                      <p className="mt-2 text-xs text-zinc-500">
                        Posted on {job.created_at ? new Date(job.created_at).toLocaleDateString() : "Unknown date"} | {applicantCountMap.get(job.id) || 0} applicant{(applicantCountMap.get(job.id) || 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/dashboard/employer/jobs/${job.id}/edit`}
                        className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/dashboard/jobs/${job.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                      >
                        View job
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500">
              No jobs have been posted from this admin account yet.
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-surface-dark border p-6 rounded-2xl">
           <h2 className="text-xl font-semibold mb-6">Pending Job Deletion Requests</h2>
           <JobDeletionReviewList requests={pendingDeletionRequests || []} />
        </div>

      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, trend }: { title: string, value: string | number, icon: React.ReactNode, trend?: string }) {
  return (
    <div className="bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-medium text-zinc-500 dark:text-zinc-400 text-sm">{title}</h3>
        <div className="p-2 bg-zinc-50 dark:bg-[#1a1c23] rounded-lg">{icon}</div>
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-bold">{value}</span>
        {trend && <span className="text-xs text-brand-600 mt-2 font-medium">{trend}</span>}
      </div>
    </div>
  )
}

function AdminJobStatusPill({ job }: { job: AdminPostedJob }) {
  if (job.deleted_at) {
    return (
      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-red-700">
        Deleted
      </span>
    );
  }

  if (job.deletion_request_status === "pending") {
    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
        Pending Delete Approval
      </span>
    );
  }

  if (job.is_active === false) {
    return (
      <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
        Deactivated
      </span>
    );
  }

  return (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
      Live
    </span>
  );
}

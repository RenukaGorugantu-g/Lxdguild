import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Briefcase } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export default async function CandidateApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { status } = await searchParams;
  const statusFilter = ["applied", "accepted", "rejected"].includes(status || "") ? status : "all";

  let query = supabase
    .from("job_applications")
    .select("id, status, created_at, jobs(id, title, company, location)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: applications } = await query;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-28 pb-16 px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Link href="/dashboard/candidate" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700">
            <ArrowLeft className="w-4 h-4" /> Back to Candidate Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-4">My Applied Jobs</h1>
          <p className="text-zinc-500 mt-1">Track application outcomes from employers in one place.</p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {["all", "applied", "accepted", "rejected"].map((item) => (
            <Link
              key={item}
              href={item === "all" ? "/dashboard/candidate/applications" : `/dashboard/candidate/applications?status=${item}`}
              className={`px-3 py-1.5 rounded-full border transition-colors ${
                statusFilter === item
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
              }`}
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border rounded-2xl p-6">
          {applications && applications.length > 0 ? (
            <ul className="space-y-4">
              {applications.map((application: any) => {
                const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;
                return (
                  <li key={application.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-brand-600" />
                          <p className="font-semibold">{job?.title || "Job listing"}</p>
                        </div>
                        <p className="text-sm text-zinc-500">
                          {[job?.company, job?.location].filter(Boolean).join(" · ") || "Company details unavailable"}
                        </p>
                        <p className="text-xs text-zinc-400">
                          Applied on {new Date(application.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs uppercase tracking-wider px-3 py-1 rounded-full border ${getStatusPillClasses(application.status)}`}>
                        {application.status}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center text-zinc-500">
              No applications found for this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusPillClasses(status: string) {
  if (status === "accepted") return "bg-green-50 text-green-700 border-green-200";
  if (status === "rejected") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

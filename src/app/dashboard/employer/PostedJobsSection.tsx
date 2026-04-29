"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PostedJob = {
  id: string;
  title: string;
  company?: string | null;
  location?: string | null;
  created_at: string;
  apply_url?: string | null;
  is_active?: boolean | null;
  deletion_request_status?: string | null;
  deleted_at?: string | null;
  applicant_count?: number;
};

type DeleteResponse = {
  success?: boolean;
  error?: string;
  message?: string;
};

export default function PostedJobsSection({ initialJobs }: { initialJobs: PostedJob[] }) {
  const [jobs, setJobs] = useState(initialJobs || []);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const deleteJob = async (jobId: string) => {
    if (!confirm("Send this job to the admin team for deletion approval? The role will stay live until it is reviewed.")) return;
    setMessage(null);
    setError(null);
    setDeletingId(jobId);

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      const data = (await res.json()) as DeleteResponse;
      if (!res.ok) {
        throw new Error(data?.error || "Unable to send delete request.");
      }

      setJobs((current) =>
        current.map((job) =>
          job.id === jobId
            ? {
                ...job,
                deletion_request_status: "pending",
              }
            : job
        )
      );
      setMessage(data.message || "Delete request sent.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="premium-card p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">My Posted Jobs</h2>
          <p className="text-sm text-[#cde3e1]/72">Manage the roles you&apos;ve published for MVP candidates.</p>
        </div>
        <Link href="/dashboard/employer/post-job" className="text-sm font-semibold text-[#80ef7a] hover:text-white">
          Post another job
        </Link>
      </div>

      {message && (
        <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-3xl border border-white/10 bg-white/6 p-4 transition hover:border-[#34cd2f]/40">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                    <StatusPill job={job} />
                  </div>
                  <p className="text-sm text-[#cde3e1]/72">{[job.company, job.location].filter(Boolean).join(" | ")}</p>
                  <p className="mt-2 text-xs text-[#cde3e1]/48">
                    Posted on {new Date(job.created_at).toLocaleDateString()} | {job.applicant_count || 0} applicant{job.applicant_count === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                  <Link
                    href={`/dashboard/employer/jobs/${job.id}/edit`}
                    className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-50"
                  >
                    Review Applicants
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteJob(job.id)}
                    disabled={deletingId === job.id || job.deletion_request_status === "pending" || !!job.deleted_at}
                    className="inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === job.id
                      ? "Sending..."
                      : job.deleted_at
                        ? "Deleted"
                        : job.deletion_request_status === "pending"
                          ? "Delete Requested"
                          : "Request Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/12 bg-white/6 p-8 text-center text-[#cde3e1]/72">
          You haven&apos;t posted any jobs yet. Share a role to start attracting MVP candidates.
        </div>
      )}
    </div>
  );
}

function StatusPill({ job }: { job: PostedJob }) {
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

  if (job.deletion_request_status === "rejected") {
    return (
      <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-700">
        Kept Live
      </span>
    );
  }

  return (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
      Live
    </span>
  );
}

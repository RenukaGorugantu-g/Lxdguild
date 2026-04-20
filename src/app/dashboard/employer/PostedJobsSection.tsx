"use client";

import { useState } from "react";
import Link from "next/link";

export default function PostedJobsSection({ initialJobs }: { initialJobs: any[] }) {
  const [jobs, setJobs] = useState(initialJobs || []);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deleteJob = async (jobId: string) => {
    if (!confirm("Delete this job posting? This action cannot be undone.")) return;
    setError(null);
    setDeletingId(jobId);

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Unable to delete job.");
      }

      setJobs((current) => current.filter((job) => job.id !== jobId));
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
                  <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                  <p className="text-sm text-[#cde3e1]/72">{job.company} · {job.location}</p>
                  <p className="mt-2 text-xs text-[#cde3e1]/48">Posted on {new Date(job.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                  <Link
                    href={`/dashboard/employer/jobs/${job.id}/edit`}
                    className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 transition"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-white hover:bg-white/12 transition"
                  >
                    View Job
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteJob(job.id)}
                    disabled={deletingId === job.id}
                    className="inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === job.id ? "Deleting..." : "Delete"}
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

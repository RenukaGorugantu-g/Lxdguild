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
    <div className="bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold">My Posted Jobs</h2>
          <p className="text-zinc-500 text-sm">Manage the roles you’ve published for MVP candidates.</p>
        </div>
        <Link href="/dashboard/employer/post-job" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          Post another job
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-3xl border border-zinc-200 dark:border-border p-4 hover:border-brand-500 transition">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{job.title}</h3>
                  <p className="text-sm text-zinc-500">{job.company} · {job.location}</p>
                  <p className="text-xs text-zinc-400 mt-2">Posted on {new Date(job.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <Link
                    href={`/dashboard/employer/jobs/${job.id}/edit`}
                    className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 transition"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition"
                  >
                    View Job
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteJob(job.id)}
                    disabled={deletingId === job.id}
                    className="inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === job.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-zinc-500">
          You haven’t posted any jobs yet. Share a role to start attracting MVP candidates.
        </div>
      )}
    </div>
  );
}

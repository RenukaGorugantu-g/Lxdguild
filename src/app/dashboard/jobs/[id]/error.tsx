"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function JobDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[JobDetailError] caught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-50 pt-28 pb-16 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-600 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Job Board
        </Link>

        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-2xl font-bold tracking-tight text-zinc-900">
            Unable to display this job
          </h2>
          <p className="mt-2 text-sm text-zinc-600 max-w-md mx-auto">
            We encountered a temporary issue while loading the full job details. You can reload this page or return to the job board to browse other verified opportunities.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Browse all jobs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

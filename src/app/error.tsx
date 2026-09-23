"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError] uncaught application error:", error);
  }, [error]);

  return (
    <div className="marketing-page min-h-[70vh] flex items-center justify-center py-20 px-4">
      <div className="max-w-lg w-full text-center bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h2 className="mt-5 text-2xl font-bold tracking-tight text-zinc-900">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          We encountered an unexpected error while loading this page. Please try reloading or head back to the homepage.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Reload page
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition"
          >
            Go to home
          </Link>
          <Link
            href="/jobs"
            className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition"
          >
            Browse jobs
          </Link>
        </div>
      </div>
    </div>
  );
}

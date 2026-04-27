"use client";

import { useState } from "react";
import { Check, Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

type DeletionRequest = {
  id: string;
  original_job_id: string;
  title: string;
  company: string | null;
  requested_at: string;
  request_status: string;
};

export default function JobDeletionReviewList({ requests }: { requests: DeletionRequest[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  const handleReview = async (jobId: string, action: "approved" | "rejected") => {
    setProcessingId(jobId);
    try {
      const response = await fetch("/api/jobs/delete-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, action }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to review job deletion request.");
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to review job deletion request.");
    } finally {
      setProcessingId(null);
    }
  };

  if (!requests?.length) {
    return <p className="text-zinc-500 text-sm">No pending job deletion requests.</p>;
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="flex flex-col gap-4 rounded-xl border bg-zinc-50 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-red-50 p-2 text-red-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-zinc-900">{request.title}</p>
              <p className="text-xs text-zinc-500">{request.company || "Unknown company"}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-amber-700">
                Requested {new Date(request.requested_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleReview(request.original_job_id, "approved")}
              disabled={processingId === request.original_job_id}
              className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200 disabled:opacity-60"
            >
              {processingId === request.original_job_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Approve delete
            </button>
            <button
              onClick={() => handleReview(request.original_job_id, "rejected")}
              disabled={processingId === request.original_job_id}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-60"
            >
              {processingId === request.original_job_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Keep live
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

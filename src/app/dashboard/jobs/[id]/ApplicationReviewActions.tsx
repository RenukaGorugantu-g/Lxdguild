"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApplicationReviewActions({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: string;
}) {
  const [loadingAction, setLoadingAction] = useState<"accepted" | "rejected" | null>(null);
  const [status, setStatus] = useState(currentStatus);
  const router = useRouter();
  const isFinalStatus = status === "accepted" || status === "rejected";

  const reviewApplication = async (action: "accepted" | "rejected") => {
    setLoadingAction(action);
    try {
      const response = await fetch("/api/notifications/job-application-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, action }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update application status.");
      }

      setStatus(result.status || action);
      router.refresh();
    } catch (error: any) {
      alert(error?.message || "Failed to update application status.");
    } finally {
      setLoadingAction(null);
    }
  };

  if (isFinalStatus) {
    return (
      <div className="mt-3">
        <p className="text-xs text-zinc-500">Final decision recorded. You can no longer modify this application status.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      <button
        type="button"
        onClick={() => reviewApplication("accepted")}
        disabled={!!loadingAction}
        className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-60"
      >
        {loadingAction === "accepted" ? "Accepting..." : status === "accepted" ? "Accepted" : "Accept"}
      </button>
      <button
        type="button"
        onClick={() => reviewApplication("rejected")}
        disabled={!!loadingAction}
        className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60"
      >
        {loadingAction === "rejected" ? "Rejecting..." : status === "rejected" ? "Rejected" : "Reject"}
      </button>
    </div>
  );
}

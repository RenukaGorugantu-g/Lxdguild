"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InterviewSchedulerModal from "./InterviewSchedulerModal";

export default function ApplicationReviewActions({
  applicationId,
  currentStatus,
  candidateName,
  jobTitle,
  interviewSchedule,
  canReviewCandidates = true,
}: {
  applicationId: string;
  currentStatus: string;
  candidateName: string;
  jobTitle: string;
  interviewSchedule?: {
    roundLabel?: string | null;
    startAt?: string | null;
    durationMinutes?: number | null;
    meetingProvider?: string | null;
    schedulingUrl?: string | null;
    notes?: string | null;
  } | null;
  canReviewCandidates?: boolean;
}) {
  const [loadingAction, setLoadingAction] = useState<"shortlisted" | "rejected" | null>(null);
  const [status, setStatus] = useState(currentStatus);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const router = useRouter();
  const isRejected = status === "rejected";

  const reviewApplication = async (action: "shortlisted" | "rejected") => {
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update application status.";
      alert(message);
    } finally {
      setLoadingAction(null);
    }
  };

  if (isRejected) {
    return (
      <div className="mt-3">
        <p className="text-xs text-zinc-500">Final review recorded. This application is now locked for follow-up actions.</p>
      </div>
    );
  }

  if (!canReviewCandidates) {
    return (
      <div className="mt-3 rounded-2xl border border-[#dbe6d7] bg-[#f6fbf3] px-4 py-3 text-xs leading-6 text-[#138d1a]">
        Upgrade to Premium to accept, reject, or schedule interview rounds for applicants.
      </div>
    );
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => reviewApplication("shortlisted")}
          disabled={!!loadingAction || status === "interview_scheduled"}
          className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-60"
        >
          {loadingAction === "shortlisted" ? "Accepting..." : status === "shortlisted" || status === "interview_scheduled" ? "Accepted" : "Accept Candidate"}
        </button>
        <button
          type="button"
          onClick={() => reviewApplication("rejected")}
          disabled={!!loadingAction}
          className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60"
        >
          {loadingAction === "rejected" ? "Rejecting..." : status === "rejected" ? "Rejected" : "Reject Candidate"}
        </button>
        <button
          type="button"
          onClick={() => setIsSchedulerOpen(true)}
          disabled={!!loadingAction}
          className="text-xs px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 disabled:opacity-60"
        >
          {status === "interview_scheduled" ? "Reschedule Interview" : "Schedule Interview"}
        </button>
      </div>
      {isSchedulerOpen && (
        <InterviewSchedulerModal
          applicationId={applicationId}
          candidateName={candidateName}
          jobTitle={jobTitle}
          existingRoundLabel={interviewSchedule?.roundLabel || null}
          existingStartAt={interviewSchedule?.startAt || null}
          existingDurationMinutes={interviewSchedule?.durationMinutes || null}
          existingMeetingProvider={interviewSchedule?.meetingProvider || null}
          existingSchedulingUrl={interviewSchedule?.schedulingUrl || null}
          existingNotes={interviewSchedule?.notes || null}
          onClose={() => setIsSchedulerOpen(false)}
          onSuccess={() => {
            setStatus("interview_scheduled");
            setIsSchedulerOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

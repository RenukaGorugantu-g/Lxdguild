"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Loader2, X } from "lucide-react";

type InterviewProvider = "meeting_link" | "calendly" | "google_calendar";

function toLocalDatetimeValue(initialStartAt?: string | null) {
  if (!initialStartAt) {
    return "";
  }

  const parsed = new Date(initialStartAt);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const offsetDate = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60 * 1000);
  return offsetDate.toISOString().slice(0, 16);
}

export default function InterviewSchedulerModal({
  applicationId,
  candidateName,
  jobTitle,
  existingRoundLabel,
  existingStartAt,
  existingDurationMinutes,
  existingMeetingProvider,
  existingSchedulingUrl,
  existingNotes,
  onClose,
  onSuccess,
}: {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  existingRoundLabel?: string | null;
  existingStartAt?: string | null;
  existingDurationMinutes?: number | null;
  existingMeetingProvider?: string | null;
  existingSchedulingUrl?: string | null;
  existingNotes?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [roundLabel, setRoundLabel] = useState(existingRoundLabel || "Round 1 Interview");
  const [startAt, setStartAt] = useState(toLocalDatetimeValue(existingStartAt));
  const [durationMinutes, setDurationMinutes] = useState(String(existingDurationMinutes || 30));
  const [meetingProvider, setMeetingProvider] = useState<InterviewProvider>(
    existingMeetingProvider === "calendly" || existingMeetingProvider === "google_calendar"
      ? existingMeetingProvider
      : "meeting_link"
  );
  const [schedulingUrl, setSchedulingUrl] = useState(existingSchedulingUrl || "");
  const [notes, setNotes] = useState(existingNotes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLabel = useMemo(() => {
    return existingStartAt ? "Reschedule interview" : "Schedule interview";
  }, [existingStartAt]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/notifications/job-interview-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          roundLabel,
          startAt: new Date(startAt).toISOString(),
          durationMinutes: Number(durationMinutes),
          meetingProvider,
          schedulingUrl: schedulingUrl || null,
          notes: notes || null,
          action: existingStartAt ? "reschedule" : "schedule",
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Interview scheduling failed.");
      }

      if (meetingProvider === "google_calendar" && result.googleCalendarUrl) {
        window.open(result.googleCalendarUrl, "_blank", "noopener,noreferrer");
      }

      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Interview scheduling failed.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center py-6">
        <div className="flex max-h-[calc(100vh-3rem)] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">Interview scheduling</p>
              <h2 className="mt-2 text-xl font-bold text-zinc-950">Schedule interview for {candidateName}</h2>
              <p className="mt-1 text-sm text-zinc-500">{jobTitle}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-zinc-100">
              <X className="h-5 w-5 text-zinc-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-800">Interview round</span>
              <input
                value={roundLabel}
                onChange={(event) => setRoundLabel(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500"
                placeholder="Round 1 Interview"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-zinc-800">Date and time</span>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-zinc-800">Duration</span>
                <select
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-800">Scheduling method</span>
              <select
                value={meetingProvider}
                onChange={(event) => setMeetingProvider(event.target.value as InterviewProvider)}
                className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500"
              >
                <option value="meeting_link">Direct meeting link</option>
                <option value="calendly">Calendly link</option>
                <option value="google_calendar">Google Calendar draft</option>
              </select>
            </label>

            {meetingProvider !== "google_calendar" && (
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-zinc-800">
                  {meetingProvider === "calendly" ? "Calendly link" : "Meeting link"}
                </span>
                <input
                  value={schedulingUrl}
                  onChange={(event) => setSchedulingUrl(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500"
                  placeholder={meetingProvider === "calendly" ? "https://calendly.com/..." : "https://meet.google.com/..."}
                />
              </label>
            )}

            {meetingProvider === "google_calendar" && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                This will generate a Google Calendar draft event for the interviewer in a new tab and notify the candidate with the interview details.
              </div>
            )}

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-zinc-800">Notes for the candidate</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-brand-500"
                placeholder="What should the candidate prepare for this round?"
              />
            </label>
            </div>
          </div>

          <div className="border-t border-zinc-100 bg-white px-6 py-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
              <CalendarDays className="h-4 w-4 text-brand-600" />
              Candidate will receive the schedule in their notifications and email.
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !roundLabel || !startAt || !durationMinutes}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                {submitLabel}
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type InterviewScheduleSummary = {
  roundLabel?: string | null;
  startAt?: string | null;
  durationMinutes?: number | null;
  meetingProvider?: string | null;
  schedulingUrl?: string | null;
  notes?: string | null;
};

function formatInterviewScheduleDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString();
}

export default function ApplicationInterviewScheduleCard({
  schedule,
}: {
  schedule: InterviewScheduleSummary;
}) {
  const formattedDate = formatInterviewScheduleDate(schedule.startAt);

  if (!schedule.roundLabel && !formattedDate && !schedule.schedulingUrl && !schedule.notes) {
    return null;
  }

  return (
    <div className="mt-3 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">Interview schedule</p>
      {schedule.roundLabel && <p className="mt-1 text-sm font-semibold text-zinc-900">{schedule.roundLabel}</p>}
      {formattedDate && <p className="mt-1 text-sm text-zinc-700">Scheduled for {formattedDate}</p>}
      {typeof schedule.durationMinutes === "number" && (
        <p className="mt-1 text-sm text-zinc-700">Duration: {schedule.durationMinutes} minutes</p>
      )}
      {schedule.meetingProvider && (
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-violet-700">{schedule.meetingProvider.replace(/_/g, " ")}</p>
      )}
      {schedule.notes && <p className="mt-2 text-sm text-zinc-600">{schedule.notes}</p>}
      {schedule.schedulingUrl && (
        <a
          href={schedule.schedulingUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex rounded-xl bg-white px-3 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100"
        >
          Open interview link
        </a>
      )}
    </div>
  );
}

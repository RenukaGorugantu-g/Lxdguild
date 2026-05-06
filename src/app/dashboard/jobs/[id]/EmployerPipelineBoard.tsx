"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ExternalLink, FileText, FolderOpen, UserRound } from "lucide-react";
import ApplicationInterviewScheduleCard from "./ApplicationInterviewScheduleCard";
import ApplicationReviewActions from "./ApplicationReviewActions";

type InterviewScheduleSummary = {
  roundLabel?: string | null;
  startAt?: string | null;
  durationMinutes?: number | null;
  meetingProvider?: string | null;
  schedulingUrl?: string | null;
  notes?: string | null;
};

type PipelineApplicant = {
  id: string;
  name: string;
  headline: string;
  status: string;
  appliedAt: string;
  atsScore?: number | null;
  atsSummary?: string | null;
  atsAutoDecision?: string | null;
  interviewSchedule?: InterviewScheduleSummary | null;
  resumeHref?: string | null;
  portfolioUrl?: string | null;
  profileHref?: string | null;
  isMvp?: boolean;
  lockedMessage?: string | null;
  jobTitle: string;
};

type PipelineColumnKey =
  | "applied"
  | "shortlisted"
  | "interview_round_1"
  | "interview_round_2_plus"
  | "rejected";

const PIPELINE_COLUMNS: Array<{
  key: PipelineColumnKey;
  title: string;
  caption: string;
  accent: string;
  iconTone: string;
}> = [
  {
    key: "applied",
    title: "Applied",
    caption: "All submitted applications",
    accent: "border-amber-200 bg-amber-50 text-amber-900",
    iconTone: "bg-amber-100 text-amber-700",
  },
  {
    key: "shortlisted",
    title: "Shortlisted",
    caption: "Ready for next movement",
    accent: "border-emerald-200 bg-emerald-50 text-emerald-900",
    iconTone: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "interview_round_1",
    title: "Round 1",
    caption: "First interview scheduled",
    accent: "border-violet-200 bg-violet-50 text-violet-900",
    iconTone: "bg-violet-100 text-violet-700",
  },
  {
    key: "interview_round_2_plus",
    title: "Round 2+",
    caption: "Deeper interview rounds",
    accent: "border-sky-200 bg-sky-50 text-sky-900",
    iconTone: "bg-sky-100 text-sky-700",
  },
  {
    key: "rejected",
    title: "Rejected",
    caption: "Closed out applicants",
    accent: "border-rose-200 bg-rose-50 text-rose-900",
    iconTone: "bg-rose-100 text-rose-700",
  },
];

function toPipelineColumn(
  status: string,
  interviewSchedule?: InterviewScheduleSummary | null
): PipelineColumnKey {
  if (status === "rejected") return "rejected";

  if (status === "interview_scheduled") {
    const roundLabel = (interviewSchedule?.roundLabel || "").toLowerCase();
    if (
      roundLabel.includes("round 2") ||
      roundLabel.includes("second") ||
      roundLabel.includes("round 3") ||
      roundLabel.includes("third") ||
      roundLabel.includes("final")
    ) {
      return "interview_round_2_plus";
    }

    return "interview_round_1";
  }

  if (status === "shortlisted" || status === "accepted") return "shortlisted";

  return "applied";
}

function getStatusPillClasses(status: string) {
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "interview_scheduled") return "border-violet-200 bg-violet-50 text-violet-700";
  if (status === "shortlisted" || status === "accepted") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function parseAtsSummary(summary: string | null | undefined) {
  if (!summary) {
    return {
      metrics: [] as Array<{ label: string; value: number }>,
      missingSkills: [] as string[],
      remainder: null as string | null,
    };
  }

  const metricPatterns = [
    { label: "ATS score", regex: /ATS score\s+(\d+)%/i },
    { label: "Skill match", regex: /skill match\s+(\d+)%/i },
    { label: "Experience match", regex: /experience match\s+(\d+)%/i },
    { label: "Keyword relevance", regex: /keyword relevance\s+(\d+)%/i },
  ];

  const metrics = metricPatterns
    .map((pattern) => {
      const match = summary.match(pattern.regex);
      if (!match) return null;
      return {
        label: pattern.label,
        value: Number(match[1]),
      };
    })
    .filter((item): item is { label: string; value: number } => Boolean(item));

  const missingSkillsMatch = summary.match(/missing skills:\s*(.+)$/i);
  const missingSkills = missingSkillsMatch?.[1]
    ? missingSkillsMatch[1]
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
    : [];

  return {
    metrics,
    missingSkills,
    remainder: metrics.length === 0 && missingSkills.length === 0 ? summary : null,
  };
}

export default function EmployerPipelineBoard({
  applicants,
  isPaidEmployer = false,
  hiddenApplicantsCount = 0,
}: {
  applicants: PipelineApplicant[];
  isPaidEmployer?: boolean;
  hiddenApplicantsCount?: number;
}) {
  const groupedApplicants = useMemo(
    () =>
      PIPELINE_COLUMNS.map((column) => ({
        ...column,
        applicants:
          column.key === "applied"
            ? applicants
            : applicants.filter(
                (applicant) => toPipelineColumn(applicant.status, applicant.interviewSchedule) === column.key
              ),
      })),
    [applicants]
  );

  const [activeColumn, setActiveColumn] = useState<PipelineColumnKey>("applied");

  const selectedColumn =
    groupedApplicants.find((column) => column.key === activeColumn) || groupedApplicants[0];

  const highestAtsScore = applicants.reduce<number | null>((best, applicant) => {
    if (typeof applicant.atsScore !== "number") return best;
    if (best === null || applicant.atsScore > best) return applicant.atsScore;
    return best;
  }, null);

  return (
    <section className="space-y-5 p-1 sm:p-2">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.95fr)] xl:items-end">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6a7786]">Hiring Pipeline</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#11203b]">Review candidates by stage, not by clutter.</h3>
          <p className="mt-2 text-sm leading-6 text-[#5f6876]">
            Use the steps above to move between applied, shortlisted, interview, and rejected candidates, then review each stage from one focused panel.
          </p>
          {!isPaidEmployer ? (
            <p className="mt-3 text-sm leading-6 text-[#138d1a]">
              Employer access: review up to 5 applicants here, keep interview and decision controls, and upgrade to unlock MVP candidate viewing.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#dbe4ec] bg-white px-4 py-2 text-sm font-medium text-[#334155]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b8794]">Applicants</span>
            <span className="font-bold text-[#11203b]">{applicants.length}</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#dbe4ec] bg-white px-4 py-2 text-sm font-medium text-[#334155]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b8794]">In stage</span>
            <span className="font-bold text-[#11203b]">{selectedColumn.applicants.length}</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#dbe4ec] bg-white px-4 py-2 text-sm font-medium text-[#334155]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b8794]">Top ATS</span>
            <span className="font-bold text-[#11203b]">{highestAtsScore !== null ? `${Math.round(highestAtsScore)}%` : "—"}</span>
          </span>
        </div>
      </div>

      <div className="space-y-5">
        <div className="overflow-hidden rounded-[1.7rem] border border-[#dbe6d7] bg-[linear-gradient(180deg,#f6fbf3_0%,#ffffff_100%)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6d7d68]">Pipeline steps</p>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#edf7e8] px-3 py-1 text-[11px] font-semibold text-[#138d1a]">
              <ArrowDown className="h-3.5 w-3.5" />
              Click a step to review candidates
            </span>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-5">
            {groupedApplicants.map((column, index, items) => {
              const isActive = column.key === activeColumn;
              return (
                <button
                  key={column.key}
                  type="button"
                  onClick={() => setActiveColumn(column.key)}
                  className="relative text-left"
                >
                  <div className="flex flex-col items-start gap-2">
                    <p className="text-sm font-semibold text-[#11203b]">{column.title}</p>
                    <div
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                        isActive
                          ? "bg-[#138d1a] text-white shadow-[0_10px_22px_rgba(19,141,26,0.18)]"
                          : "border border-[#b9ccb0] bg-white text-[#138d1a]"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <p className="text-xs text-[#138d1a]">{column.applicants.length} candidate{column.applicants.length === 1 ? "" : "s"}</p>
                  </div>
                  {index < items.length - 1 ? (
                    <div className="absolute left-8 top-[2.35rem] hidden h-px w-[calc(100%-0.25rem)] bg-[#b9ccb0] xl:block" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white px-1 py-2 sm:px-2">
          <div className="flex flex-col gap-3 border-b border-[#e8edf2] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7b8794]">Selected Step</p>
              <h4 className="mt-2 text-2xl font-bold text-[#11203b]">{PIPELINE_COLUMNS.findIndex((column) => column.key === selectedColumn.key) + 1}. {selectedColumn.title}</h4>
              <p className="mt-2 text-sm leading-6 text-[#5f6876]">{selectedColumn.caption}</p>
              {!isPaidEmployer && hiddenApplicantsCount > 0 ? (
                <p className="mt-2 text-sm leading-6 text-[#138d1a]">
                  {hiddenApplicantsCount} more applicant{hiddenApplicantsCount === 1 ? "" : "s"} are hidden on the free employer plan.
                </p>
              ) : null}
            </div>
            <span className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${selectedColumn.accent}`}>
              {selectedColumn.applicants.length} candidate{selectedColumn.applicants.length === 1 ? "" : "s"}
            </span>
          </div>

          {selectedColumn.applicants.length > 0 ? (
            <div className="mt-6">
              {selectedColumn.applicants.map((applicant, index) => (
                <details key={applicant.id} className="border-b border-[#e8edf2] px-0 py-5 last:border-b-0" open>
                  <summary className="flex cursor-pointer list-none flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eef3ff] text-sm font-bold text-[#415a8b]">
                          {index + 1}
                        </span>
                        <h5 className="text-lg font-semibold text-[#11203b]">{applicant.name}</h5>
                        <span className={`w-fit rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getStatusPillClasses(applicant.status)}`}>
                          {applicant.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[#5f6876]">{applicant.headline}</p>
                    </div>

                    <div className="min-w-[220px]">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8794]">ATS score</p>
                        <span className="rounded-xl bg-[#475569] px-2.5 py-1 text-xs font-semibold text-white [color:#fff] [-webkit-text-fill-color:#fff]">
                          {typeof applicant.atsScore === "number" ? `${Math.round(applicant.atsScore)}%` : "Pending"}
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-[#edf2ed]">
                        <div
                          className="h-3 rounded-full bg-[linear-gradient(90deg,#7ee46b_0%,#138d1a_100%)]"
                          style={{ width: `${typeof applicant.atsScore === "number" ? Math.max(0, Math.min(Math.round(applicant.atsScore), 100)) : 0}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-[#516072]">
                        Applied {new Date(applicant.appliedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </summary>

                  <div className="mt-5 pt-1">
                    {applicant.atsAutoDecision && (
                      <div className="mb-4">
                        <span className="rounded-full bg-[#f7f8fb] px-3 py-1 text-[11px] font-semibold capitalize text-[#516072]">
                          {applicant.atsAutoDecision.replace(/_/g, " ")}
                        </span>
                      </div>
                    )}

                    {applicant.atsSummary && (
                      (() => {
                        const parsed = parseAtsSummary(applicant.atsSummary);
                        return (
                          <div className="mb-5 space-y-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8794]">ATS review</p>
                            {parsed.metrics.length > 0 ? (
                              <div className="space-y-3">
                                {parsed.metrics.map((metric) => (
                                  <div key={`${applicant.id}-${metric.label}`}>
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                      <p className="text-sm font-semibold text-[#11203b]">{metric.label}</p>
                                      <span className="rounded-xl bg-[#475569] px-2.5 py-1 text-xs font-semibold text-white [color:#fff] [-webkit-text-fill-color:#fff]">
                                        {metric.value}%
                                      </span>
                                    </div>
                                    <div className="h-3 rounded-full bg-[#edf2ed]">
                                      <div
                                        className="h-3 rounded-full bg-[linear-gradient(90deg,#7ee46b_0%,#138d1a_100%)]"
                                        style={{ width: `${Math.max(0, Math.min(metric.value, 100))}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            {parsed.missingSkills.length > 0 ? (
                              <div>
                                <p className="mb-2 text-sm font-semibold text-[#11203b]">Missing skills</p>
                                <div className="flex flex-wrap gap-2">
                                  {parsed.missingSkills.map((skill) => (
                                    <span
                                      key={`${applicant.id}-${skill}`}
                                      className="rounded-full bg-[#f4f6f8] px-3 py-1 text-xs font-medium text-[#475569]"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {parsed.remainder ? (
                              <p className="text-sm leading-6 text-[#36506f]">{parsed.remainder}</p>
                            ) : null}
                          </div>
                        );
                      })()
                    )}

                    <div className="mb-5 flex flex-wrap gap-3">
                      {applicant.resumeHref && (
                        <a
                          href={applicant.resumeHref}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-[#11203b] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b3157]"
                        >
                          <FileText className="h-4 w-4" />
                          View resume
                        </a>
                      )}
                      {applicant.profileHref && applicant.isMvp && (
                        <Link
                          href={applicant.profileHref}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#cfd9e3] bg-white px-4 py-2.5 text-sm font-medium text-[#11203b] transition hover:bg-[#f8fafc]"
                        >
                          <UserRound className="h-4 w-4" />
                          View full profile
                        </Link>
                      )}
                      {applicant.portfolioUrl && (
                        <a
                          href={applicant.portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-[#cfd9e3] bg-white px-4 py-2.5 text-sm font-medium text-[#11203b] transition hover:bg-[#f8fafc]"
                        >
                          <FolderOpen className="h-4 w-4" />
                          View portfolio
                        </a>
                      )}
                    </div>

                    {applicant.lockedMessage ? (
                      <div className="mb-5 rounded-2xl border border-[#dbe6d7] bg-[#f6fbf3] px-4 py-3 text-sm text-[#138d1a]">
                        {applicant.lockedMessage}
                      </div>
                    ) : null}

                    <div className="mb-5">
                      <ApplicationReviewActions
                        applicationId={applicant.id}
                        currentStatus={applicant.status}
                        candidateName={applicant.name}
                        jobTitle={applicant.jobTitle}
                        interviewSchedule={applicant.interviewSchedule}
                        canReviewCandidates={isPaidEmployer}
                      />
                    </div>
                    <ApplicationInterviewScheduleCard schedule={applicant.interviewSchedule || {}} />

                    {(applicant.resumeHref || applicant.profileHref || applicant.portfolioUrl) && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-[#6a7786]">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Supporting material opens in a new tab.</span>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className={`mt-6 rounded-[1.6rem] border border-dashed p-8 text-center ${selectedColumn.accent}`}>
              <p className="text-base font-semibold">No candidates in {selectedColumn.title.toLowerCase()} yet.</p>
              <p className="mt-2 text-sm text-[#5f6876]">
                Move through the steps above to check other applicants, or come back here when the pipeline advances.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

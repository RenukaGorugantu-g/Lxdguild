"use client";

import { useState } from "react";
import {
  X,
  CheckCircle,
  FileText,
  Loader2,
  User,
  Award,
  Send,
  BookmarkPlus,
  BellPlus,
  ExternalLink,
  Building2,
  MapPin,
  Clock3,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { normalizeExternalApplyUrl } from "@/lib/job-apply";

type ApplyJob = {
  id: string;
  title: string;
  company: string | null;
  apply_url?: string | null;
};

type CandidateProfile = {
  name?: string | null;
  headline?: string | null;
  skills?: string[] | null;
};

type ResumeOption = {
  id: string;
  file_url?: string | null;
  file_name?: string | null;
};

type SimilarJob = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  expires_at: string | null;
  score: number;
};

type AtsResult = {
  score?: number | null;
  autoDecision?: string | null;
  summary?: string | null;
};

export default function ApplyModal({
  job,
  profile,
  resumes,
  roleKeyword,
  similarJobs,
  isCompanySaved,
  isRoleFollowed,
  alreadyApplied,
  onClose,
  onSuccess,
  onQuotaReached,
}: {
  job: ApplyJob;
  profile: CandidateProfile;
  resumes: ResumeOption[];
  roleKeyword: string;
  similarJobs: SimilarJob[];
  isCompanySaved: boolean;
  isRoleFollowed: boolean;
  alreadyApplied: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onQuotaReached?: (reason: string) => void;
}) {
  const initialApplyUrl = normalizeExternalApplyUrl(job.apply_url);
  const isInternalApply = !initialApplyUrl;
  const [step, setStep] = useState(alreadyApplied ? 3 : 1);
  const [selectedResumeId, setSelectedResumeId] = useState(resumes[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [launchedApplyUrl, setLaunchedApplyUrl] = useState<string | null>(initialApplyUrl);
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null);
  const [atsResult, setAtsResult] = useState<AtsResult | null>(null);
  const [companySaved, setCompanySaved] = useState(isCompanySaved);
  const [roleFollowed, setRoleFollowed] = useState(isRoleFollowed);
  const [savingCompany, setSavingCompany] = useState(false);
  const [followingRole, setFollowingRole] = useState(false);
  const router = useRouter();
  const externalApplyUrl = normalizeExternalApplyUrl(launchedApplyUrl) || initialApplyUrl;

  const openEmployerPage = (url?: string | null, target?: Window | null) => {
    if (!url) return;

    if (target && !target.closed) {
      target.location.href = url;
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handlePreferenceToggle = async (type: "company" | "role", value: string) => {
    const setLoading = type === "company" ? setSavingCompany : setFollowingRole;
    const setState = type === "company" ? setCompanySaved : setRoleFollowed;

    setLoading(true);
    try {
      const response = await fetch("/api/jobs/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Preference update failed.");
      }

      setState(Boolean(result.saved));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setIsSubmitting(true);

    try {
      const selectedResume = resumes.find((resume) => resume.id === selectedResumeId);
      const resumeUrl = selectedResume?.file_url || null;

      const response = await fetch("/api/notifications/job-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, resumeUrl, resumeId: selectedResumeId || null }),
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 403 && result.error && onQuotaReached) {
          onQuotaReached(result.error);
        }
        throw new Error(result.error || "Unable to submit application.");
      }
      const applyUrl = result.applyUrl || job.apply_url;

      if (applyUrl) {
        setLaunchedApplyUrl(applyUrl);
      }
      setAtsResult({
        score: typeof result.atsScore === "number" ? result.atsScore : null,
        autoDecision: result.atsAutoDecision || null,
        summary: result.atsSummary || null,
      });
      if (typeof result.freeAccessRemaining === "number" && result.freeAccessRemaining <= 0) {
        setQuotaMessage("Your free job access is now complete. Verify your profile to keep applying for more roles.");
      }

      onSuccess();
      setStep(3);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert("Error submitting application: " + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shellClass =
    step === 3
      ? "bg-white dark:bg-surface-dark w-full max-w-7xl max-h-[calc(100vh-3rem)] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
      : "bg-white dark:bg-surface-dark w-full max-w-xl max-h-[calc(100vh-3rem)] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300";

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300 sm:p-6">
      <div className="flex min-h-full items-center justify-center">
      <div className={shellClass}>
        <div className="sticky top-0 z-10 border-b bg-white p-6 dark:bg-surface-dark flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Apply for Role</h2>
            <p className="text-sm text-zinc-500">
              {job.title} at {job.company}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/20 rounded-2xl">
                <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center border border-brand-100 dark:border-brand-900/20">
                  <User className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <p className="font-bold">{profile.name}</p>
                  <p className="text-xs text-zinc-500">{profile.headline || "L&D Professional"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-brand-600" /> Your Top Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.length ? (
                    profile.skills.map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No skills added yet. We recommend updating your profile.</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-brand-500/20 transition-all"
              >
                Confirm Profile & Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-brand-600" /> Choose Resume
              </h3>

              <div className="space-y-3">
                {resumes.length > 0 ? (
                  resumes.map((resume) => (
                    <button
                      key={resume.id}
                      onClick={() => setSelectedResumeId(resume.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                        selectedResumeId === resume.id
                          ? "border-brand-600 bg-brand-50/50 dark:bg-brand-900/10"
                          : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className={`w-5 h-5 ${selectedResumeId === resume.id ? "text-brand-600" : "text-zinc-400"}`} />
                        <div className="text-left">
                          <p
                            className={`text-sm font-bold ${
                              selectedResumeId === resume.id ? "text-brand-900 dark:text-brand-100" : "text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            {resume.file_name || "Resume"}
                          </p>
                        </div>
                      </div>
                      {selectedResumeId === resume.id && <CheckCircle className="w-5 h-5 text-brand-600" />}
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center border-2 border-dashed rounded-3xl group">
                    <p className="text-sm text-zinc-500 mb-4">No resumes found in your profile.</p>
                    <button
                      onClick={() => router.push("/dashboard/candidate/profile")}
                      className="text-xs font-bold text-brand-600 uppercase tracking-widest hover:underline"
                    >
                      Update Profile to Upload
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {isInternalApply
                  ? "This role uses LXD Guild's internal apply flow. Once you submit, the employer can review your profile, ATS fit, and resume directly in the platform."
                  : "This opens the employer's official application page in a popup or new tab. You still need to finish the application there for your resume to reach them."}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl font-bold text-zinc-600 dark:text-zinc-400 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  Back
                </button>
                <button
                  onClick={handleApply}
                  disabled={isSubmitting || !selectedResumeId}
                  className="flex-[2] py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-brand-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isInternalApply ? "Submit Application" : "Continue to Official Apply Page"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_380px]">
              <div className="space-y-6">
                <div className="rounded-[28px] border border-green-200 bg-[linear-gradient(135deg,#ecfdf3_0%,#ffffff_55%,#f0f9ff_100%)] p-7">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-green-800">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Application started
                      </div>
                      <div>
                      <p className="text-2xl font-bold tracking-tight text-zinc-950">Your application is in motion</p>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-700">
                          {isInternalApply
                            ? "Your application has been submitted inside LXD Guild. The employer can now review your profile, resume, and ATS fit directly on the platform."
                            : "Continue on the employer's official application page in a new tab. Many job sites block embedded forms, so we now send you there directly."}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Applied role</p>
                      <p className="mt-2 text-sm font-semibold text-zinc-900">{job.title}</p>
                      <p className="mt-1 text-sm text-zinc-500">{job.company}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                  <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-zinc-900">Next step</p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {isInternalApply
                            ? "Your profile is already in the employer's review queue. Stay here to track shortlist and next-round updates."
                            : "Submit the employer form in the external window so your resume reaches their team."}
                        </p>
                      </div>
                      <ExternalLink className="h-5 w-5 text-brand-600" />
                    </div>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 px-4 py-3">
                        <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">1</div>
                        <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          {isInternalApply ? "Application submitted in-platform" : "Finish the official employer application"}
                        </p>
                          <p className="mt-1 text-xs leading-5 text-zinc-500">
                            {isInternalApply
                              ? "The employer can shortlist, reject, and move you to interview stages right here in LXD Guild."
                              : "Some employers ask for extra questions, work samples, or a profile login before the submission is complete."}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 px-4 py-3">
                        <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">2</div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">Come back here for your shortlist</p>
                          <p className="mt-1 text-xs leading-5 text-zinc-500">
                            Save the company or follow similar roles so your next best matches stay easy to revisit.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-zinc-900 bg-zinc-950 p-5 !text-white shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] !text-white">Stay in the loop</p>
                    <p className="mt-3 text-lg font-semibold !text-white">Track this employer and role family right after apply.</p>
                    <p className="mt-2 text-sm leading-6 !text-white">
                      This mirrors the LinkedIn-style follow-up moment so candidates do not hit a dead end after applying.
                    </p>
                  </div>
                </div>

                {atsResult && (typeof atsResult.score === "number" || atsResult.summary) && (
                  <div className="rounded-[28px] border border-blue-200 bg-blue-50 p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">ATS review</p>
                        <p className="mt-2 text-lg font-bold text-zinc-950">
                          {typeof atsResult.score === "number" ? `Resume match score: ${Math.round(atsResult.score)}%` : "ATS analysis completed"}
                        </p>
                        {atsResult.summary ? <p className="mt-2 text-sm leading-6 text-zinc-700">{atsResult.summary}</p> : null}
                      </div>
                      {atsResult.autoDecision ? (
                        <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold capitalize text-blue-800">
                          {atsResult.autoDecision.replace(/_/g, " ")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}

                {!isInternalApply && (
                <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-bold text-zinc-900">Official application handoff</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        Your employer page should already be opening in a new tab. If the browser blocked it, use the button below.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEmployerPage(externalApplyUrl || job.apply_url)}
                        disabled={!externalApplyUrl && !job.apply_url}
                        className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                      >
                        Open Employer Page
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        onClick={onClose}
                        className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-zinc-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Status</p>
                      <p className="mt-2 text-sm font-semibold text-zinc-900">Application tracked in LXD Guild</p>
                    </div>
                    <div className="rounded-2xl bg-zinc-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Destination</p>
                      <p className="mt-2 text-sm font-semibold text-zinc-900">{job.company || "Employer website"}</p>
                    </div>
                    <div className="rounded-2xl bg-zinc-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Action needed</p>
                      <p className="mt-2 text-sm font-semibold text-zinc-900">Complete the employer form</p>
                    </div>
                  </div>
                </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {!isInternalApply && (
                    <button
                      onClick={() => window.open(externalApplyUrl || job.apply_url || "", "_blank", "noopener,noreferrer")}
                      disabled={!externalApplyUrl && !job.apply_url}
                      className="w-full rounded-2xl bg-brand-600 py-4 font-bold text-white shadow-lg transition-all hover:shadow-brand-500/20 disabled:opacity-50"
                    >
                      Open Employer Page in New Tab
                    </button>
                  )}
                  <button
                    onClick={() => router.push("/dashboard/jobs")}
                    className="w-full rounded-2xl bg-zinc-100 py-4 font-bold text-zinc-700 transition-all hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Keep Browsing Jobs
                  </button>
                  <button
                    onClick={() => job.company && handlePreferenceToggle("company", job.company)}
                    disabled={savingCompany || !job.company}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-4 font-bold text-zinc-700 transition-all hover:bg-zinc-50 disabled:opacity-50"
                  >
                    {savingCompany ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
                    {!job.company ? "Company Unavailable" : companySaved ? "Saved Company" : "Save This Company"}
                  </button>
                  <button
                    onClick={() => handlePreferenceToggle("role", roleKeyword)}
                    disabled={followingRole}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-4 font-bold text-zinc-700 transition-all hover:bg-zinc-50 disabled:opacity-50"
                  >
                    {followingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellPlus className="w-4 h-4" />}
                    {roleFollowed ? `Following ${roleKeyword}` : `Follow Similar ${roleKeyword}`}
                  </button>
                </div>

                {!isInternalApply && (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                    Some external job sites send `X-Frame-Options` or `Content-Security-Policy` headers that block embedding, so this flow now sends candidates to the official page in a new tab instead of showing a broken frame.
                  </div>
                )}

                {quotaMessage && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {quotaMessage}
                  </div>
                )}
              </div>

              <aside className="rounded-3xl border border-zinc-200 bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_60%,#ffffff_100%)] p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">More jobs you may like</p>
                    <p className="text-xs text-zinc-500">Fresh L&amp;D listings ranked around this role.</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-brand-600" />
                </div>

                <div className="space-y-3">
                  {similarJobs.length > 0 ? (
                    similarJobs.map((similarJob) => (
                      <LinkCard
                        key={similarJob.id}
                        title={similarJob.title}
                        company={similarJob.company}
                        location={similarJob.location}
                        expiresAt={similarJob.expires_at}
                        href={`/dashboard/jobs/${similarJob.id}`}
                      />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-4 text-sm text-zinc-500">
                      We are fetching more matching L&amp;D roles for this feed.
                    </div>
                  )}
                </div>

                <button
                  onClick={() => router.push("/dashboard/candidate/applications")}
                  className="w-full py-3 rounded-2xl bg-white border border-zinc-200 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  View My Applications
                </button>
              </aside>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

function LinkCard({
  title,
  company,
  location,
  expiresAt,
  href,
}: {
  title: string;
  company: string | null;
  location: string | null;
  expiresAt: string | null;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-zinc-200 bg-white p-4 hover:border-brand-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-zinc-900">{title}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> {company || "Company"}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {location || "Remote"}
            </span>
          </div>
          {expiresAt && (
            <p className="text-[11px] text-amber-700 inline-flex items-center gap-1">
              <Clock3 className="w-3.5 h-3.5" /> Expires {new Date(expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <ExternalLink className="w-4 h-4 text-zinc-400" />
      </div>
    </Link>
  );
}

"use client";

import { useEffect, useState } from "react";
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
import { createClient } from "@/utils/supabase/client";

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
  backToJobsHref,
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
  backToJobsHref: string;
}) {
  const initialApplyUrl = normalizeExternalApplyUrl(job.apply_url);
  const isInternalApply = !initialApplyUrl;
  const supabase = createClient();
  const [step, setStep] = useState(alreadyApplied ? 3 : 1);
  const [resumeOptions, setResumeOptions] = useState(resumes);
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

  useEffect(() => {
    setResumeOptions(resumes);
  }, [resumes]);

  useEffect(() => {
    const refreshResumes = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data, error } = await supabase
        .from("resumes")
        .select("id, file_url, file_name")
        .eq("user_id", user.id)
        .order("id", { ascending: false });

      if (!error && data) {
        setResumeOptions(data);
      }
    };

    void refreshResumes();
  }, [supabase]);

  useEffect(() => {
    if (!resumeOptions.some((resume) => resume.id === selectedResumeId)) {
      setSelectedResumeId(resumeOptions[0]?.id || "");
    }
  }, [resumeOptions, selectedResumeId]);

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
      const selectedResume = resumeOptions.find((resume) => resume.id === selectedResumeId);
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
      ? "bg-white w-full max-w-7xl max-h-[calc(100vh-3rem)] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
      : "bg-white w-full max-w-3xl max-h-[calc(100vh-3rem)] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300";

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300 sm:p-6">
      <div className="flex min-h-full items-center justify-center">
      <div className={shellClass}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-6">
          <div>
            <h2 className="text-xl font-bold">Apply for Role</h2>
            <p className="text-sm text-zinc-500">
              {job.title} at {job.company}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-zinc-100">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto p-8">
          {step !== 3 && (
            <div className="mb-8 grid gap-6 rounded-[28px] border border-[#dde6e0] bg-[linear-gradient(135deg,#f6fbf5_0%,#ffffff_58%,#f8fbff_100%)] p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className={`force-light-text rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${step >= 1 ? "bg-[#11203b] text-white" : "bg-zinc-100 text-zinc-500"}`}>
                    1. profile
                  </span>
                  <span className={`force-light-text rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${step >= 2 ? "bg-[#11203b] text-white" : "bg-zinc-100 text-zinc-500"}`}>
                    2. resume
                  </span>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {isInternalApply ? "internal review" : "external handoff"}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6d7d68]">
                    {isInternalApply ? "LXD Guild apply flow" : "External employer flow"}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#11203b]">
                    {isInternalApply ? "Confirm your profile, pick a resume, and submit." : "Confirm your profile, pick a resume, then continue to the employer site."}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5f6876]">
                    {isInternalApply
                      ? "Your application stays inside LXD Guild, where the employer can review your profile, ATS fit, and resume in one flow."
                      : "We track your application intent here first, then send you to the employer's official page so the final submission reaches their system."}
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Role snapshot</p>
                <p className="mt-3 text-lg font-bold text-zinc-950">{job.title}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {job.company || "Employer"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1">
                    <FileText className="h-3.5 w-3.5" />
                    {resumeOptions.length} resume{resumeOptions.length === 1 ? "" : "s"} ready
                  </span>
                </div>
                {!isInternalApply && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    The employer may ask additional questions, attachments, or a final site-side submit before the application is complete.
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
              <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50">
                    <User className="h-7 w-7 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-zinc-950">{profile.name || "Candidate profile"}</p>
                    <p className="text-sm text-zinc-500">{profile.headline || "L&D Professional"}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-zinc-50 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">What we send forward</p>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                    <li>Your current profile identity and headline</li>
                    <li>Your selected resume and ATS context</li>
                    <li>Your employer-side application tracking inside LXD Guild</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                  <Award className="h-4 w-4 text-brand-600" /> Top skills on profile
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.skills?.length ? (
                    profile.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm italic text-zinc-400">No skills added yet. We recommend updating your profile.</p>
                  )}
                </div>

                <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 px-4 py-4 text-sm text-zinc-500">
                  A stronger profile helps ATS context, employer trust, and faster review after you apply.
                </div>
              </div>

              <div className="lg:col-span-2">
                <button
                  onClick={() => setStep(2)}
                  className="w-full rounded-2xl bg-brand-600 py-4 font-bold text-white shadow-lg transition-all hover:shadow-brand-500/20"
                >
                  Confirm profile and continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
              <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                  <FileText className="h-4 w-4 text-brand-600" /> Choose the resume to send
                </h3>

                <div className="mt-5 space-y-3">
                  {resumeOptions.length > 0 ? (
                    resumeOptions.map((resume) => (
                      <button
                        key={resume.id}
                        onClick={() => setSelectedResumeId(resume.id)}
                        className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                          selectedResumeId === resume.id
                            ? "border-brand-600 bg-brand-50/50"
                            : "border-zinc-100 hover:border-zinc-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <FileText className={`h-5 w-5 ${selectedResumeId === resume.id ? "text-brand-600" : "text-zinc-400"}`} />
                            <div>
                              <p className={`text-sm font-bold ${selectedResumeId === resume.id ? "text-brand-900" : "text-zinc-700"}`}>
                                {resume.file_name || "Resume"}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                {selectedResumeId === resume.id ? "Selected for this application" : "Available in your resume vault"}
                              </p>
                            </div>
                          </div>
                          {selectedResumeId === resume.id && <CheckCircle className="h-5 w-5 text-brand-600" />}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-3xl border-2 border-dashed p-8 text-center">
                      <p className="mb-4 text-sm text-zinc-500">No resumes found in your profile.</p>
                      <button
                        onClick={() => router.push("/dashboard/candidate/profile")}
                        className="text-xs font-bold uppercase tracking-widest text-brand-600 hover:underline"
                      >
                        Update profile to upload
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">What happens next</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl bg-zinc-50 px-4 py-3">
                      <p className="text-sm font-semibold text-zinc-900">1. We save your application intent</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">This keeps the role in your LXD Guild application history.</p>
                    </div>
                    <div className="rounded-2xl bg-zinc-50 px-4 py-3">
                      <p className="text-sm font-semibold text-zinc-900">
                        {isInternalApply ? "2. Employer reviews you inside LXD Guild" : "2. You finish on the employer site"}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        {isInternalApply
                          ? "Your profile, resume, and ATS context are visible in the employer review flow."
                          : "We open the official employer page in a new tab so their system receives the final submission."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`rounded-[28px] px-5 py-4 text-sm ${isInternalApply ? "border border-emerald-200 bg-emerald-50 text-emerald-900" : "border border-amber-200 bg-amber-50 text-amber-900"}`}>
                  {isInternalApply
                    ? "This role uses LXD Guild's internal apply flow. Submission here is the real application."
                    : "This role uses an external employer flow. Submission here starts tracking, but you still need to finish on the employer page."}
                </div>
              </div>

              <div className="flex gap-4 lg:col-span-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-2xl bg-zinc-100 py-4 font-bold text-zinc-600 transition-all hover:bg-zinc-200"
                >
                  Back
                </button>
                <button
                  onClick={handleApply}
                  disabled={isSubmitting || !selectedResumeId}
                  className="flex-[1.8] rounded-2xl bg-brand-600 py-4 font-bold text-white shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-brand-500/20"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
                  {isInternalApply ? "Submit application" : "Continue to employer site"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_380px]">
              <div className="space-y-6">
                <div
                  className="apply-success-surface rounded-[28px] border border-green-200 bg-[linear-gradient(135deg,#ecfdf3_0%,#ffffff_55%,#f0f9ff_100%)] p-7"
                  style={{ colorScheme: "light", forcedColorAdjust: "none", backgroundColor: "#ffffff", color: "#091737" }}
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div
                        className="apply-success-accent inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]"
                        style={{ color: "#166534", WebkitTextFillColor: "#166534" }}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Application started
                      </div>
                      <div>
                      <p className="apply-success-title text-2xl font-bold tracking-tight" style={{ color: "#091737", WebkitTextFillColor: "#091737" }}>Your application is in motion</p>
                      <p className="apply-success-copy mt-2 max-w-2xl text-sm leading-6" style={{ color: "#334155", WebkitTextFillColor: "#334155" }}>
                          {isInternalApply
                            ? "Your application has been submitted inside LXD Guild. The employer can now review your profile, resume, and ATS fit directly on the platform."
                            : "Continue on the employer's official application page in a new tab. Many job sites block embedded forms, so we now send you there directly."}
                        </p>
                      </div>
                    </div>

                    <div className="apply-success-surface rounded-3xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur" style={{ colorScheme: "light", forcedColorAdjust: "none", backgroundColor: "rgba(255,255,255,0.92)", color: "#091737" }}>
                      <p className="apply-success-muted text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#64748b", WebkitTextFillColor: "#64748b" }}>Applied role</p>
                      <p className="apply-success-title mt-2 text-sm font-semibold" style={{ color: "#091737", WebkitTextFillColor: "#091737" }}>{job.title}</p>
                      <p className="apply-success-muted mt-1 text-sm" style={{ color: "#64748b", WebkitTextFillColor: "#64748b" }}>{job.company}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                  <div className="apply-success-surface rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm" style={{ colorScheme: "light", forcedColorAdjust: "none", backgroundColor: "#ffffff", color: "#091737" }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="apply-success-title text-sm font-bold" style={{ color: "#091737", WebkitTextFillColor: "#091737" }}>Next step</p>
                        <p className="apply-success-muted mt-1 text-sm" style={{ color: "#64748b", WebkitTextFillColor: "#64748b" }}>
                          {isInternalApply
                            ? "Your profile is already in the employer's review queue. Stay here to track shortlist and next-round updates."
                            : "Submit the employer form in the external window so your resume reaches their team."}
                        </p>
                      </div>
                      <ExternalLink className="h-5 w-5 text-brand-600" />
                    </div>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 px-4 py-3" style={{ colorScheme: "light", forcedColorAdjust: "none", backgroundColor: "#f8fafc", color: "#091737" }}>
                        <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white" style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>1</div>
                        <div>
                        <p className="apply-success-title text-sm font-semibold" style={{ color: "#091737", WebkitTextFillColor: "#091737" }}>
                          {isInternalApply ? "Application submitted in-platform" : "Finish the official employer application"}
                        </p>
                          <p className="apply-success-muted mt-1 text-xs leading-5" style={{ color: "#64748b", WebkitTextFillColor: "#64748b" }}>
                            {isInternalApply
                              ? "The employer can shortlist, reject, and move you to interview stages right here in LXD Guild."
                              : "Some employers ask for extra questions, work samples, or a profile login before the submission is complete."}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 px-4 py-3" style={{ colorScheme: "light", forcedColorAdjust: "none", backgroundColor: "#f8fafc", color: "#091737" }}>
                        <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white" style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>2</div>
                        <div>
                          <p className="apply-success-title text-sm font-semibold" style={{ color: "#091737", WebkitTextFillColor: "#091737" }}>Come back here for your shortlist</p>
                          <p className="apply-success-muted mt-1 text-xs leading-5" style={{ color: "#64748b", WebkitTextFillColor: "#64748b" }}>
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
                  <div className="apply-success-surface rounded-[28px] border border-blue-200 bg-blue-50 p-6" style={{ colorScheme: "light", forcedColorAdjust: "none", backgroundColor: "#eff6ff", color: "#091737" }}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 [color:#1d4ed8] [-webkit-text-fill-color:#1d4ed8]">ATS review</p>
                        <p className="apply-success-title mt-2 text-lg font-bold" style={{ color: "#091737", WebkitTextFillColor: "#091737" }}>
                          {typeof atsResult.score === "number" ? `Resume match score: ${Math.round(atsResult.score)}%` : "ATS analysis completed"}
                        </p>
                        {atsResult.summary ? <p className="apply-success-copy mt-2 text-sm leading-6" style={{ color: "#334155", WebkitTextFillColor: "#334155" }}>{atsResult.summary}</p> : null}
                      </div>
                      {isInternalApply && atsResult.autoDecision ? (
                        <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold capitalize text-blue-800" style={{ colorScheme: "light", forcedColorAdjust: "none", backgroundColor: "#ffffff", color: "#1e40af", WebkitTextFillColor: "#1e40af" }}>
                          {atsResult.autoDecision.replace(/_/g, " ")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}

                {!isInternalApply && (
                <div className="apply-success-surface rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm" style={{ colorScheme: "light", forcedColorAdjust: "none", backgroundColor: "#ffffff", color: "#091737" }}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="apply-success-title text-sm font-bold" style={{ color: "#091737", WebkitTextFillColor: "#091737" }}>Official application handoff</p>
                      <p className="apply-success-muted mt-1 text-sm" style={{ color: "#64748b", WebkitTextFillColor: "#64748b" }}>
                        Your employer page should already be opening in a new tab. If the browser blocked it, use the button below.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEmployerPage(externalApplyUrl || job.apply_url)}
                        disabled={!externalApplyUrl && !job.apply_url}
                        className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                        style={{ colorScheme: "light", forcedColorAdjust: "none", color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                      >
                        Open Employer Page
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        onClick={onClose}
                        className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
                        style={{ colorScheme: "light", forcedColorAdjust: "none", backgroundColor: "#ffffff", color: "#334155", WebkitTextFillColor: "#334155" }}
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-zinc-50 p-4" style={{ colorScheme: "light", forcedColorAdjust: "none", backgroundColor: "#f8fafc", color: "#091737" }}>
                      <p className="apply-success-muted text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#64748b", WebkitTextFillColor: "#64748b" }}>Status</p>
                      <p className="apply-success-title mt-2 text-sm font-semibold" style={{ color: "#091737", WebkitTextFillColor: "#091737" }}>Application tracked in LXD Guild</p>
                    </div>
                    <div className="rounded-2xl bg-zinc-50 p-4" style={{ colorScheme: "light", forcedColorAdjust: "none", backgroundColor: "#f8fafc", color: "#091737" }}>
                      <p className="apply-success-muted text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#64748b", WebkitTextFillColor: "#64748b" }}>Destination</p>
                      <p className="apply-success-title mt-2 text-sm font-semibold" style={{ color: "#091737", WebkitTextFillColor: "#091737" }}>{job.company || "Employer website"}</p>
                    </div>
                    <div className="rounded-2xl bg-zinc-50 p-4" style={{ colorScheme: "light", forcedColorAdjust: "none", backgroundColor: "#f8fafc", color: "#091737" }}>
                      <p className="apply-success-muted text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#64748b", WebkitTextFillColor: "#64748b" }}>Action needed</p>
                      <p className="apply-success-title mt-2 text-sm font-semibold" style={{ color: "#091737", WebkitTextFillColor: "#091737" }}>Complete the employer form</p>
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
                      style={{ colorScheme: "light", forcedColorAdjust: "none", color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                    >
                      Open Employer Page in New Tab
                    </button>
                  )}
                  <button
                    onClick={() => router.push(backToJobsHref)}
                    className="w-full rounded-2xl bg-zinc-100 py-4 font-bold text-zinc-700 transition-all hover:bg-zinc-200"
                    style={{ colorScheme: "light", forcedColorAdjust: "none", backgroundColor: "#f3f4f6", color: "#334155", WebkitTextFillColor: "#334155" }}
                  >
                    Keep Browsing Jobs
                  </button>
                  <button
                    onClick={() => job.company && handlePreferenceToggle("company", job.company)}
                    disabled={savingCompany || !job.company}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-4 font-bold text-zinc-700 transition-all hover:bg-zinc-50 disabled:opacity-50"
                    style={{ colorScheme: "light", forcedColorAdjust: "none", backgroundColor: "#ffffff", color: "#334155", WebkitTextFillColor: "#334155" }}
                  >
                    {savingCompany ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
                    {!job.company ? "Company Unavailable" : companySaved ? "Saved Company" : "Save This Company"}
                  </button>
                  <button
                    onClick={() => handlePreferenceToggle("role", roleKeyword)}
                    disabled={followingRole}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-4 font-bold text-zinc-700 transition-all hover:bg-zinc-50 disabled:opacity-50"
                    style={{ colorScheme: "light", forcedColorAdjust: "none", backgroundColor: "#ffffff", color: "#334155", WebkitTextFillColor: "#334155" }}
                  >
                    {followingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellPlus className="w-4 h-4" />}
                    {roleFollowed ? `Following ${roleKeyword}` : `Follow Similar ${roleKeyword}`}
                  </button>
                </div>

                {!isInternalApply && (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600" style={{ colorScheme: "light", forcedColorAdjust: "none", backgroundColor: "#f8fafc", color: "#475569", WebkitTextFillColor: "#475569" }}>
                    Some external job sites send `X-Frame-Options` or `Content-Security-Policy` headers that block embedding, so this flow now sends candidates to the official page in a new tab instead of showing a broken frame.
                  </div>
                )}

                {quotaMessage && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" style={{ colorScheme: "light", forcedColorAdjust: "none", backgroundColor: "#fffbeb", color: "#78350f", WebkitTextFillColor: "#78350f" }}>
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

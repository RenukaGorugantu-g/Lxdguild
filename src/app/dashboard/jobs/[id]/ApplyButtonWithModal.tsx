"use client";

import { useState } from "react";
import { CheckCircle, ExternalLink, Lock, Send } from "lucide-react";
import ApplyModal from "./ApplyModal";

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

export default function ApplyButtonWithModal({ 
  job, 
  profile, 
  resumes, 
  alreadyApplied,
  roleKeyword,
  similarJobs,
  isCompanySaved,
  isRoleFollowed,
  canApply = true,
  lockReason = "Write the assessment to unlock job applications."
}: { 
  job: ApplyJob, 
  profile: CandidateProfile, 
  resumes: ResumeOption[], 
  alreadyApplied: boolean,
  roleKeyword: string,
  similarJobs: SimilarJob[],
  isCompanySaved: boolean,
  isRoleFollowed: boolean,
  canApply?: boolean,
  lockReason?: string
}) {
  const [showModal, setShowModal] = useState(false);
  const [applied, setApplied] = useState(alreadyApplied);
  const [buttonLockReason, setButtonLockReason] = useState(lockReason);

  if (applied && !showModal) {
    return (
      <button
        onClick={() => setShowModal(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-8 py-4 font-bold text-green-700 shadow-sm transition-colors hover:bg-green-100"
      >
        <CheckCircle className="w-5 h-5" /> Resume Employer Application <ExternalLink className="w-4 h-4" />
      </button>
    );
  }

  if (!canApply) {
    return (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 py-4 px-8 bg-zinc-100 text-zinc-500 rounded-2xl font-bold border border-zinc-200 shadow-sm">
            <Lock className="w-4 h-4" /> Applications Locked
          </div>
        <p className="text-xs text-center text-zinc-500">{buttonLockReason}</p>
        </div>
      );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-2 py-4 px-8 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/20 hover:scale-[1.02] active:scale-[0.98]"
      >
        <Send className="w-4 h-4" />
        Apply for this Role
      </button>

      {showModal && (
        <ApplyModal 
          job={job} 
          profile={profile} 
          resumes={resumes} 
          roleKeyword={roleKeyword}
          similarJobs={similarJobs}
          isCompanySaved={isCompanySaved}
          isRoleFollowed={isRoleFollowed}
          alreadyApplied={applied}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setApplied(true);
          }}
          onQuotaReached={(reason) => {
            setButtonLockReason(reason);
          }}
        />
      )}
    </>
  );
}

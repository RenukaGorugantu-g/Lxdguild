"use client";

import { useState } from "react";
import { CheckCircle, Lock, Send } from "lucide-react";
import ApplyModal from "./ApplyModal";

export default function ApplyButtonWithModal({ 
  job, 
  user, 
  profile, 
  resumes, 
  alreadyApplied,
  canApply = true,
  lockReason = "Write the assessment to unlock job applications."
}: { 
  job: any, 
  user: any, 
  profile: any, 
  resumes: any[], 
  alreadyApplied: boolean,
  canApply?: boolean,
  lockReason?: string
}) {
  const [showModal, setShowModal] = useState(false);
  const [applied, setApplied] = useState(alreadyApplied);

  if (applied) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 px-8 bg-green-50 text-green-700 rounded-2xl font-bold border border-green-100 shadow-sm">
        <CheckCircle className="w-5 h-5" /> Already Applied
      </div>
    );
  }

  if (!canApply) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 py-4 px-8 bg-zinc-100 text-zinc-500 rounded-2xl font-bold border border-zinc-200 shadow-sm">
          <Lock className="w-4 h-4" /> Applications Locked
        </div>
        <p className="text-xs text-center text-zinc-500">{lockReason}</p>
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
          user={user} 
          profile={profile} 
          resumes={resumes} 
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setApplied(true);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

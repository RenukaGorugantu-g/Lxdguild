"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { X, CheckCircle, FileText, Loader2, User, Award, Send } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ApplyModal({ 
  job, 
  user, 
  profile, 
  resumes, 
  onClose,
  onSuccess
}: { 
  job: any, 
  user: any, 
  profile: any, 
  resumes: any[], 
  onClose: () => void,
  onSuccess: () => void
}) {
  const [step, setStep] = useState(1);
  const [selectedResumeId, setSelectedResumeId] = useState(resumes[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleApply = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("job_applications")
        .insert({
          job_id: job.id,
          user_id: user.id,
          status: 'applied',
          resume_id: selectedResumeId // Assuming we add this column or just record it
        });

      if (error) throw error;
      onSuccess();
      router.refresh();
    } catch (err: any) {
      alert("Error submitting application: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-surface-dark w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Apply for Role</h2>
            <p className="text-sm text-zinc-500">{job.title} at {job.company}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
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
                  {profile.skills?.length > 0 ? profile.skills.map((s: string) => (
                    <span key={s} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-medium">{s}</span>
                  )) : (
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
                {resumes.length > 0 ? resumes.map(r => (
                  <button 
                    key={r.id}
                    onClick={() => setSelectedResumeId(r.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                      selectedResumeId === r.id 
                        ? "border-brand-600 bg-brand-50/50 dark:bg-brand-900/10" 
                        : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className={`w-5 h-5 ${selectedResumeId === r.id ? "text-brand-600" : "text-zinc-400"}`} />
                      <div className="text-left">
                        <p className={`text-sm font-bold ${selectedResumeId === r.id ? "text-brand-900 dark:text-brand-100" : "text-zinc-600 dark:text-zinc-400"}`}>
                          {r.file_name || "Resume"}
                        </p>
                      </div>
                    </div>
                    {selectedResumeId === r.id && <CheckCircle className="w-5 h-5 text-brand-600" />}
                  </button>
                )) : (
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
                  Submit Application
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getRequiredScoreForBucket, PASS_THRESHOLD } from "@/lib/assessment";

type Question = {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  skill_tag?: string | null;
  section_name?: string | null;
  question_set?: string | null;
};

export default function ExamClient({
  questions,
  designationLevel,
  targetRole,
  designationBucket,
  userId,
}: {
  questions: Question[];
  designationLevel: string;
  targetRole: string;
  designationBucket: string;
  userId: string;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  if (!questions || questions.length === 0) {
    return <div className="p-6 bg-white dark:bg-surface-dark border rounded-xl text-center">No questions available for your level yet. Please check back later.</div>;
  }

  const question = questions[currentIdx];

  const handleSelectOption = (opt: string) => {
    setAnswers({ ...answers, [question.id]: opt });
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit your exam? You cannot change your answers after submission.")) return;
    
    setIsSubmitting(true);

    // Score calculation
    let correctCount = 0;
    const scorecard: Record<string, { total: number, correct: number }> = {};

    questions.forEach((q) => {
      const skillTag = q.skill_tag || "General";
      if (!scorecard[skillTag]) scorecard[skillTag] = { total: 0, correct: 0 };
      scorecard[skillTag].total++;

      if (answers[q.id] === q.correct_answer) {
        correctCount++;
        scorecard[skillTag].correct++;
      }
    });

    const finalScore = Math.round((correctCount / questions.length) * 100);

    const requiredScore = getRequiredScoreForBucket();

    const passStatus = finalScore >= requiredScore ? 'pass' : 'fail';
    const newRole = passStatus === 'pass' ? 'candidate_mvp' : 'candidate_onhold';

    try {
      // 1. Record Attempt
      const attemptInsert = await supabase.from("exam_attempts").insert({
        user_id: userId,
        designation_level: designationLevel,
        assessment_track: designationBucket,
        target_role: targetRole,
        designation_bucket: designationBucket,
        score: finalScore,
        pass_fail: passStatus,
        scorecard_json: scorecard
      });
      let attemptError = attemptInsert.error;

      if (attemptError?.code === "42703") {
        const legacyAttemptInsert = await supabase.from("exam_attempts").insert({
          user_id: userId,
          designation_level: designationLevel,
          assessment_track: designationBucket,
          score: finalScore,
          pass_fail: passStatus,
          scorecard_json: scorecard,
        });
        attemptError = legacyAttemptInsert.error;
      }

      if (attemptError) throw new Error(`Failed to save attempt: ${attemptError.message}`);

      // 2. Update Candidate Table
      const { data: candidate } = await supabase.from("candidates").select("*").eq("user_id", userId).single();
      
      if (candidate) {
        const { error: updateError } = await supabase.from("candidates").update({
           exam_status: "completed",
           pass_status: passStatus,
           latest_score: finalScore,
           reattempt_allowed: false,
         }).eq("user_id", userId);
         if (updateError) throw new Error(`Failed to update candidate: ${updateError.message}`);
      } else {
         const { error: insertError } = await supabase.from("candidates").insert({
           user_id: userId,
           exam_status: "completed",
           pass_status: passStatus,
           latest_score: finalScore,
           reattempt_allowed: false,
         });
         if (insertError) throw new Error(`Failed to insert candidate: ${insertError.message}`);
      }

      // 3. Update Role if passed
      if (passStatus === 'pass') {
        const profileUpdate = await supabase.from("profiles").update({ 
          role: "candidate_mvp", 
          verification_status: "verified",
          candidate_target_role: targetRole,
          candidate_designation: designationBucket,
          designation_level: designationLevel,
        }).eq("id", userId);
        let profileError = profileUpdate.error;

        if (profileError?.code === "42703") {
          const legacyProfileUpdate = await supabase.from("profiles").update({
            role: "candidate_mvp",
            verification_status: "verified",
            candidate_designation: designationBucket,
            designation_level: designationLevel,
          }).eq("id", userId);
          profileError = legacyProfileUpdate.error;
        }

        if (profileError) throw new Error(`Failed to update profile: ${profileError.message}`);
      } else {
        const failedProfileUpdate = await supabase
          .from("profiles")
          .update({
            role: newRole,
            candidate_target_role: targetRole,
            candidate_designation: designationBucket,
            designation_level: designationLevel,
          })
          .eq("id", userId);
        let profileUpdateError = failedProfileUpdate.error;

        if (profileUpdateError?.code === "42703") {
          const legacyFailedProfileUpdate = await supabase
            .from("profiles")
            .update({
              role: newRole,
              candidate_designation: designationBucket,
              designation_level: designationLevel,
            })
            .eq("id", userId);
          profileUpdateError = legacyFailedProfileUpdate.error;
        }

        if (profileUpdateError) throw new Error(`Failed to update profile: ${profileUpdateError.message}`);
      }

      try {
        await fetch("/api/notifications/exam-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            score: finalScore,
            passStatus,
            designationBucket,
            targetRole,
          }),
        });
      } catch (notificationError) {
        console.error("Exam result notification failed:", notificationError);
      }

      // Done
      router.push("/dashboard/candidate/scorecard");
      router.refresh();
    } catch (err: unknown) {
      console.error("Exam submission error:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(`There was an error submitting your exam: ${message}. Please try again.`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-zinc-200 dark:border-border p-8">
      <div className="mb-8 flex items-center justify-between">
        <span className="text-sm font-semibold text-brand-600">Question {currentIdx + 1} of {questions.length}</span>
        <div className="text-right">
          <span className="block text-sm text-zinc-500">{designationLevel} Validation Exam</span>
          <span className="block text-xs uppercase tracking-[0.18em] text-zinc-400">
            {question.section_name || "General"} • {(question.question_set || "set1").toUpperCase()}
          </span>
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
        <span className="font-semibold text-zinc-900">{targetRole}</span>
        <span className="rounded-full bg-[#091737] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
          {designationBucket}
        </span>
      </div>

      <h2 className="text-2xl font-semibold mb-6">{question.question}</h2>

      <div className="space-y-3 mb-8">
        {(question.options as string[]).map((opt) => (
          <label key={opt} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${answers[question.id] === opt ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/10' : 'border-zinc-200 dark:border-border hover:bg-zinc-50 dark:hover:bg-[#1a1c23]'}`}>
            <input 
              type="radio" 
              name={`q-${question.id}`} 
              checked={answers[question.id] === opt} 
              onChange={() => handleSelectOption(opt)} 
              className="w-4 h-4 text-brand-600 border-zinc-300 focus:ring-brand-600"
            />
            <span className="text-base font-medium">{opt}</span>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-border">
        <button 
          onClick={handlePrev} 
          disabled={currentIdx === 0} 
          className="px-6 py-2 rounded-lg font-medium border border-zinc-200 dark:border-border text-zinc-600 disabled:opacity-50"
        >
          Previous
        </button>

        {currentIdx === questions.length - 1 ? (
           <button 
             onClick={handleSubmit} 
             disabled={isSubmitting || Object.keys(answers).length !== questions.length} 
             className="px-8 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
           >
             {isSubmitting ? "Submitting..." : "Submit Exam"}
           </button>
        ) : (
           <button 
             onClick={handleNext} 
             disabled={!answers[question.id]} 
             className="px-8 py-2 bg-foreground text-background rounded-lg font-medium disabled:opacity-50"
           >
             Next
           </button>
        )}
      </div>

      <div className="mt-5 text-xs uppercase tracking-[0.16em] text-zinc-400">
        Pass threshold: {PASS_THRESHOLD}%
      </div>
    </div>
  );
}

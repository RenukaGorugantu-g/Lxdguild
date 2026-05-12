"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
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
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  if (!questions || questions.length === 0) {
    return <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">No questions available for your level yet. Please check back later.</div>;
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

  const submitExam = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    let correctCount = 0;
    const scorecard: Record<string, { total: number; correct: number }> = {};

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
    const passStatus = finalScore >= requiredScore ? "pass" : "fail";
    const newRole = passStatus === "pass" ? "candidate_mvp" : "candidate_onhold";

    try {
      const attemptInsert = await supabase.from("exam_attempts").insert({
        user_id: userId,
        designation_level: designationLevel,
        assessment_track: designationBucket,
        target_role: targetRole,
        designation_bucket: designationBucket,
        score: finalScore,
        pass_fail: passStatus,
        scorecard_json: scorecard,
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

      if (passStatus === "pass") {
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
        const failedProfileUpdate = await supabase.from("profiles").update({
          role: newRole,
          candidate_target_role: targetRole,
          candidate_designation: designationBucket,
          designation_level: designationLevel,
        }).eq("id", userId);
        let profileUpdateError = failedProfileUpdate.error;

        if (profileUpdateError?.code === "42703") {
          const legacyFailedProfileUpdate = await supabase.from("profiles").update({
            role: newRole,
            candidate_designation: designationBucket,
            designation_level: designationLevel,
          }).eq("id", userId);
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

      setShowSubmitModal(false);
      router.push("/dashboard/candidate/scorecard");
      router.refresh();
    } catch (err: unknown) {
      console.error("Exam submission error:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setSubmitError(`There was an error submitting your exam: ${message}. Please try again.`);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex min-h-[calc(100vh-10rem)] flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex items-center justify-between gap-4">
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

        <h2 className="mb-6 text-2xl font-semibold text-zinc-950">{question.question}</h2>

        <div className="mb-8 flex-1 space-y-3">
          {question.options.map((opt) => (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${answers[question.id] === opt ? "border-brand-500 bg-brand-50/50 shadow-[0_0_0_3px_rgba(34,197,94,0.08)]" : "border-zinc-200 hover:bg-zinc-50"}`}
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={answers[question.id] === opt}
                onChange={() => handleSelectOption(opt)}
                className="h-4 w-4 border-zinc-300 text-brand-600 focus:ring-brand-600"
              />
              <span className="text-base font-medium text-zinc-900">{opt}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 pt-6">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-6 py-2 font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          {currentIdx === questions.length - 1 ? (
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={isSubmitting || Object.keys(answers).length !== questions.length}
              className="cursor-pointer rounded-lg bg-brand-600 px-8 py-2 font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Exam"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!answers[question.id]}
              className="cursor-pointer rounded-lg bg-brand-600 px-8 py-2 font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
            >
              Next
            </button>
          )}
        </div>

        <div className="mt-5 text-xs uppercase tracking-[0.16em] text-zinc-400">
          Pass threshold: {PASS_THRESHOLD}%
        </div>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-4">
          <div className="w-full max-w-md rounded-[1.75rem] border border-[#dbe6d6] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#111827]">Submit your assessment?</h3>
                <p className="mt-2 text-sm leading-7 text-[#5b6757]">
                  Once you submit, your answers are locked and your scorecard will be generated immediately.
                </p>
              </div>
            </div>

            {submitError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={submitExam}
                disabled={isSubmitting}
                className="cursor-pointer rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Yes, submit now"}
              </button>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Review answers
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

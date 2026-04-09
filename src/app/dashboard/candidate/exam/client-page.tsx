"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Question = {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  skill_tag: string;
};

export default function ExamClient({ questions, designationLevel, userId }: { questions: Question[], designationLevel: string, userId: string }) {
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
      if (!scorecard[q.skill_tag]) scorecard[q.skill_tag] = { total: 0, correct: 0 };
      scorecard[q.skill_tag].total++;

      if (answers[q.id] === q.correct_answer) {
        correctCount++;
        scorecard[q.skill_tag].correct++;
      }
    });

    const finalScore = Math.round((correctCount / questions.length) * 100);

    // Pass criteria logic
    let requiredScore = 75; // Default Level 4-6
    if (designationLevel === "Level 1") requiredScore = 60;
    if (designationLevel === "Level 2" || designationLevel === "Level 3") requiredScore = 70;

    const passStatus = finalScore >= requiredScore ? 'pass' : 'fail';
    const newRole = passStatus === 'pass' ? 'candidate_mvp' : 'candidate_onhold';

    try {
      // 1. Record Attempt
      const { error: attemptError } = await supabase.from("exam_attempts").insert({
        user_id: userId,
        designation_level: designationLevel,
        score: finalScore,
        pass_fail: passStatus,
        scorecard_json: scorecard
      });

      if (attemptError) throw new Error(`Failed to save attempt: ${attemptError.message}`);

      // 2. Update Candidate Table
      const { data: candidate, error: fetchError } = await supabase.from("candidates").select("*").eq("user_id", userId).single();
      
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
        const { error: profileError } = await supabase.from("profiles").update({ 
          role: "candidate_mvp", 
          verification_status: "verified" 
        }).eq("id", userId);
        if (profileError) throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      // Done
      if (passStatus === 'fail') {
        router.push("/dashboard/candidate/scorecard");
      } else {
        router.push("/dashboard/candidate");
      }
      router.refresh();
    } catch (err: any) {
      console.error("Exam submission error:", err);
      alert(`There was an error submitting your exam: ${err.message}. Please try again.`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-zinc-200 dark:border-border p-8">
      <div className="mb-8 flex items-center justify-between">
        <span className="text-sm font-semibold text-brand-600">Question {currentIdx + 1} of {questions.length}</span>
        <span className="text-sm text-zinc-500">{designationLevel} Validation Exam</span>
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
    </div>
  );
}

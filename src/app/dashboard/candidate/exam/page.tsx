import { createClient } from "@/utils/supabase/server";
import {
  buildWeightedAssessment,
  DEFAULT_TOTAL_QUESTIONS,
  getLegacyDesignationLevel,
  resolveAssessmentBucket,
} from "@/lib/assessment";
import { redirect } from "next/navigation";
import ExamClient from "./client-page";

export default async function ExamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profileResult = await supabase
    .from("profiles")
    .select("designation_level, candidate_target_role, candidate_designation, role")
    .eq("id", user.id)
    .single();
  let profile = profileResult.data;

  if (profileResult.error?.code === "42703") {
    const fallbackProfile = await supabase
      .from("profiles")
      .select("designation_level, candidate_designation, role")
      .eq("id", user.id)
      .single();
    profile = fallbackProfile.data
      ? {
          ...fallbackProfile.data,
          candidate_target_role: null,
        }
      : null;
  }

  if (profile?.role === "candidate_mvp") {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p>You have already passed the exam.</p>
      </div>
    );
  }

  const { targetRole, designationBucket } = resolveAssessmentBucket(profile);
  const level = profile?.designation_level || getLegacyDesignationLevel(designationBucket);

  const bucketQuery = await supabase
    .from("exam_questions")
    .select("id, question, options, correct_answer, skill_tag, section_name, designation_bucket, question_set, set_weight, designation_level")
    .eq("is_active", true)
    .eq("designation_bucket", designationBucket);

  let questions = bucketQuery.data || [];

  if (bucketQuery.error?.code === "42703") {
    const legacyQuestions = await supabase
      .from("exam_questions")
      .select("id, question, options, correct_answer, skill_tag")
      .eq("designation_level", level);

    questions = (legacyQuestions.data || []).map((question) => ({
      ...question,
      section_name: question.skill_tag || "General",
      designation_bucket: designationBucket,
      question_set: "set1",
      designation_level: level,
    }));
  } else if (!questions.length) {
    const fallbackQuestions = await supabase
      .from("exam_questions")
      .select("id, question, options, correct_answer, skill_tag, section_name, designation_bucket, question_set, set_weight, designation_level")
      .eq("designation_level", level);

    questions = (fallbackQuestions.data || []).map((question) => ({
      ...question,
      section_name: question.section_name || question.skill_tag || "General",
      question_set: question.question_set || "set1",
    }));
  }

  const weightedQuestions = buildWeightedAssessment(questions, DEFAULT_TOTAL_QUESTIONS);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-28 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <ExamClient 
          questions={weightedQuestions || []}
          designationLevel={level} 
          targetRole={targetRole}
          designationBucket={designationBucket}
          userId={user.id} 
        />
      </div>
    </div>
  );
}


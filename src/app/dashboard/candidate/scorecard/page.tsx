import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Award, BookOpen, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import AssessmentBadgeShare from "./AssessmentBadgeShare";
import { getCourseRecommendations, PASS_THRESHOLD } from "@/lib/assessment";
import { getSiteUrl } from "@/lib/site-url";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "Assessment Scorecard",
  "Private assessment results, score breakdown, and recommended learning paths for candidates."
);

export default async function ScorecardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. Fetch latest attempt
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 pt-28">
        <div className="text-center">
          <p className="text-zinc-500">No exam attempts found.</p>
          <Link href="/dashboard/candidate" className="text-brand-600 hover:underline mt-2 inline-block">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const scorecard = (attempt.scorecard_json || {}) as Record<string, { total: number, correct: number }>;
  const weakSkills = Object.entries(scorecard)
    .filter(([, stats]) => {
      if (!stats || typeof stats.total !== 'number' || stats.total === 0) return false;
      return (stats.correct / stats.total) < 0.7;
    })
    .map(([skill]) => skill);

  const isPass = attempt.pass_fail === "pass";
  const designationBucket = attempt.designation_bucket || "Intermediate";
  const numericScore = Number(attempt.score || 0);
  const distanceToPass = Math.max(PASS_THRESHOLD - numericScore, 0);
  const progressToPass = Math.max(Math.min((numericScore / PASS_THRESHOLD) * 100, 100), 0);
  const recommendationPlan = getCourseRecommendations(designationBucket, numericScore);
  const courseCodes = recommendationPlan.courses.map((course) => course.code);
  const [profileResponse, courseRowsResponse] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, candidate_target_role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("courses")
      .select("course_code, title, external_link")
      .in("course_code", courseCodes)
      .neq("course_code", "C5"),
  ]);

  const profile = profileResponse.data;
  const courseRows = courseRowsResponse.data;
  const candidateName = profile?.name || user.email?.split("@")[0] || "LXD Guild Candidate";
  const candidateFirstName = candidateName.trim().split(/\s+/)[0] || "there";
  const targetRole = profile?.candidate_target_role || "Learning & Development Professional";
  const shareUrl = `${getSiteUrl()}/candidate`;

  const courseLinkMap = new Map(
    (courseRows || []).map((course) => [course.course_code as string, {
      title: course.title as string,
      externalLink: course.external_link as string,
    }])
  );
  const recommendedCourses = recommendationPlan.courses.map((course) => ({
    ...course,
    title: courseLinkMap.get(course.code)?.title || course.title,
    externalLink: courseLinkMap.get(course.code)?.externalLink || course.externalLink,
  }));
  const priorityTone: Record<string, string> = {
    recommended: "bg-blue-50 text-blue-700 border-blue-200",
    suggested: "bg-emerald-50 text-emerald-700 border-emerald-200",
    optional: "bg-zinc-50 text-zinc-600 border-zinc-200",
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-6 pb-16 pt-28">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Header/Score Summary */}
        <div className={`rounded-3xl border p-7 ${isPass ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`rounded-2xl p-4 ${isPass ? 'bg-green-100' : 'bg-orange-100'}`}>
                  {isPass ? <CheckCircle2 className="w-8 h-8 text-green-600" /> : <AlertTriangle className="w-8 h-8 text-orange-600" />}
               </div>
              <div>
                  <h1 className="text-2xl font-bold">
                    {isPass ? `You did it, ${candidateFirstName}!` : `Hey ${candidateFirstName}, you're so close!`}
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
                    {isPass
                      ? "Your skills are now validated, and your profile is ready for stronger-fit opportunities across the Guild."
                      : "You're just one step away from getting verified. Take the skill test today and unlock the full Guild experience - it's worth it."}
                  </p>
                  <p className="mt-3 text-zinc-600">
                    Current score: <span className="font-semibold text-lg">{attempt.score}%</span>
                  </p>
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500 mt-1">Pass threshold: {PASS_THRESHOLD}%</p>
               </div>
            </div>
            <Link href="/dashboard/candidate" className="rounded-xl border border-zinc-200 bg-white px-6 py-2 text-sm font-medium transition-colors hover:bg-zinc-50">
               Back to Dashboard
            </Link>
          </div>
          <div className="mt-6 rounded-2xl border border-white/70 bg-white/70 p-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-zinc-700">Progress toward validation</span>
              <span className={`font-semibold ${isPass ? "text-green-700" : "text-orange-700"}`}>
                {isPass ? "Threshold cleared" : `${distanceToPass}% to go`}
              </span>
            </div>
            <div className="relative mt-4 h-3 overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#ef4444_0%,#f59e0b_45%,#22c55e_100%)]"
                style={{ width: `${progressToPass}%` }}
              />
              <div
                className="absolute top-[-3px] h-5 w-1 rounded-full bg-[#091737]"
                style={{ left: `calc(${Math.min(progressToPass, 100)}% - 2px)` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-zinc-500">
              <span>Current score</span>
              <span>Pass threshold {PASS_THRESHOLD}%</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          
          {/* Skill Breakdown */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-600" /> Skill Breakdown
            </h3>
            <div className="space-y-6">
              {Object.keys(scorecard).length > 0 ? Object.entries(scorecard).map(([skill, stats]) => {
                const percent = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                return (
                  <div key={skill} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{skill}</span>
                      <span className={percent >= 70 ? "text-green-600" : "text-orange-600"}>{percent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                      <div 
                        className="h-full bg-[linear-gradient(90deg,#ef4444_0%,#f59e0b_45%,#22c55e_100%)] transition-all duration-1000" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-zinc-500 text-sm text-center py-10">No skill data available for this attempt.</p>
              )}
            </div>
          </div>

          {/* Learning Path */}
          <div className="rounded-2xl border border-[#d8e6d3] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdf8_100%)] p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-600" /> Recommended Learning Path
            </h3>
            {recommendedCourses.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#d8e6d3] bg-[linear-gradient(180deg,#f7fbf3_0%,#eef7e8_100%)] p-5 shadow-[0_10px_24px_rgba(87,108,67,0.05)]">
                  <p className="mt-2 text-lg font-semibold text-zinc-950">
                    {recommendationPlan.tier === "proficient" ? "Proficient" : "Needs Development"} tier
                  </p>
                  <p className="mt-2 text-sm text-zinc-600">
                    These suggested courses are your fastest path to closing the gap and moving closer to validation.
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">{recommendationPlan.rationale}</p>
                </div>

                <div className="space-y-3">
                  {recommendedCourses.map((course) => (
                    <div key={course.code} className="rounded-2xl border border-[#d8e6d3] bg-white p-5 shadow-[0_8px_20px_rgba(87,108,67,0.05)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="max-w-2xl space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-[#091737] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] !text-white">
                              {course.code}
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${priorityTone[course.priority]}`}>
                              {course.priority}
                            </span>
                          </div>
                          <p className="text-base font-semibold text-zinc-950">{course.title}</p>
                          <p className="text-sm text-zinc-600">{course.description}</p>
                        </div>
                        <a
                          href={course.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
                        >
                          Go to Course
                          <ChevronRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {weakSkills.length > 0 && (
                  <div className="rounded-2xl border border-zinc-100 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Focus skills</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {weakSkills.map((skill) => (
                        <span key={skill} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-zinc-500">
                 We could not find a matching course yet. Add C1 to C4 course entries in the courses table to complete the recommendation flow.
              </div>
            )}
          </div>

        </div>

        <AssessmentBadgeShare
          candidateName={candidateName}
          targetRole={targetRole}
          designationBucket={designationBucket}
          score={numericScore}
          isPass={isPass}
          weakSkills={weakSkills}
          shareUrl={shareUrl}
        />

        {!isPass && (
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5 text-center">
            <p className="mb-2 text-sm font-medium text-brand-900">Ready to reattempt?</p>
            <p className="mb-4 text-xs text-zinc-600">Complete the courses above and submit your certificate on the dashboard to unlock a retry.</p>
          </div>
        )}

      </div>
    </div>
  );
}

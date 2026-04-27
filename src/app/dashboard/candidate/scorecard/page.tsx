import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Award, BookOpen, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
  COURSE_PROFICIENCY_THRESHOLD,
  getCourseRecommendations,
  PASS_THRESHOLD,
} from "@/lib/assessment";

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
  const recommendationPlan = getCourseRecommendations(designationBucket, numericScore);

  const courseCodes = recommendationPlan.courses.map((course) => course.code);
  const { data: courseRows } = await supabase
    .from("courses")
    .select("course_code, title, external_link")
    .in("course_code", courseCodes)
    .neq("course_code", "C5");

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
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-28 pb-16 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header/Score Summary */}
        <div className={`p-8 rounded-3xl border ${isPass ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30' : 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-900/30'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className={`p-4 rounded-2xl ${isPass ? 'bg-green-100 dark:bg-green-900/40' : 'bg-orange-100 dark:bg-orange-900/40'}`}>
                  {isPass ? <CheckCircle2 className="w-8 h-8 text-green-600" /> : <AlertTriangle className="w-8 h-8 text-orange-600" />}
               </div>
              <div>
                  <h1 className="text-2xl font-bold">{isPass ? "Validation Successful" : "Validation Incomplete"}</h1>
                  <p className="text-zinc-600 dark:text-zinc-400">Score: <span className="font-bold text-lg">{attempt.score}%</span></p>
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500 mt-1">Pass threshold: {PASS_THRESHOLD}%</p>
               </div>
            </div>
            <Link href="/dashboard/candidate" className="px-6 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-black font-medium text-sm hover:bg-zinc-50 transition-colors">
               Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Skill Breakdown */}
          <div className="bg-white dark:bg-surface-dark border p-6 rounded-2xl shadow-sm">
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
                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${percent >= 70 ? 'bg-green-500' : 'bg-orange-500'}`} 
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
          <div className="bg-white dark:bg-surface-dark border p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-600" /> Recommended Learning Path
            </h3>
            {recommendedCourses.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-600">
                    {recommendationPlan.setLabel}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-zinc-950">
                    {recommendationPlan.tier === "proficient" ? "Proficient" : "Needs Development"} tier
                  </p>
                  <p className="mt-2 text-sm text-zinc-600">
                    Based on your {numericScore}% score, these course suggestions are tailored to your current designation and assessment set.
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">{recommendationPlan.rationale}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-zinc-500">
                    Course tier threshold: {COURSE_PROFICIENCY_THRESHOLD}%+
                  </p>
                </div>

                <div className="space-y-3">
                  {recommendedCourses.map((course) => (
                    <div key={course.code} className="rounded-2xl border border-zinc-100 bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
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

        {!isPass && (
          <div className="p-6 bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 rounded-2xl text-center">
            <p className="text-sm font-medium text-brand-900 dark:text-brand-400 mb-2">Ready to reattempt?</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-500 mb-4">Complete the courses above and submit your certificate on the dashboard to unlock a retry.</p>
          </div>
        )}

      </div>
    </div>
  );
}


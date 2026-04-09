import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Award, BookOpen, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

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

  // 2. Based on failed skills, fetch courses
  // The scorecard_json looks like: { "Skill Name": { "total": 5, "correct": 2 } }
  const scorecard = (attempt.scorecard_json || {}) as Record<string, { total: number, correct: number }>;
  const weakSkills = Object.entries(scorecard)
    .filter(([_, stats]) => {
      if (!stats || typeof stats.total !== 'number' || stats.total === 0) return false;
      return (stats.correct / stats.total) < 0.7;
    })
    .map(([skill]) => skill);

  // Fetch courses for those skills
  let recommendedCourses: any[] = [];
  if (weakSkills.length > 0) {
    const { data } = await supabase
      .from("courses")
      .select("*")
      .in("skill_focus", weakSkills);
    recommendedCourses = data || [];
  }

  const isPass = attempt.pass_fail === "pass";

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
                {recommendedCourses.map((course) => (
                  <a 
                    key={course.id} 
                    href={course.external_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:border-brand-500 transition-colors group"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-brand-600 uppercase mb-1">{course.skill_focus}</p>
                      <p className="text-sm font-semibold">{course.title}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-brand-600 transition-colors" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-zinc-500">
                 {isPass ? "You've mastered all core skills! No courses required." : "Great start! Review your incorrect answers and try again."}
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


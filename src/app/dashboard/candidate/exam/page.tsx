import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ExamClient from "./client-page";

export default async function ExamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("designation_level, role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "candidate_mvp") {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p>You have already passed the exam.</p>
      </div>
    );
  }

  // Determine which questions to fetch. If designation_level is null, fallback to Level 1
  const level = profile?.designation_level || "Level 1";

  // Fetch questions for this level
  const { data: questions } = await supabase
    .from("exam_questions")
    .select("*")
    .eq("designation_level", level);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-28 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <ExamClient 
          questions={questions || []} 
          designationLevel={level} 
          userId={user.id} 
        />
      </div>
    </div>
  );
}


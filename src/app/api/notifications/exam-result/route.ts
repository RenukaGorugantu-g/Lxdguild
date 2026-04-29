import { NextResponse } from "next/server";
import { getCourseRecommendations } from "@/lib/assessment";
import { createClient } from "@/utils/supabase/server";
import { notifyUser } from "@/lib/notifications";
import { getSiteUrl } from "@/lib/site-url";

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, score, passStatus, designationBucket, targetRole } = body as {
    userId?: string;
    score?: number;
    passStatus?: string;
    designationBucket?: string;
    targetRole?: string;
  };

  if (!userId || typeof score !== "number" || !passStatus) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const title = passStatus === "pass" ? "Assessment passed" : "Assessment result available";
  const message =
    passStatus === "pass"
      ? `You passed your LXD Guild assessment with a score of ${score}%.`
      : `You completed your LXD Guild assessment with a score of ${score}%. Review your scorecard and course recommendations before your reattempt.`;
  const recommendationPlan = getCourseRecommendations(designationBucket || "Intermediate", score);

  await notifyUser(userId, "exam_result", title, message, {
    score,
    pass_status: passStatus,
    designation_bucket: designationBucket || "",
    target_role: targetRole || "",
    scorecard_url: `${getSiteUrl()}/dashboard/candidate/scorecard`,
    recommendation_rationale: recommendationPlan.rationale,
    recommended_course_1_title: recommendationPlan.courses[0]?.title || "",
    recommended_course_1_link: recommendationPlan.courses[0]?.externalLink || "",
    recommended_course_2_title: recommendationPlan.courses[1]?.title || "",
    recommended_course_2_link: recommendationPlan.courses[1]?.externalLink || "",
    recommended_course_3_title: recommendationPlan.courses[2]?.title || "",
    recommended_course_3_link: recommendationPlan.courses[2]?.externalLink || "",
  });

  return NextResponse.json({ success: true });
}

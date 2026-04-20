import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getResourceSlug } from "@/lib/resource-catalog";
import { hasActiveMembership } from "@/lib/membership";

type MemberResourceProfile = {
  role?: string | null;
  membership_status?: string | null;
  membership_plan?: string | null;
  membership_expires_at?: string | null;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", `/members/resources/${slug}`);
    return NextResponse.redirect(loginUrl);
  }

  if (!admin) {
    return NextResponse.json({ error: "Missing admin credentials." }, { status: 500 });
  }

  const [profileResult, resourcesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, membership_status, membership_plan, membership_expires_at")
      .eq("id", user.id)
      .single(),
    admin.from("resources").select("title, file_link, source_file_link, premium_only"),
  ]);

  let profile: MemberResourceProfile | null = profileResult.data;
  if (profileResult.error?.code === "42703") {
    const fallback = await supabase
      .from("profiles")
      .select("role, membership_status")
      .eq("id", user.id)
      .single();
    profile = fallback.data;
  }

  const resources = resourcesResult.data;

  const resource = (resources || []).find((item) => getResourceSlug(item.file_link) === slug);
  if (!resource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  if (resource.premium_only && !hasActiveMembership(profile)) {
    const membershipUrl = new URL("/dashboard/membership", req.url);
    membershipUrl.searchParams.set("resource", slug);
    return NextResponse.redirect(membershipUrl);
  }

  return NextResponse.redirect(resource.source_file_link || resource.file_link);
}

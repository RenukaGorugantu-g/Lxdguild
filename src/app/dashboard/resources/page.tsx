import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { syncResourceCatalog } from "@/lib/resource-catalog";
import { getMembershipState } from "@/lib/membership";
import ResourcesCatalog from "./ResourcesCatalog";

type ResourcesPageProfile = {
  role?: string | null;
  membership_status?: string | null;
  membership_plan?: string | null;
  membership_expires_at?: string | null;
};

export default async function ResourcesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createAdminClient();

  if (!user) redirect("/login");

  await syncResourceCatalog();

  const [profileResult, resourcesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, membership_status, membership_plan, membership_expires_at")
      .eq("id", user.id)
      .single(),
    (admin || supabase).from("resources").select("id, category, title, file_link, premium_only").order("category"),
  ]);

  let profile: ResourcesPageProfile | null = profileResult.data;
  if (profileResult.error?.code === "42703") {
    const fallback = await supabase
      .from("profiles")
      .select("role, membership_status")
      .eq("id", user.id)
      .single();
    profile = fallback.data;
  }

  const resources = resourcesResult.data;

  const membership = getMembershipState(profile);

  const serializedResources = (resources || []).map((resource) => ({
    id: resource.id,
    title: resource.title,
    category: resource.category,
    premiumOnly: resource.premium_only,
    fileLink: resource.file_link,
  }));

  return (
    <div className="marketing-page min-h-screen">
      <div className="marketing-section pt-32 pb-16">
        <div className="marketing-container">
        <ResourcesCatalog resources={serializedResources} hasMembership={membership.active} />
        </div>
      </div>
    </div>
  );
}

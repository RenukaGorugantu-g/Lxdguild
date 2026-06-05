import { cache } from "react";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Metadata } from "next";
import { getPublicJobs } from "@/lib/public-jobs";

export function toJsonLdScriptProps(data: unknown) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}

export function buildFaqJsonLd(
  items: ReadonlyArray<{
    question: string;
    answer: string;
  }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildNoIndexMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export const getMarketplaceSeoCounts = cache(async () => {
  const admin = createAdminClient();

  if (!admin) {
    return {
      activeJobs: 0,
      employerProfiles: 0,
      verifiedProfiles: 0,
      activeMembers: 0,
    };
  }

  const [jobs, employers, verifiedProfiles, activeMembers] = await Promise.all([
    admin.from("jobs").select("*", { count: "exact", head: true }).eq("is_active", true),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .or("role.eq.employer_free,role.eq.employer_pro,role.eq.employer_premium"),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("verification_status", "verified"),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("membership_status", "active"),
  ]);

  return {
    activeJobs: jobs.count || 0,
    employerProfiles: employers.count || 0,
    verifiedProfiles: verifiedProfiles.count || 0,
    activeMembers: activeMembers.count || 0,
  };
});

export const getMarketplaceVisibilityCounts = cache(async () => {
  const [seoCounts, publicJobs] = await Promise.all([getMarketplaceSeoCounts(), getPublicJobs()]);

  return {
    publicJobCount: publicJobs.length,
    unlockedJobCount: seoCounts.activeJobs,
  };
});

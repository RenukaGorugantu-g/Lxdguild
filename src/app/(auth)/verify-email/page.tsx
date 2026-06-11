import type { Metadata } from "next";
import { Suspense } from "react";
import { buildNoIndexMetadata } from "@/lib/seo";
import VerifyEmailClient from "./verify-email-client";

export const metadata: Metadata = buildNoIndexMetadata(
  "Verify Your Email",
  "Confirm your LXD Guild email address to unlock your dashboard and matched jobs."
);

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailClient />
    </Suspense>
  );
}

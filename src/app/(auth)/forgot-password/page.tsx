import type { Metadata } from "next";
import { Suspense } from "react";
import { buildNoIndexMetadata } from "@/lib/seo";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = {
  ...buildNoIndexMetadata(
    "Reset Your Password",
    "Request a password reset link so you can get back into your LXD Guild account."
  ),
  alternates: {
    canonical: "/forgot-password",
  },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

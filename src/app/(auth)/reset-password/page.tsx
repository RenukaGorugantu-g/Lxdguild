import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/seo";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = {
  ...buildNoIndexMetadata(
    "Set a New Password",
    "Choose a new password for your LXD Guild account after opening the recovery link."
  ),
  alternates: {
    canonical: "/reset-password",
  },
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}

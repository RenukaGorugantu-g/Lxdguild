import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import LoginForm from "./LoginForm";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildNoIndexMetadata(
    "Sign In to LXD Guild",
    "Log in to access your LXD Guild dashboard, candidate tools, job applications, and employer workflows."
  ),
  alternates: {
    canonical: "/login",
  },
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

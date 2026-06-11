import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { loadProfile } from "@/lib/load-profile";

function sanitizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/")) return "/dashboard";
  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const tokenType = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const authCode = requestUrl.searchParams.get("code");
  const fallbackNext = sanitizeNextPath(requestUrl.searchParams.get("next"));
  const supabase = await createClient();

  let authError: string | null = null;

  if (tokenHash && tokenType) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: tokenType,
    });

    if (error) {
      authError = error.message;
    }
  } else if (authCode) {
    const { error } = await supabase.auth.exchangeCodeForSession(authCode);
    if (error) {
      authError = error.message;
    }
  } else {
    authError = "Missing confirmation token.";
  }

  if (authError) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", authError);
    return NextResponse.redirect(loginUrl);
  }

  const verifiedUrl = new URL("/email-verified", request.url);
  verifiedUrl.searchParams.set("next", fallbackNext);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    verifiedUrl.searchParams.set("signed_in", "0");
    return NextResponse.redirect(verifiedUrl);
  }

  const profile = await loadProfile<{ role?: string | null }>(supabase, user.id, "role");
  const role = profile?.role || (typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null);

  let destination = fallbackNext;
  if (role === "admin") destination = "/dashboard/admin";
  if (typeof role === "string" && role.startsWith("employer")) destination = "/dashboard/employer";
  if (role === "pro_member") destination = "/dashboard/employer";
  if (typeof role === "string" && role.startsWith("candidate") && !fallbackNext.startsWith("/dashboard/candidate")) {
    destination = "/dashboard/candidate/welcome?verified=1";
  }

  verifiedUrl.searchParams.set("signed_in", "1");
  verifiedUrl.searchParams.set("next", destination);
  if (user.email) {
    verifiedUrl.searchParams.set("email", user.email);
  }

  return NextResponse.redirect(verifiedUrl);
}

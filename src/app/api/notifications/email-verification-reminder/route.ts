import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { notifyUser, notifyUserByEmail } from "@/lib/notifications";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";
export const maxDuration = 300;

type ReminderProfile = {
  id: string;
  name: string | null;
  role: string | null;
  email: string | null;
  candidate_target_role: string | null;
};

type ReminderNotificationRow = {
  user_id: string;
  created_at: string;
};

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createSupabaseClient(url, serviceRoleKey);
}

function isBetween24And48HoursAgo(timestamp: string) {
  const createdAt = Date.parse(timestamp);
  if (!Number.isFinite(createdAt)) return false;

  const ageInHours = (Date.now() - createdAt) / (1000 * 60 * 60);
  return ageInHours >= 24 && ageInHours < 48;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestUrl = new URL(request.url);
  const targetEmail = requestUrl.searchParams.get("email")?.trim().toLowerCase() || "";
  const force = requestUrl.searchParams.get("force") === "1";
  const supabase = getServiceSupabase();

  try {
    const reminderNotifications = await supabase
      .from("notifications")
      .select("user_id, created_at")
      .eq("type", "email_verification_reminder")
      .gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());

    if (reminderNotifications.error) {
      throw new Error(reminderNotifications.error.message);
    }

    const remindedUserIds = new Set(
      ((reminderNotifications.data || []) as ReminderNotificationRow[]).map((row) => row.user_id).filter(Boolean)
    );

    const authUsers: Array<{
      id: string;
      email?: string;
      created_at?: string;
      email_confirmed_at?: string | null;
      user_metadata?: Record<string, unknown>;
    }> = [];

    let page = 1;
    const perPage = 200;

    while (true) {
      const usersResult = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });

      if (usersResult.error) {
        throw new Error(usersResult.error.message);
      }

      const batch = usersResult.data.users || [];
      authUsers.push(...batch);

      if (batch.length < perPage) break;
      page += 1;
    }

    const pendingUsers = authUsers.filter((user) => {
      const email = user.email?.trim().toLowerCase() || "";
      if (!email) return false;
      if (user.email_confirmed_at) return false;

      if (targetEmail) {
        return email === targetEmail;
      }

      if (force) return true;
      if (remindedUserIds.has(user.id)) return false;

      return isBetween24And48HoursAgo(user.created_at || "");
    });

    if (pendingUsers.length === 0) {
      return NextResponse.json({ success: true, sent: 0, skipped: 0, reason: "no_pending_unverified_users" });
    }

    const userIds = pendingUsers.map((user) => user.id);
    const profilesResult = await supabase
      .from("profiles")
      .select("id, name, role, email, candidate_target_role")
      .in("id", userIds);

    if (profilesResult.error) {
      throw new Error(profilesResult.error.message);
    }

    const profilesById = new Map(
      ((profilesResult.data || []) as ReminderProfile[]).map((profile) => [profile.id, profile])
    );

    let sent = 0;
    let skipped = 0;

    for (const user of pendingUsers) {
      const email = user.email?.trim() || "";
      if (!email) {
        skipped += 1;
        continue;
      }

      const profile = profilesById.get(user.id);
      const verifyPageUrl = `${getSiteUrl()}/verify-email?email=${encodeURIComponent(email)}&role=${encodeURIComponent(profile?.role || String(user.user_metadata?.role || "candidate_onhold"))}`;
      const subject = "You're almost in — just verify your email to see your matched L&D roles";
      const message = "You're almost in — just verify your email to see your matched L&D roles.";
      const payload = {
        type: "email_verification_reminder",
        recipient_email: email,
        recipient_name: profile?.name || String(user.user_metadata?.name || ""),
        role: profile?.role || String(user.user_metadata?.role || ""),
        target_role: profile?.candidate_target_role || String(user.user_metadata?.candidate_target_role || ""),
        verify_page_url: verifyPageUrl,
      };

      if (profile) {
        await notifyUser(user.id, "email_verification_reminder", subject, message, payload);
      } else {
        await notifyUserByEmail(email, subject, message, payload);
      }

      sent += 1;
    }

    return NextResponse.json({ success: true, sent, skipped });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown verification reminder error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

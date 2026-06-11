import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

type AuthAdminUser = {
  email?: string | null;
  email_confirmed_at?: string | null;
};

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase() || "";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Admin client is not configured." }, { status: 500 });
  }

  let page = 1;
  const perPage = 200;

  while (true) {
    const usersResult = await admin.auth.admin.listUsers({ page, perPage });

    if (usersResult.error) {
      return NextResponse.json({ error: usersResult.error.message }, { status: 500 });
    }

    const users = (usersResult.data.users || []) as AuthAdminUser[];
    const matchingUser = users.find((user) => user.email?.trim().toLowerCase() === email);

    if (matchingUser) {
      return NextResponse.json({
        exists: true,
        confirmed: Boolean(matchingUser.email_confirmed_at),
      });
    }

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  return NextResponse.json({ exists: false, confirmed: false });
}

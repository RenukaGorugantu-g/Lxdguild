import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "ATS decision overrides are currently disabled." },
    { status: 410 }
  );
}

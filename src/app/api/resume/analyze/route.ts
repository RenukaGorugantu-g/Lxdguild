import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Resume analysis is currently disabled." },
    { status: 410 }
  );
}

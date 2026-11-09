import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    token: process.env.ELECTRON_HEALTH_TOKEN ?? "dev",
  });
}
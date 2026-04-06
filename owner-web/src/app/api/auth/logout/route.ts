import { NextResponse } from "next/server";
import { clearOwnerSessionCookies } from "@/lib/session";

export async function POST() {
  await clearOwnerSessionCookies();
  return NextResponse.json({ success: true, message: "Logged out" });
}

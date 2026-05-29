import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifySync } from "otplib";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { code } = await req.json();
  if (!code?.trim()) return NextResponse.json({ error: "Code is required" }, { status: 400 });

  const { data: profile } = await supabaseAdmin.from("users").select("totp_secret").eq("id", user.id).single();
  const secret = profile?.totp_secret;
  if (!secret) return NextResponse.json({ error: "TOTP not configured for this account" }, { status: 400 });

  const { valid } = verifySync({ token: code.trim(), secret });
  if (!valid) return NextResponse.json({ error: "Incorrect code. Check your authenticator app and try again." }, { status: 400 });

  return NextResponse.json({ success: true });
}

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

  const { data: profile } = await supabaseAdmin.from("users").select("totp_secret_pending").eq("id", user.id).single();
  const secret = profile?.totp_secret_pending;
  if (!secret) return NextResponse.json({ error: "No pending TOTP setup found" }, { status: 400 });

  const { valid } = verifySync({ token: code.trim(), secret });
  if (!valid) return NextResponse.json({ error: "Incorrect code. Make sure your authenticator app is synced." }, { status: 400 });

  await supabaseAdmin.from("users").update({ totp_secret: secret, totp_enabled: true, totp_secret_pending: null }).eq("id", user.id);

  return NextResponse.json({ success: true });
}

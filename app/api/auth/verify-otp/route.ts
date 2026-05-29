import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json();
  if (!email?.trim() || !otp?.trim()) {
    return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("otp_codes")
    .select("*")
    .eq("email", email.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "No verification code found for this email. Please request a new one." }, { status: 400 });
  }

  if (new Date() > new Date(data.expires_at)) {
    await supabaseAdmin.from("otp_codes").delete().eq("id", data.id);
    return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 });
  }

  if (data.otp !== otp.trim()) {
    return NextResponse.json({ error: "Incorrect verification code. Please try again." }, { status: 400 });
  }

  await supabaseAdmin.from("otp_codes").delete().eq("id", data.id);
  return NextResponse.json({ verified: true });
}

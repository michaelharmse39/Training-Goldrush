import { NextRequest, NextResponse } from "next/server";
import { dbAdminSelect } from "@/lib/rest-admin";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function deleteOtp(id: string): Promise<void> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/otp_codes`);
  url.searchParams.set("id", `eq.${id}`);
  await fetch(url.toString(), {
    method: "DELETE",
    headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${SERVICE_KEY}` },
  });
}

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json() as { email?: string; otp?: string };
  if (!email?.trim() || !otp?.trim()) {
    return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
  }

  const rows = await dbAdminSelect<{ id: string; otp: string; expires_at: string }>(
    "otp_codes",
    { "email": `eq.${email.toLowerCase()}`, order: "created_at.desc", limit: "1" }
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "No verification code found for this email. Please request a new one." }, { status: 400 });
  }

  const record = rows[0];

  if (new Date() > new Date(record.expires_at)) {
    await deleteOtp(record.id);
    return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 });
  }

  if (record.otp !== otp.trim()) {
    return NextResponse.json({ error: "Incorrect verification code. Please try again." }, { status: 400 });
  }

  await deleteOtp(record.id);
  return NextResponse.json({ verified: true });
}

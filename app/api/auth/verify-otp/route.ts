import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json();
  if (!email?.trim() || !otp?.trim()) {
    return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
  }

  const key = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const snap = await adminDb.collection("pendingOtps").doc(key).get();

  if (!snap.exists) {
    return NextResponse.json({ error: "No verification code found for this email. Please request a new one." }, { status: 400 });
  }

  const data = snap.data()!;

  if (Date.now() > data.expiresAt) {
    await snap.ref.delete();
    return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 });
  }

  if (data.otp !== otp.trim()) {
    return NextResponse.json({ error: "Incorrect verification code. Please try again." }, { status: 400 });
  }

  // OTP is valid — delete it so it can't be reused
  await snap.ref.delete();

  return NextResponse.json({ verified: true });
}

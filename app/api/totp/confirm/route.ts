import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifySync } from "otplib";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code?.trim()) return NextResponse.json({ error: "Code is required" }, { status: 400 });

  const snap = await adminDb.collection("users").doc(uid).get();
  const data = snap.data();
  const secret = data?.totpSecretPending;
  if (!secret) return NextResponse.json({ error: "No pending TOTP setup found" }, { status: 400 });

  const { valid } = verifySync({ token: code.trim(), secret });
  if (!valid) return NextResponse.json({ error: "Incorrect code. Make sure your authenticator app is synced." }, { status: 400 });

  // Promote pending secret to active
  await adminDb.collection("users").doc(uid).set(
    { totpSecret: secret, totpEnabled: true, totpSecretPending: null },
    { merge: true }
  );

  return NextResponse.json({ success: true });
}

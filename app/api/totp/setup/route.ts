import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { authenticator } from "otplib";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let uid: string;
  let email: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
    email = decoded.email ?? uid;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const secret = authenticator.generateSecret();
  const uri = authenticator.keyuri(email, "Training Register – Gold Rush Group", secret);
  const qrCode = await QRCode.toDataURL(uri);

  // Store pending secret (not yet confirmed)
  await adminDb.collection("users").doc(uid).set({ totpSecretPending: secret }, { merge: true });

  return NextResponse.json({ qrCode, secret });
}

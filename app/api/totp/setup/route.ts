import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateSecret, generateURI } from "otplib";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const secret = generateSecret();
  const uri = generateURI({ issuer: "Training Register – Gold Rush Group", label: user.email ?? user.id, secret });
  const qrCode = await QRCode.toDataURL(uri);

  await supabaseAdmin.from("users").update({ totp_secret_pending: secret }).eq("id", user.id);

  return NextResponse.json({ qrCode, secret });
}

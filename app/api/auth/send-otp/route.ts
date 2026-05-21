import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import nodemailer from "nodemailer";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmail(to: string, otp: string) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? "Training Register <noreply@goldrushgroup.co.za>";

  if (!host || !user || !pass) {
    // In development without SMTP: log OTP to console
    console.log(`[OTP for ${to}]: ${otp}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to,
    subject: "Your Training Register verification code",
    text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#4f46e5">Training Register</h2>
        <p>Your verification code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#111;padding:16px 0">${otp}</div>
        <p style="color:#666;font-size:13px">This code expires in 10 minutes. Do not share it with anyone.</p>
        <p style="color:#999;font-size:12px">Gold Rush Group</p>
      </div>
    `,
  });
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store OTP in Firestore (keyed by email, overwrite any previous)
  const key = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
  await adminDb.collection("pendingOtps").doc(key).set({ email, otp, expiresAt });

  try {
    await sendEmail(email, otp);
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    // Still return success — OTP is logged to console in dev
  }

  return NextResponse.json({ sent: true });
}

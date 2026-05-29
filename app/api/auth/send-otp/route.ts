import { NextRequest, NextResponse } from "next/server";
import { dbAdminSelect, dbAdminInsert } from "@/lib/rest-admin";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function deleteOtpForEmail(email: string): Promise<void> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/otp_codes`);
  url.searchParams.set("email", `eq.${email}`);
  await fetch(url.toString(), {
    method: "DELETE",
    headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${SERVICE_KEY}` },
  });
}

async function sendOtpEmail(to: string, otp: string) {
  // Send via Supabase Auth magic link as a workaround if no SMTP configured,
  // OR use SendGrid if key is present.
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.log(`[OTP for ${to}]: ${otp}`);
    return;
  }

  const sgMail = await import("@sendgrid/mail");
  const fromRaw = process.env.SMTP_FROM ?? "noreply@goldrushgroup.co.za";
  const match = fromRaw.match(/^(.*?)\s*<(.+?)>$/);
  const from = match ? { name: match[1].trim(), email: match[2].trim() } : { email: fromRaw.trim() };

  sgMail.default.setApiKey(apiKey);
  await sgMail.default.send({
    from,
    to,
    subject: "Your Training Register verification code",
    text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
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
  const { email } = await req.json() as { email?: string };
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await deleteOtpForEmail(email.toLowerCase());
  await dbAdminInsert("otp_codes", { email: email.toLowerCase(), otp, expires_at: expiresAt });

  try {
    await sendOtpEmail(email, otp);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Failed to send OTP email:", message);
    return NextResponse.json({ error: "Failed to send email", detail: message }, { status: 500 });
  }

  return NextResponse.json({ sent: true });
}

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import sgMail from "@sendgrid/mail";

function randomPassword() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2) + "!9";
}

async function sendWelcomeEmail(to: string, resetLink: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromRaw = process.env.SMTP_FROM ?? "noreply@goldrushgroup.co.za";

  if (!apiKey) {
    console.log(`[PASSWORD SETUP LINK for ${to}]: ${resetLink}`);
    return;
  }

  // Parse "Name <email>" format into SendGrid object format
  const match = fromRaw.match(/^(.*?)\s*<(.+?)>$/);
  const from = match
    ? { name: match[1].trim(), email: match[2].trim() }
    : { email: fromRaw.trim() };

  console.log(`[SendGrid] Sending welcome email to ${to} from`, JSON.stringify(from));
  sgMail.setApiKey(apiKey);

  await sgMail.send({
    from,
    to,
    subject: "Set up your Training Register password",
    text: `You have been added to the Gold Rush Group Training Register.\n\nClick the link below to set your password:\n${resetLink}\n\nThis link expires in 1 hour.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#4f46e5">Training Register</h2>
        <p>You have been added to the <strong>Gold Rush Group Training Register</strong>.</p>
        <p>Click the button below to set your password and activate your account:</p>
        <a href="${resetLink}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Set My Password</a>
        <p style="color:#666;font-size:13px">This link expires in 1 hour. If you did not expect this email, please ignore it.</p>
        <p style="color:#999;font-size:12px">Gold Rush Group</p>
      </div>
    `,
  });
}

export async function GET() {
  try {
    const listResult = await adminAuth.listUsers();
    const users = await Promise.all(
      listResult.users.map(async (user) => {
        const snap = await adminDb.collection("users").doc(user.uid).get();
        const data = snap.data() ?? {};
        return {
          uid: user.uid,
          email: user.email ?? "",
          role: data.role ?? "staff",
          departmentId: data.departmentId ?? "",
          approved: data.approved !== false,
          selfRegistered: data.selfRegistered ?? false,
          totpEnabled: data.totpEnabled ?? false,
          createdAt: user.metadata.creationTime,
        };
      })
    );
    return NextResponse.json(users);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { email, role, departmentId } = await request.json();
    const user = await adminAuth.createUser({ email, password: randomPassword() });
    await adminDb.collection("users").doc(user.uid).set({
      role,
      email,
      departmentId: departmentId ?? "",
      approved: true,
    });

    // Send password setup email
    try {
      const resetLink = await adminAuth.generatePasswordResetLink(email);
      await sendWelcomeEmail(email, resetLink);
    } catch (emailErr: unknown) {
      const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
      const body = (emailErr as { response?: { body?: unknown } })?.response?.body;
      console.error("Failed to send welcome email:", msg, body ? JSON.stringify(body) : "");
    }

    return NextResponse.json({
      uid: user.uid,
      email,
      role,
      departmentId: departmentId ?? "",
      approved: true,
      selfRegistered: false,
      totpEnabled: false,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

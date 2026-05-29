import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
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

  const match = fromRaw.match(/^(.*?)\s*<(.+?)>$/);
  const from = match ? { name: match[1].trim(), email: match[2].trim() } : { email: fromRaw.trim() };

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
    const [{ data: authData }, { data: profiles }] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers(),
      supabaseAdmin.from("users").select("*"),
    ]);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const users = (authData?.users ?? []).map((u) => {
      const p = profileMap.get(u.id) ?? {};
      return {
        uid: u.id,
        email: u.email ?? "",
        role: p.role ?? "staff",
        departmentId: p.department_id ?? "",
        approved: p.approved !== false,
        selfRegistered: p.self_registered ?? false,
        totpEnabled: p.totp_enabled ?? false,
        createdAt: u.created_at,
      };
    });

    return NextResponse.json(users);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, role, departmentId } = await request.json();

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: randomPassword(),
      email_confirm: true,
    });
    if (createError) throw createError;

    const uid = created.user.id;
    await supabaseAdmin.from("users").insert({
      id: uid,
      email,
      role,
      department_id: departmentId || null,
      approved: true,
      self_registered: false,
      totp_enabled: false,
    });

    try {
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/update-password` },
      });
      if (linkData?.properties?.action_link) {
        await sendWelcomeEmail(email, linkData.properties.action_link);
      }
    } catch (emailErr: unknown) {
      console.error("Failed to send welcome email:", emailErr instanceof Error ? emailErr.message : emailErr);
    }

    return NextResponse.json({ uid, email, role, departmentId: departmentId ?? "", approved: true, selfRegistered: false, totpEnabled: false });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

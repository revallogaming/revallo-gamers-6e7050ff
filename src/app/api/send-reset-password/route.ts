import { NextResponse, NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {} // ignore parse errors

  try {
    const { email } = body;
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    try {
      await adminAuth.getUserByEmail(email);
    } catch (e) {
      return NextResponse.json({
        message: "Se o email estiver cadastrado, um link de recuperação será enviado."
      }, { status: 200 });
    }

    const link = await adminAuth.generatePasswordResetLink(email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://revallo.com"}/reset-password`,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Revallo" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Recuperação de Senha - Revallo",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A0C; color: #ffffff; padding: 40px; border-radius: 20px;">
          <h1 style="color: #0066FF; font-style: italic; margin-bottom: 24px;">REVALLO</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #9ca3af;">Você solicitou a recuperação de sua senha. Clique no botão abaixo para definir uma nova senha:</p>
          <div style="margin: 40px 0;">
            <a href="${link}" style="background-color: #0066FF; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; text-transform: uppercase;">Recuperar Senha</a>
          </div>
          <p style="font-size: 14px; color: #4b5563;">Se você não solicitou esta alteração, ignore este email.</p>
          <hr style="border: 0; border-top: 1px solid #1f2937; margin: 40px 0;">
          <p style="font-size: 12px; color: #4b5563;">© 2026 REVALLO TECHNOLOGIES. BUILT FOR GLORY.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: "Email de recuperação enviado com sucesso" }, { status: 200 });
  } catch (error: any) {
    console.error("Error sending reset email:", error);
    return NextResponse.json({ error: "Erro ao enviar email de recuperação" }, { status: 500 });
  }
}

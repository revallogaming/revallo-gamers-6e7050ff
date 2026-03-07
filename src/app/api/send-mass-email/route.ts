import { NextResponse, NextRequest } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch(e) {} // ignore parse errors

  try {
    const { emails, subject, tournamentTitle, message } = body;

    // Configure transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Send emails in batches if needed, but for now simple loop or BCC
    // BCC is more efficient for mass email
    await transporter.sendMail({
      from: `"Revallo" <${process.env.GMAIL_USER}>`,
      bcc: emails || [],
      subject: `${subject || ''} - ${tournamentTitle || ''}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A0C; color: #ffffff; padding: 40px; border-radius: 20px;">
          <h1 style="color: #0066FF; font-style: italic; margin-bottom: 24px;">REVALLO</h1>
          <h2 style="color: #ffffff; margin-bottom: 16px;">Olá, participante de ${tournamentTitle || ''}!</h2>
          <div style="font-size: 16px; line-height: 1.6; color: #9ca3af; white-space: pre-wrap;">${message || ''}</div>
          <hr style="border: 0; border-top: 1px solid #1f2937; margin: 40px 0;">
          <p style="font-size: 12px; color: #4b5563;">© 2026 REVALLO TECHNOLOGIES. BUILT FOR GLORY.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, count: emails?.length || 0 }, { status: 200 });
  } catch (error: any) {
    console.error("Error sending mass email:", error);
    return NextResponse.json({ error: "Erro ao enviar emails: " + error.message }, { status: 500 });
  }
}

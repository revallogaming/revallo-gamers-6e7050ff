import { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "../src/lib/firebaseAdmin";
import nodemailer from "nodemailer";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await verifyToken(req);
    const {
      recipientEmail,
      recipientNickname,
      senderNickname,
      tournamentTitle,
      tournamentId,
      role,
      teamName,
    } = req.body;

    if (!recipientEmail || !tournamentId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const roleLabels: Record<string, string> = {
      player: "Jogador",
      coach: "Coach",
      analista: "Analista",
      captain: "Capitão",
    };
    const roleLabel = roleLabels[role] || "Jogador";

    const inviteUrl = `https://revallo.com.br/tournaments/${tournamentId}?join=true&role=${role}${teamName ? `&team=${encodeURIComponent(teamName)}` : ""}`;

    const subject = `🎮 Convite para o torneio "${tournamentTitle}" — Revallo`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="background:#0A0A0C;color:#fff;font-family:Arial,sans-serif;padding:40px 20px;margin:0;">
        <div style="max-width:560px;margin:0 auto;background:#0D0B1A;border-radius:24px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
          <div style="padding:32px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;">
            <div style="display:inline-block;background:rgba(124,58,237,0.15);border-radius:16px;padding:16px 24px;margin-bottom:16px;">
              <span style="font-size:32px;">🏆</span>
            </div>
            <h1 style="margin:0;font-size:22px;font-weight:900;font-style:italic;letter-spacing:-1px;text-transform:uppercase;">
              Você foi convidado!
            </h1>
            <p style="margin:8px 0 0;color:#888;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;">
              Convite de Torneio — Revallo
            </p>
          </div>

          <div style="padding:32px;">
            <p style="color:#ccc;font-size:13px;line-height:1.6;">
              Olá <strong>${recipientNickname || recipientEmail}</strong>,<br><br>
              <strong style="color:#7c3aed;">${senderNickname}</strong> te convidou para participar do torneio
              <strong>"${tournamentTitle}"</strong> na Revallo como <strong>${roleLabel}</strong>${teamName ? ` do time <strong>"${teamName}"</strong>` : ""}.
            </p>

            <div style="background:rgba(124,58,237,0.08);border-radius:16px;border:1px solid rgba(124,58,237,0.2);padding:20px;margin:24px 0;">
              <p style="margin:0 0 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:#7c3aed;">Sua Função</p>
              <p style="margin:0;font-size:18px;font-weight:900;font-style:italic;text-transform:uppercase;">${roleLabel}</p>
              ${teamName ? `<p style="margin:4px 0 0;font-size:12px;color:#888;">Time: ${teamName}</p>` : ""}
            </div>

            <a href="${inviteUrl}" style="display:block;background:#7c3aed;color:#fff;text-decoration:none;padding:16px;border-radius:16px;text-align:center;font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:2px;font-size:12px;margin:16px 0;">
              ACEITAR CONVITE →
            </a>

            <p style="color:#555;font-size:10px;text-align:center;margin-top:24px;">
              Este convite é válido apenas para <strong>${recipientEmail}</strong>.<br>
              Se não esperava este convite, ignore este e-mail.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Revallo Games" <${process.env.GMAIL_USER}>`,
      to: recipientEmail,
      subject,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    console.error("Error sending invite email:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: message });
  }
}

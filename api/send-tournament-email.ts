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
      email,
      tournamentTitle,
      game,
      startDate,
      entryFee,
      maxParticipants,
      prizeDescription,
      pixKey,
      type = "creation",
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    let subject = "";
    let html = "";

    if (type === "creation") {
      subject = `Torneio Criado: ${tournamentTitle}`;
      html = `
        <h1>Seu torneio foi criado com sucesso!</h1>
        <p><strong>Torneio:</strong> ${tournamentTitle}</p>
        <p><strong>Jogo:</strong> ${game}</p>
        <p><strong>Data de Início:</strong> ${new Date(startDate).toLocaleString("pt-BR")}</p>
        <p><strong>Inscrição:</strong> R$ ${(entryFee / 1).toFixed(2)}</p>
        <p><strong>Máximo de Participantes:</strong> ${maxParticipants}</p>
        ${prizeDescription ? `<p><strong>Premiação:</strong> ${prizeDescription}</p>` : ""}
        <p><strong>Sua Chave PIX:</strong> ${pixKey}</p>
        <br>
        <p>Boa sorte com seu torneio!</p>
      `;
    } else if (type === "registration") {
      subject = `Inscrição Confirmada: ${tournamentTitle}`;
      html = `
        <h1>Sua inscrição foi confirmada!</h1>
        <p><strong>Torneio:</strong> ${tournamentTitle}</p>
        <p><strong>Data de Início:</strong> ${new Date(startDate).toLocaleString("pt-BR")}</p>
        <p><strong>Taxa de Inscrição:</strong> R$ ${(entryFee / 100).toFixed(2)}</p>
        <br>
        <p>Prepare-se para a batalha!</p>
      `;
    }

    await transporter.sendMail({
      from: `"Revallo Games" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    console.error("Error sending tournament email:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: message });
  }
}

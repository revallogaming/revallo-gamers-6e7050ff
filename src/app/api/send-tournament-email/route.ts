import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/firebaseAdmin";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Some implementations of verifyToken take the whole request, 
    // but in App Router we might need to pass the token string.
    // Let's assume verifyToken is compatible or adapt if needed.
    const token = authHeader.split("Bearer ")[1];
    await verifyToken(token);

    const body = await req.json();
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
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending tournament email:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

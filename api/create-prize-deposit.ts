import { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb, verifyToken } from "../src/lib/firebaseAdmin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const decodedToken = await verifyToken(req);
    const userId = decodedToken.uid;
    const { tournament_id, amount_brl } = req.body;

    if (!tournament_id || !amount_brl) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { adminAuth } = require("../src/lib/firebaseAdmin");
    const userRecord = await adminAuth.getUser(userId);

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({ error: "Integração de pagamento não configurada" });
    }

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": require("crypto").randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: Number(amount_brl),
        description: `Depósito Prêmio Torneio ${tournament_id}`,
        payment_method_id: "pix",
        payer: {
          email: userRecord.email || "support@revallo.com.br",
        },
        notification_url: process.env.MP_PRODUCTION_WEBHOOK_URL,
        metadata: {
          user_id: userId,
          type: "prize_deposit",
          tournament_id: tournament_id,
        },
      }),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Mercado Pago Error:", errorText);
      return res.status(500).json({ error: "Erro ao gerar PIX" });
    }

    const mpData = await mpResponse.json();
    const qr_code = mpData.point_of_interaction?.transaction_data?.qr_code;
    const qr_code_base64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64;
    const mercadopago_id = String(mpData.id);

    // Create deposit record
    const depositRef = adminDb.collection("prize_deposits").doc();
    await depositRef.set({
      tournament_id,
      organizer_id: userId,
      amount_brl,
      mercadopago_id,
      qr_code,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    return res.status(200).json({
      qr_code,
      qr_code_base64,
      payment_id: mercadopago_id,
    });
  } catch (error: unknown) {
    console.error("Error creating prize deposit:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(401).json({ error: message });
  }
}

import { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb, verifyToken } from "../src/lib/firebaseAdmin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const decodedToken = await verifyToken(req);
    const userId = decodedToken.uid;
    const { tournament_id, email, amount_brl } = req.body;

    if (!tournament_id || !email || !amount_brl) {
      return res.status(400).json({ error: "Missing required fields" });
    }

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
        description: `Inscrição Torneio ${tournament_id}`,
        payment_method_id: "pix",
        payer: {
          email: email,
        },
        notification_url: process.env.MP_PRODUCTION_WEBHOOK_URL,
        metadata: {
          user_id: userId,
          type: "tournament_registration",
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

    // Create payment intent record
    const paymentRef = adminDb.collection("registration_payments").doc();
    await paymentRef.set({
      tournament_id,
      user_id: userId,
      email,
      amount_brl,
      mercadopago_id,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    return res.status(200).json({
      qr_code,
      qr_code_base64,
      payment_id: mercadopago_id,
    });
  } catch (error: unknown) {
    console.error("Error creating registration PIX:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(401).json({ error: message });
  }
}

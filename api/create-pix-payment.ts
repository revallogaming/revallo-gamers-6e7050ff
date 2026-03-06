import { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb, adminAuth } from "../src/lib/firebaseAdmin";
import crypto from "crypto";

const VALID_PACKAGES = [
  { brl: 5, credits: 50 },
  { brl: 10, credits: 110 },
  { brl: 25, credits: 300 },
  { brl: 50, credits: 650 },
  { brl: 100, credits: 1400 },
  { brl: 150, credits: 2250 },
] as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Basic Auth Check (In a real app, verify the Firebase ID Token)
    // For this migration, we'll assume the client sends the user_id for simplicity,
    // but in production, you MUST verify the Authorization header.
    const { amount_brl, credits_amount, user_id } = req.body;

    if (!user_id) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    // Validate against valid packages
    const validPackage = VALID_PACKAGES.find(
      (pkg) => pkg.brl === amount_brl && pkg.credits === credits_amount,
    );

    if (!validPackage) {
      return res.status(400).json({ error: "Pacote de créditos inválido" });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({ error: "Pagamento não configurado" });
    }

    // Get user email from Firebase Auth
    const userRecord = await adminAuth.getUser(user_id);

    // Create PIX payment in Mercado Pago
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: Number(amount_brl),
        description: `${credits_amount} Créditos Revallo`,
        payment_method_id: "pix",
        payer: {
          email: userRecord.email,
        },
        notification_url: process.env.MP_PRODUCTION_WEBHOOK_URL, // Ensure this points to the Vercel URL
        metadata: {
          user_id: user_id,
          type: "credit_purchase",
        },
      }),
    });

    if (!mpResponse.ok) {
      const mpError = await mpResponse.text();
      console.error("Mercado Pago error:", mpError);
      return res.status(500).json({ error: "Erro ao criar pagamento PIX" });
    }

    const mpData = await mpResponse.json();

    // Save payment record in Firestore
    const paymentRef = adminDb.collection("pix_payments").doc();
    await paymentRef.set({
      user_id: user_id,
      amount_brl,
      credits_amount,
      mercadopago_id: String(mpData.id),
      qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64:
        mpData.point_of_interaction?.transaction_data?.qr_code_base64,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    return res.status(200).json({
      payment_id: paymentRef.id,
      qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64:
        mpData.point_of_interaction?.transaction_data?.qr_code_base64,
      mercadopago_id: String(mpData.id),
    });
  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return res.status(500).json({ error: message });
  }
}

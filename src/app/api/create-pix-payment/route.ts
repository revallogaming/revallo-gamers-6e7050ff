import { NextResponse, NextRequest } from "next/server";
import { adminDb, adminAuth, verifyToken } from "@/lib/firebaseAdmin";
import crypto from "crypto";

const VALID_PACKAGES = [
  { brl: 5, credits: 50 },
  { brl: 10, credits: 110 },
  { brl: 25, credits: 300 },
  { brl: 50, credits: 650 },
  { brl: 100, credits: 1400 },
  { brl: 150, credits: 2250 },
] as const;

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch(e) {} // ignore parse errors

  try {
    // Verify Firebase ID Token
    const decodedToken = await verifyToken(req);
    const authUserId = decodedToken.uid;

    const { amount_brl, credits_amount, user_id } = body;

    if (!user_id || authUserId !== user_id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Validate against valid packages
    const validPackage = VALID_PACKAGES.find(
      (pkg) => pkg.brl === amount_brl && pkg.credits === credits_amount,
    );

    if (!validPackage) {
      return NextResponse.json({ error: "Pacote de créditos inválido" }, { status: 400 });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: "Pagamento não configurado" }, { status: 500 });
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
      return NextResponse.json({ error: "Erro ao criar pagamento PIX" }, { status: 500 });
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

    return NextResponse.json({
      payment_id: paymentRef.id,
      qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64:
        mpData.point_of_interaction?.transaction_data?.qr_code_base64,
      mercadopago_id: String(mpData.id),
    }, { status: 200 });
  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

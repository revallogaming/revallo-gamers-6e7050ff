import { NextResponse, NextRequest } from "next/server";
import { adminDb, verifyToken } from "@/lib/firebaseAdmin";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch(e) {} // ignore parse errors

  try {
    const decodedToken = await verifyToken(req);
    const userId = decodedToken.uid;
    const { 
      tournament_id, 
      email, 
      amount_brl,
      team_id,
      team_name,
      role,
      pix_key,
      pix_key_type
    } = body;

    if (!tournament_id || !email || !amount_brl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: "Integração de pagamento não configurada" }, { status: 500 });
    }

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": crypto.randomUUID(),
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
      return NextResponse.json({ error: "Erro ao gerar PIX" }, { status: 500 });
    }

    const mpData = await mpResponse.json();
    const qr_code = mpData.point_of_interaction?.transaction_data?.qr_code;
    const qr_code_base64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64;
    const mercadopago_id = String(mpData.id);

    // Create payment intent record with full registration metadata
    const paymentRef = adminDb.collection("registration_payments").doc();
    await paymentRef.set({
      tournament_id,
      user_id: userId,
      email,
      amount_brl,
      mercadopago_id,
      status: "pending",
      // Metadata for enrollment
      team_id: team_id || null,
      team_name: team_name || null,
      role: role || "player",
      pix_key: pix_key || null,
      pix_key_type: pix_key_type || null,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      qr_code,
      qr_code_base64,
      payment_id: mercadopago_id,
    }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error creating registration PIX:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

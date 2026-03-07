import { NextResponse, NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch(e) {} // ignore parse errors

  try {
    // Verify signature
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Webhook security not configured" }, { status: 500 });
    }

    const xSignature = req.headers.get("x-signature") as string;
    const xRequestId = req.headers.get("x-request-id") as string;
    const dataId = body.data?.id || req.nextUrl.searchParams.get('data.id');

    if (xSignature && xRequestId && dataId) {
        const parts = xSignature.split(',');
        let ts = '';
        let v1 = '';
        parts.forEach(part => {
            const [key, value] = part.split('=');
            if (key === 'ts') ts = value;
            if (key === 'v1') v1 = value;
        });
        
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
        const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
        if (hmac !== v1) {
             return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
    }

    // Only process payment notifications
    if (body.type !== "payment" || body.action !== "payment.updated") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return NextResponse.json({ error: "No payment ID" }, { status: 400 });
    }

    // Get payment details from Mercado Pago
    const accessToken = process.env.MP_ACCESS_TOKEN;
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!mpResponse.ok) {
      return NextResponse.json({ error: "MP API error" }, { status: 500 });
    }

    const mpPayment = await mpResponse.json();
    const metadata = mpPayment.metadata;

    if (mpPayment.status === "approved") {
      // Handle different types of payments based on metadata
      if (metadata?.type === "credit_purchase") {
        const userId = metadata.user_id;

        // Update payment and add credits in a transaction
        await adminDb.runTransaction(async (transaction) => {
          const paymentsQuery = await adminDb
            .collection("pix_payments")
            .where("mercadopago_id", "==", String(paymentId))
            .limit(1)
            .get();

          if (paymentsQuery.empty) throw new Error("Payment not found");
          const paymentDoc = paymentsQuery.docs[0];
          const paymentData = paymentDoc.data();

          if (paymentData.status === "confirmed") return;

          transaction.update(paymentDoc.ref, {
            status: "confirmed",
            paid_at: new Date().toISOString(),
          });

          const userCreditsRef = adminDb.collection("user_credits").doc(userId);
          const userCreditsDoc = await transaction.get(userCreditsRef);
          const currentBalance = userCreditsDoc.exists
            ? userCreditsDoc.data()?.balance || 0
            : 0;

          transaction.set(
            userCreditsRef,
            {
              balance: currentBalance + paymentData.credits_amount,
              updated_at: new Date().toISOString(),
            },
            { merge: true },
          );

          const transactionRef = adminDb
            .collection("credit_transactions")
            .doc();
          transaction.set(transactionRef, {
            user_id: userId,
            amount: paymentData.credits_amount,
            type: "purchase",
            description: `Compra de ${paymentData.credits_amount} créditos via PIX`,
            reference_id: paymentDoc.id,
            created_at: new Date().toISOString(),
          });
        });
      }
      // Add other types (tournament_registration, etc.) here
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

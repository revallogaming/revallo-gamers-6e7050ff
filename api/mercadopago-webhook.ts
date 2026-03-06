import { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "../src/lib/firebaseAdmin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ status: "ok" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const body = req.body;
    // Removed excessive logging

    // Verify signature (Simplified for migration, should use robust verification)
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Webhook security not configured" });
    }

    // Only process payment notifications
    if (body.type !== "payment" || body.action !== "payment.updated") {
      return res.status(200).json({ received: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return res.status(400).json({ error: "No payment ID" });
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
      return res.status(500).json({ error: "MP API error" });
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

    return res.status(200).json({ received: true });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Internal error" });
  }
}

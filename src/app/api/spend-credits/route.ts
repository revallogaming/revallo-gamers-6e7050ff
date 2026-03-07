import { NextResponse, NextRequest } from "next/server";
import { adminDb, verifyToken } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {} // ignore parse errors

  try {
    const decodedToken = await verifyToken(req);
    const authUserId = decodedToken.uid;
    const { user_id, amount, type, description, reference_id } = body;

    // Ensure the authenticated user is spending their own credits
    if (authUserId !== user_id) {
      return NextResponse.json({ message: "Forbidden: Cannot spend credits for another user" }, { status: 403 });
    }

    const userCreditsRef = adminDb.collection("user_credits").doc(user_id);

    await adminDb.runTransaction(async (transaction) => {
      const userCreditsDoc = await transaction.get(userCreditsRef);

      if (!userCreditsDoc.exists) {
        throw new Error("User credits document not found");
      }

      const currentBalance = userCreditsDoc.data()?.balance || 0;

      if (currentBalance < amount) {
        throw new Error("Insufficient credits");
      }

      const newBalance = currentBalance - amount;

      // Update balance
      transaction.update(userCreditsRef, {
        balance: newBalance,
        updated_at: new Date().toISOString(),
      });

      // Create transaction record
      const transactionRef = adminDb.collection("credit_transactions").doc();
      transaction.set(transactionRef, {
        user_id,
        amount: -Math.abs(amount), // ensure deduction
        type,
        description,
        reference_id: reference_id || null,
        created_at: new Date().toISOString(),
      });
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error spending credits:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ message: message }, { status: 400 });
  }
}

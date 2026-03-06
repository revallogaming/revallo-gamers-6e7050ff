import { NextRequest, NextResponse } from "next/server";
import { adminDb, verifyToken } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    // ── Authentication ─────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await verifyToken(token);

    const body = await req.json();
    const { user_id, amount, type, description, reference_id } = body;

    // Enforce: caller can only spend their own credits
    if (!user_id || decoded.uid !== user_id) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 403 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: "Valor inválido" }, { status: 400 });
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
        amount,
        type,
        description,
        reference_id: reference_id || null,
        created_at: new Date().toISOString(),
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error spending credits:", error);
    return NextResponse.json(
      { message: error?.message || "Internal Server Error" },
      { status: 400 }
    );
  }
}


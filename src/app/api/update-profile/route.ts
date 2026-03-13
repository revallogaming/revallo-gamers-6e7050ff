import { NextRequest, NextResponse } from "next/server";
import { adminDb, verifyToken } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await verifyToken(token);
    const userId = decodedToken.uid;

    const { avatarUrl, isCustom } = await req.json();

    if (!avatarUrl) {
      return NextResponse.json({ error: "Avatar URL is required" }, { status: 400 });
    }

    const CUSTOM_AVATAR_COST = 50;

    // Use a transaction for atomic credit deduction and profile update
    await adminDb.runTransaction(async (transaction: any) => {
      const profileRef = adminDb.collection("profiles").doc(userId);
      const creditsRef = adminDb.collection("user_credits").doc(userId);

      if (isCustom) {
        const creditsDoc = await transaction.get(creditsRef);
        const currentBalance = creditsDoc.exists ? (creditsDoc.data()?.balance || 0) : 0;

        if (currentBalance < CUSTOM_AVATAR_COST) {
          throw new Error("Saldo insuficiente de créditos");
        }

        transaction.update(creditsRef, {
          balance: currentBalance - CUSTOM_AVATAR_COST,
          updated_at: new Date().toISOString(),
        });

        // Record transaction
        const transRef = adminDb.collection("credit_transactions").doc();
        transaction.set(transRef, {
          user_id: userId,
          amount: -CUSTOM_AVATAR_COST,
          type: "custom_avatar",
          description: "Upload de foto de perfil personalizada",
          created_at: new Date().toISOString(),
        });
      }

      transaction.update(profileRef, {
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating profile avatar:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

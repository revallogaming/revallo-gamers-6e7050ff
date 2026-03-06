import { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb, verifyToken } from "../src/lib/firebaseAdmin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { user_id, amount, type, description, reference_id } = req.body;

  if (!user_id || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const decodedToken = await verifyToken(req);
    const authUserId = decodedToken.uid;
    
    // Ensure the authenticated user is spending their own credits
    if (authUserId !== user_id) {
        return res.status(403).json({ message: "Forbidden: Cannot spend credits for another user" });
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

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    console.error("Error spending credits:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(400).json({ message: message });
  }
}

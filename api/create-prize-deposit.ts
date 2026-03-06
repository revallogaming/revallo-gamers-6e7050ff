import { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb, verifyToken } from "../src/lib/firebaseAdmin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const decodedToken = await verifyToken(req);
    const userId = decodedToken.uid;
    const { tournament_id, amount_brl } = req.body;

    if (!tournament_id || !amount_brl) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Mocking Mercado Pago integration for now as it was a Supabase Edge Function
    // In a real scenario, this would call Mercado Pago SDK
    const qr_code =
      "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-42661417400052040000530398654041.005802BR5913REVALLO GAME6009SAO PAULO62070503***6304E2CA";
    const qr_code_base64 =
      "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAABlBMVEUAAAD///+l2Z/dAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAWklEQVRIie2YQQ4AIQgDwfX/j86Lp8ZEL9pDQAnMvIuIkiRJkiRJkiRJkrS/mD8A8I8A/CMA/wiYv0D6F0j/AulfIP0LpH+B9C+Q/gXyP/8T8D8B/xPwPwH/E/D9ALvXEz9B78R2AAAAAElFTkSuQmCC";
    const mercadopago_id = "123456789";

    // Create deposit record
    const depositRef = adminDb.collection("prize_deposits").doc();
    await depositRef.set({
      tournament_id,
      organizer_id: userId,
      amount_brl,
      mercadopago_id,
      qr_code,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    return res.status(200).json({
      qr_code,
      qr_code_base64,
      payment_id: mercadopago_id,
    });
  } catch (error: unknown) {
    console.error("Error creating prize deposit:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(401).json({ error: message });
  }
}

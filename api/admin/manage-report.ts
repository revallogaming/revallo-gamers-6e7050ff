import { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb, verifyToken } from "../../src/lib/firebaseAdmin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const decodedToken = await verifyToken(req);

    // Check if requester is admin
    const rolesSnapshot = await adminDb
      .collection("user_roles")
      .where("user_id", "==", decodedToken.uid)
      .where("role", "==", "admin")
      .get();

    if (rolesSnapshot.empty) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Admin access required" });
    }

    const { action, reportId, data } = req.body;

    if (!reportId && action !== "delete") {
      // logic for action
    }

    switch (action) {
      case "update":
        await adminDb
          .collection("reports")
          .doc(reportId)
          .update({
            status: data.status,
            admin_notes: data.notes || null,
            reviewed_by: decodedToken.uid,
            reviewed_at: new Date().toISOString(),
          });
        break;

      case "delete":
        await adminDb.collection("reports").doc(reportId).delete();
        break;

      default:
        return res.status(400).json({ error: "Invalid action" });
    }

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    console.error(`Error in admin manage-report (${req.body.action}):`, error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: message });
  }
}

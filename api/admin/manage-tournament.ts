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

    const { action, tournamentId, isMini, data } = req.body;

    if (!tournamentId) {
      return res.status(400).json({ error: "Missing tournamentId" });
    }

    const collectionName = isMini ? "mini_tournaments" : "tournaments";

    switch (action) {
      case "update_status":
        await adminDb.collection(collectionName).doc(tournamentId).update({
          status: data.status,
          updated_at: new Date().toISOString(),
        });
        break;

      case "toggle_highlight":
        await adminDb
          .collection(collectionName)
          .doc(tournamentId)
          .update({
            is_highlighted: data.is_highlighted,
            highlighted_until: data.is_highlighted
              ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          });
        break;

      case "delete": {
        await adminDb.collection(collectionName).doc(tournamentId).delete();
        // Also delete registrations / participants if needed
        const participantsCol = isMini
          ? "mini_tournament_participants"
          : "tournament_participants";
        const participants = await adminDb
          .collection(participantsCol)
          .where("tournament_id", "==", tournamentId)
          .get();
        const batch = adminDb.batch();
        participants.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        break;
      }

      default:
        return res.status(400).json({ error: "Invalid action" });
    }

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    console.error(
      `Error in admin manage-tournament (${req.body.action}):`,
      error,
    );
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: message });
  }
}

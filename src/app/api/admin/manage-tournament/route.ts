import { NextResponse, NextRequest } from "next/server";
import { adminDb, verifyToken } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch(e) {} // ignore parse errors

  try {
    const decodedToken = await verifyToken(req);

    // Check if requester is admin
    const rolesSnapshot = await adminDb
      .collection("user_roles")
      .where("user_id", "==", decodedToken.uid)
      .where("role", "==", "admin")
      .get();

    if (rolesSnapshot.empty) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const { action, tournamentId, isMini, data } = body;

    if (!tournamentId) {
      return NextResponse.json({ error: "Missing tournamentId" }, { status: 400 });
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
        participants.docs.forEach((doc: any) => batch.delete(doc.ref));
        await batch.commit();
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error(
      `Error in admin manage-tournament (${body.action}):`,
      error,
    );
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

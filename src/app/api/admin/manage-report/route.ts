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

    const { action, reportId, data } = body;

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
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error(`Error in admin manage-report`, error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

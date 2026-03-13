import { NextResponse, NextRequest } from "next/server";
import { adminDb, adminAuth, verifyToken } from "@/lib/firebaseAdmin";

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

    const { action, userId, amount, role, reason, newPassword } = body;

    if (!userId && action !== "stats") {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    switch (action) {
      case "add_credits":
        await adminDb.runTransaction(async (transaction: any) => {
          const creditsRef = adminDb.collection("user_credits").doc(userId);
          const creditsDoc = await transaction.get(creditsRef);
          const currentBalance = creditsDoc.exists
            ? creditsDoc.data()?.balance || 0
            : 0;
          transaction.set(
            creditsRef,
            {
              balance: currentBalance + amount,
              updated_at: new Date().toISOString(),
            },
            { merge: true },
          );

          // Record transaction
          const transRef = adminDb.collection("credit_transactions").doc();
          transaction.set(transRef, {
            user_id: userId,
            amount: amount,
            type: amount > 0 ? "admin_add" : "admin_remove",
            description: `Administrativo: ${amount > 0 ? "Adição" : "Remoção"} de créditos`,
            created_at: new Date().toISOString(),
          });
        });
        break;

      case "set_credits":
        await adminDb.collection("user_credits").doc(userId).set(
          {
            balance: amount,
            updated_at: new Date().toISOString(),
          },
          { merge: true },
        );
        break;

      case "add_role":
        const roleRef = adminDb
          .collection("user_roles")
          .doc(`${userId}_${role}`);
        await roleRef.set({
          user_id: userId,
          role: role,
          created_at: new Date().toISOString(),
        });
        break;

      case "remove_role":
        await adminDb
          .collection("user_roles")
          .doc(`${userId}_${role}`)
          .delete();
        break;

      case "toggle_ban": {
        const { banned } = body;
        await adminDb
          .collection("profiles")
          .doc(userId)
          .update({
            is_banned: banned,
            ban_reason: reason || null,
            updated_at: new Date().toISOString(),
          });
        break;
      }

      case "delete_user": {
        // Delete from Auth
        await adminAuth.deleteUser(userId);
        // Delete profile, credits, roles
        await adminDb.collection("profiles").doc(userId).delete();
        await adminDb.collection("user_credits").doc(userId).delete();
        const userRoles = await adminDb
          .collection("user_roles")
          .where("user_id", "==", userId)
          .get();
        const batch = adminDb.batch();
        userRoles.docs.forEach((doc: any) => batch.delete(doc.ref));
        await batch.commit();
        break;
      }

      case "reset_password":
        await adminAuth.updateUser(userId, {
          password: newPassword,
        });
        break;

      case "update_verification": {
        const { type } = body;
        await adminDb
          .collection("profiles")
          .doc(userId)
          .update({
            verification_type: type,
            updated_at: new Date().toISOString(),
          });
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error(`Error in admin manage-user (${body.action}):`, error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
